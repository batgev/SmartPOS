import { getDatabase } from "../database/sqlite";

export type Product = {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  buyingPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  buyingPrice: number;
  sellingPrice: number;
  lowStockThreshold?: number;
  unit?: string;
};

export type UpdateProductInput = {
  name: string;
  sku?: string;
  barcode?: string;
  category?: string;
  buyingPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  unit: string;
};

class ProductService {
  async getProducts(): Promise<Product[]> {
    const db = await getDatabase();

    const products =
      await db.getAllAsync<Product>(
        `
        SELECT
          id,
          name,
          sku,
          barcode,
          category,
          buying_price AS buyingPrice,
          selling_price AS sellingPrice,
          stock_quantity AS stockQuantity,
          low_stock_threshold AS lowStockThreshold,
          unit,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM products
        ORDER BY name ASC;
        `
      );

    return products;
  }

  async getProductById(
    productId: number
  ): Promise<Product | null> {
    const db = await getDatabase();

    const product =
      await db.getFirstAsync<Product>(
        `
        SELECT
          id,
          name,
          sku,
          barcode,
          category,
          buying_price AS buyingPrice,
          selling_price AS sellingPrice,
          stock_quantity AS stockQuantity,
          low_stock_threshold AS lowStockThreshold,
          unit,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM products
        WHERE id = ?
        LIMIT 1;
        `,
        [productId]
      );

    return product ?? null;
  }

  async createProduct(
    data: CreateProductInput
  ): Promise<number> {
    const db = await getDatabase();

    const name = data.name.trim();

    if (!name) {
      throw new Error(
        "Product name is required."
      );
    }

    if (data.buyingPrice < 0) {
      throw new Error(
        "Buying price cannot be negative."
      );
    }

    if (data.sellingPrice < 0) {
      throw new Error(
        "Selling price cannot be negative."
      );
    }

    const sku = data.sku?.trim() || null;
    const barcode =
      data.barcode?.trim() || null;
    const category =
      data.category?.trim() || null;

    const lowStockThreshold =
      data.lowStockThreshold ?? 5;

    const unit =
      data.unit?.trim() || "pcs";

    try {
      const result = await db.runAsync(
        `
        INSERT INTO products (
          name,
          sku,
          barcode,
          category,
          buying_price,
          selling_price,
          stock_quantity,
          low_stock_threshold,
          unit
        )
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?);
        `,
        [
          name,
          sku,
          barcode,
          category,
          data.buyingPrice,
          data.sellingPrice,
          lowStockThreshold,
          unit,
        ]
      );

      console.log(
        "✅ PRODUCT CREATED:",
        result.lastInsertRowId
      );

      return result.lastInsertRowId;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message.includes("UNIQUE constraint failed")
      ) {
        throw new Error(
          "A product with this SKU or barcode already exists."
        );
      }

      throw error;
    }
  }

  async updateProduct(
    productId: number,
    data: UpdateProductInput
  ): Promise<void> {
    const db = await getDatabase();

    const name = data.name.trim();

    if (!name) {
      throw new Error(
        "Product name is required."
      );
    }

    if (data.buyingPrice < 0) {
      throw new Error(
        "Buying price cannot be negative."
      );
    }

    if (data.sellingPrice < 0) {
      throw new Error(
        "Selling price cannot be negative."
      );
    }

    if (data.lowStockThreshold < 0) {
      throw new Error(
        "Low-stock threshold cannot be negative."
      );
    }

    const sku = data.sku?.trim() || null;
    const barcode =
      data.barcode?.trim() || null;
    const category =
      data.category?.trim() || null;
    const unit =
      data.unit.trim() || "pcs";

    try {
      await db.runAsync(
        `
        UPDATE products
        SET
          name = ?,
          sku = ?,
          barcode = ?,
          category = ?,
          buying_price = ?,
          selling_price = ?,
          low_stock_threshold = ?,
          unit = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
        `,
        [
          name,
          sku,
          barcode,
          category,
          data.buyingPrice,
          data.sellingPrice,
          data.lowStockThreshold,
          unit,
          productId,
        ]
      );

      console.log(
        "✅ PRODUCT UPDATED:",
        productId
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message.includes("UNIQUE constraint failed")
      ) {
        throw new Error(
          "A product with this SKU or barcode already exists."
        );
      }

      throw error;
    }
  }

  async deleteProduct(
    productId: number
  ): Promise<void> {
    const db = await getDatabase();

    const product =
      await this.getProductById(productId);

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    if (product.stockQuantity > 0) {
      throw new Error(
        "A product with existing stock cannot be deleted."
      );
    }

    await db.runAsync(
      `
      DELETE FROM stock_movements
      WHERE product_id = ?;
      `,
      [productId]
    );

    await db.runAsync(
      `
      DELETE FROM products
      WHERE id = ?;
      `,
      [productId]
    );

    console.log(
      "✅ PRODUCT DELETED:",
      productId
    );
  }

  async adjustStock(
    productId: number,
    quantity: number,
    type: "in" | "out",
    createdBy: number,
    reference?: string,
    notes?: string
  ): Promise<void> {
    const db = await getDatabase();

    if (quantity <= 0) {
      throw new Error(
        "Stock quantity must be greater than zero."
      );
    }

    const product =
      await this.getProductById(productId);

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    if (
      type === "out" &&
      product.stockQuantity < quantity
    ) {
      throw new Error(
        "Insufficient stock."
      );
    }

    const newQuantity =
      type === "in"
        ? product.stockQuantity + quantity
        : product.stockQuantity - quantity;

    await db.runAsync(
      `
      UPDATE products
      SET
        stock_quantity = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
      `,
      [
        newQuantity,
        productId,
      ]
    );

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
        productId,
        type,
        quantity,
        reference ?? null,
        notes ?? null,
        createdBy,
      ]
    );

    console.log(
      `✅ STOCK ${type.toUpperCase()}:`,
      productId,
      quantity
    );
  }
}

export default new ProductService();