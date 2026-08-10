import { getDatabase } from "../database/sqlite";

export type CartItem = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  buyingPrice: number;
  stockQuantity: number;
  unit: string;
};

export type CreateSaleInput = {
  items: CartItem[];
  discount?: number;
  amountPaid: number;
  paymentMethod?: "cash" | "mobile_money" | "card";
  createdBy: number;
};
export type SaleItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  buyingPrice: number;
  subtotal: number;
};

export type SaleDetails = {
  sale: Sale;
  items: SaleItem[];
};
export type Sale = {
  id: number;
  receiptNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: string;
  createdBy: number;
  createdAt: string;
};

class SaleService {
  /**
   * Generates a unique receipt number.
   *
   * Example:
   * SP-20260808-103045-123
   */
  private generateReceiptNumber(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const milliseconds = String(
      now.getMilliseconds()
    ).padStart(3, "0");

    return `SP-${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
  }

  /**
   * Creates a completed sale.
   *
   * The sale, sale items, stock deduction,
   * and stock movement are all performed
   * inside one SQLite transaction.
   */
  async createSale(
    data: CreateSaleInput
  ): Promise<number> {
    const db = await getDatabase();

    if (!data.items || data.items.length === 0) {
      throw new Error(
        "Cannot complete a sale with an empty cart."
      );
    }

    if (!data.createdBy) {
      throw new Error(
        "Unable to identify the current user."
      );
    }

    if (
      Number.isNaN(data.amountPaid) ||
      data.amountPaid < 0
    ) {
      throw new Error(
        "Please enter a valid amount paid."
      );
    }

    const discount = data.discount ?? 0;

    if (
      Number.isNaN(discount) ||
      discount < 0
    ) {
      throw new Error(
        "Discount cannot be negative."
      );
    }

    let subtotal = 0;

    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new Error(
          `Invalid quantity for ${item.productName}.`
        );
      }

      if (item.unitPrice < 0) {
        throw new Error(
          `Invalid price for ${item.productName}.`
        );
      }

      subtotal +=
        item.quantity * item.unitPrice;
    }

    const total = subtotal - discount;

    if (total < 0) {
      throw new Error(
        "Discount cannot be greater than the sale subtotal."
      );
    }

    if (data.amountPaid < total) {
      throw new Error(
        "Amount paid is less than the sale total."
      );
    }

    const changeAmount =
      data.amountPaid - total;

    const paymentMethod =
      data.paymentMethod ?? "cash";

    const receiptNumber =
      this.generateReceiptNumber();

    try {
      let saleId = 0;

      await db.withTransactionAsync(
        async () => {
          /*
           * Re-check stock inside the transaction.
           *
           * This is important because the quantity may
           * have changed after the product was added
           * to the cart.
           */
          for (const item of data.items) {
            const product =
              await db.getFirstAsync<{
                id: number;
                name: string;
                stockQuantity: number;
              }>(
                `
                SELECT
                  id,
                  name,
                  stock_quantity AS stockQuantity
                FROM products
                WHERE id = ?
                LIMIT 1;
                `,
                [item.productId]
              );

            if (!product) {
              throw new Error(
                `Product "${item.productName}" no longer exists.`
              );
            }

            if (
              product.stockQuantity <
              item.quantity
            ) {
              throw new Error(
                `Insufficient stock for ${product.name}. Available: ${product.stockQuantity} ${item.unit}.`
              );
            }
          }

          /*
           * Create the sale record.
           */
          const saleResult =
            await db.runAsync(
              `
              INSERT INTO sales (
                receipt_number,
                subtotal,
                discount,
                total,
                amount_paid,
                change_amount,
                payment_method,
                created_by
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?);
              `,
              [
                receiptNumber,
                subtotal,
                discount,
                total,
                data.amountPaid,
                changeAmount,
                paymentMethod,
                data.createdBy,
              ]
            );

          saleId =
            saleResult.lastInsertRowId;

          /*
           * Create sale items and reduce stock.
           */
          for (const item of data.items) {
            const itemSubtotal =
              item.quantity * item.unitPrice;

            /*
             * Save exactly what was sold.
             *
             * We preserve the product name,
             * selling price and buying price
             * so old sales don't change when
             * the product is edited later.
             */
            await db.runAsync(
              `
              INSERT INTO sale_items (
                sale_id,
                product_id,
                product_name,
                quantity,
                unit_price,
                buying_price,
                subtotal
              )
              VALUES (?, ?, ?, ?, ?, ?, ?);
              `,
              [
                saleId,
                item.productId,
                item.productName,
                item.quantity,
                item.unitPrice,
                item.buyingPrice,
                itemSubtotal,
              ]
            );

            /*
             * Reduce product stock.
             */
            await db.runAsync(
              `
              UPDATE products
              SET
                stock_quantity =
                  stock_quantity - ?,
                updated_at =
                  CURRENT_TIMESTAMP
              WHERE id = ?;
              `,
              [
                item.quantity,
                item.productId,
              ]
            );

            /*
             * Record the automatic stock-out
             * caused by the sale.
             */
            await db.runAsync(
              `
              INSERT INTO stock_movements (
                product_id,
                type,
                quantity,
                reference,
                notes,
                created_by
              )
              VALUES (?, ?, ?, ?, ?, ?);
              `,
              [
                item.productId,
                "out",
                item.quantity,
                receiptNumber,
                "Stock out from sale",
                data.createdBy,
              ]
            );
          }
        }
      );

      console.log(
        "✅ SALE COMPLETED:",
        receiptNumber,
        saleId
      );

      return saleId;
    } catch (error) {
      console.error(
        "❌ Failed to create sale:",
        error
      );

      throw error;
    }
  }

  /**
   * Gets a sale by its ID.
   */
  async getSaleById(
    saleId: number
  ): Promise<Sale | null> {
    const db = await getDatabase();

    const sale =
      await db.getFirstAsync<Sale>(
        `
        SELECT
          id,
          receipt_number AS receiptNumber,
          subtotal,
          discount,
          total,
          amount_paid AS amountPaid,
          change_amount AS changeAmount,
          payment_method AS paymentMethod,
          created_by AS createdBy,
          created_at AS createdAt
        FROM sales
        WHERE id = ?
        LIMIT 1;
        `,
        [saleId]
      );

    return sale ?? null;
  }
  async getSaleDetails(
  saleId: number
): Promise<SaleDetails | null> {
  const db = await getDatabase();

  const sale = await this.getSaleById(saleId);

  if (!sale) {
    return null;
  }

  const items =
    await db.getAllAsync<SaleItem>(
      `
      SELECT
        id,
        product_id AS productId,
        product_name AS productName,
        quantity,
        unit_price AS unitPrice,
        buying_price AS buyingPrice,
        subtotal
      FROM sale_items
      WHERE sale_id = ?
      ORDER BY id ASC;
      `,
      [saleId]
    );

  return {
    sale,
    items,
  };
}
  async getSales(): Promise<Sale[]> {
  const db = await getDatabase();

  return await db.getAllAsync<Sale>(
    `
    SELECT
      id,
      receipt_number AS receiptNumber,
      subtotal,
      discount,
      total,
      amount_paid AS amountPaid,
      change_amount AS changeAmount,
      payment_method AS paymentMethod,
      created_by AS createdBy,
      created_at AS createdAt
    FROM sales
    ORDER BY id DESC;
    `
  );
}
async getSaleItems(saleId: number) {
  const db = await getDatabase();

  return await db.getAllAsync(
    `
    SELECT
      id,
      product_name AS productName,
      quantity,
      unit_price AS unitPrice,
      subtotal
    FROM sale_items
    WHERE sale_id = ?
    ORDER BY id;
    `,
    [saleId]
  );
}
}

export default new SaleService();