import { getDatabase } from "../database/sqlite";

export type ProductBarcode = {
  id: number;
  productId: number;
  barcode: string;
  barcodeType: string;
  unitQuantity: number;
  isPrimary: boolean;
  createdAt: string;
};

export type Product = {
  id: number;
  name: string;
  sku: string | null;

  // Kept for compatibility with the existing application.
  // This will represent the primary barcode.
  barcode: string | null;

  // New barcode collection.
  barcodes?: ProductBarcode[];

  category: string | null;
  buyingPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductBarcodeInput = {
  barcode: string;
  barcodeType?: string;
  unitQuantity?: number;
  isPrimary?: boolean;
};

export type CreateProductInput = {
  name: string;
  sku?: string;

  // Kept for compatibility with the current product screen.
  barcode?: string;

  // New multiple-barcode support.
  barcodes?: CreateProductBarcodeInput[];

  category?: string;
  buyingPrice: number;
  sellingPrice: number;
  lowStockThreshold?: number;
  unit?: string;
};

export type UpdateProductBarcodeInput = {
  id?: number;
  barcode: string;
  barcodeType?: string;
  unitQuantity?: number;
  isPrimary?: boolean;
};

export type UpdateProductInput = {
  name: string;
  sku?: string;

  // Kept for compatibility.
  barcode?: string;

  // New multiple-barcode support.
  barcodes?: UpdateProductBarcodeInput[];

  category?: string;
  buyingPrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
  unit: string;
};

class ProductService {
  // ============================================================
  // PRODUCTS
  // ============================================================

  async getProducts(): Promise<Product[]> {
    const db = await getDatabase();

    const products = await db.getAllAsync<Product>(
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

    const product = await db.getFirstAsync<Product>(
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

  // ============================================================
  // GET PRODUCT WITH ALL BARCODES
  // ============================================================

  async getProductWithBarcodes(
    productId: number
  ): Promise<Product | null> {
    const product =
      await this.getProductById(productId);

    if (!product) {
      return null;
    }

    product.barcodes =
      await this.getProductBarcodes(productId);

    return product;
  }

  // ============================================================
  // GET ALL PRODUCT BARCODES
  // ============================================================

  async getProductBarcodes(
    productId: number
  ): Promise<ProductBarcode[]> {
    const db = await getDatabase();

    const rows = await db.getAllAsync<{
      id: number;
      productId: number;
      barcode: string;
      barcodeType: string;
      unitQuantity: number;
      isPrimary: number;
      createdAt: string;
    }>(
      `
      SELECT
        id,
        product_id AS productId,
        barcode,
        barcode_type AS barcodeType,
        unit_quantity AS unitQuantity,
        is_primary AS isPrimary,
        created_at AS createdAt
      FROM product_barcodes
      WHERE product_id = ?
      ORDER BY is_primary DESC, id ASC;
      `,
      [productId]
    );

    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      barcode: row.barcode,
      barcodeType: row.barcodeType,
      unitQuantity: row.unitQuantity,
      isPrimary: row.isPrimary === 1,
      createdAt: row.createdAt,
    }));
  }

  // ============================================================
  // FIND PRODUCT BY BARCODE
  // ============================================================

  async findProductByBarcode(
    barcode: string
  ): Promise<
    | {
        product: Product;
        barcode: ProductBarcode;
      }
    | null
  > {
    const db = await getDatabase();

    const cleanBarcode = barcode.trim();

    if (!cleanBarcode) {
      return null;
    }

    const row =
      await db.getFirstAsync<{
        productId: number;

        id: number;
        barcode: string;
        barcodeType: string;
        unitQuantity: number;
        isPrimary: number;
        createdAt: string;

        name: string;
        sku: string | null;
        productBarcode: string | null;
        category: string | null;
        buyingPrice: number;
        sellingPrice: number;
        stockQuantity: number;
        lowStockThreshold: number;
        unit: string;
        productCreatedAt: string;
        updatedAt: string;
      }>(
        `
        SELECT
          p.id AS productId,

          pb.id,
          pb.barcode,
          pb.barcode_type AS barcodeType,
          pb.unit_quantity AS unitQuantity,
          pb.is_primary AS isPrimary,
          pb.created_at AS createdAt,

          p.name,
          p.sku,
          p.barcode AS productBarcode,
          p.category,
          p.buying_price AS buyingPrice,
          p.selling_price AS sellingPrice,
          p.stock_quantity AS stockQuantity,
          p.low_stock_threshold AS lowStockThreshold,
          p.unit,
          p.created_at AS productCreatedAt,
          p.updated_at AS updatedAt

        FROM product_barcodes pb

        INNER JOIN products p
          ON p.id = pb.product_id

        WHERE pb.barcode = ?

        LIMIT 1;
        `,
        [cleanBarcode]
      );

    if (!row) {
      return null;
    }

    const product: Product = {
      id: row.productId,
      name: row.name,
      sku: row.sku,
      barcode: row.productBarcode,
      category: row.category,
      buyingPrice: row.buyingPrice,
      sellingPrice: row.sellingPrice,
      stockQuantity: row.stockQuantity,
      lowStockThreshold: row.lowStockThreshold,
      unit: row.unit,
      createdAt: row.productCreatedAt,
      updatedAt: row.updatedAt,
    };

    const productBarcode: ProductBarcode = {
      id: row.id,
      productId: row.productId,
      barcode: row.barcode,
      barcodeType: row.barcodeType,
      unitQuantity: row.unitQuantity,
      isPrimary: row.isPrimary === 1,
      createdAt: row.createdAt,
    };

    return {
      product,
      barcode: productBarcode,
    };
  }

  // ============================================================
  // CREATE PRODUCT
  // ============================================================

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

    const sku =
      data.sku?.trim() || null;

    const category =
      data.category?.trim() || null;

    const lowStockThreshold =
      data.lowStockThreshold ?? 5;

    const unit =
      data.unit?.trim() || "pcs";

    // ------------------------------------------------------------
    // BUILD BARCODE LIST
    // ------------------------------------------------------------

    const barcodeInputs: CreateProductBarcodeInput[] =
      [];

    // New barcode array.
    if (data.barcodes) {
      barcodeInputs.push(
        ...data.barcodes
      );
    }

    // Legacy single barcode.
    if (data.barcode?.trim()) {
      const alreadyExists =
        barcodeInputs.some(
          (item) =>
            item.barcode.trim() ===
            data.barcode!.trim()
        );

      if (!alreadyExists) {
        barcodeInputs.unshift({
          barcode: data.barcode.trim(),
          barcodeType: "unknown",
          unitQuantity: 1,
          isPrimary: true,
        });
      }
    }

    // ------------------------------------------------------------
    // CLEAN AND VALIDATE BARCODES
    // ------------------------------------------------------------

    const cleanedBarcodes =
      barcodeInputs
        .map((item) => ({
          barcode: item.barcode.trim(),
          barcodeType:
            item.barcodeType?.trim() ||
            "unknown",
          unitQuantity:
            item.unitQuantity ?? 1,
          isPrimary:
            item.isPrimary ?? false,
        }))
        .filter(
          (item) => item.barcode.length > 0
        );

    const barcodeSet = new Set<string>();

    for (const barcode of cleanedBarcodes) {
      if (barcodeSet.has(barcode.barcode)) {
        throw new Error(
          `Duplicate barcode: ${barcode.barcode}`
        );
      }

      barcodeSet.add(barcode.barcode);

      if (barcode.unitQuantity <= 0) {
        throw new Error(
          `Unit quantity for barcode ${barcode.barcode} must be greater than zero.`
        );
      }
    }

    // ------------------------------------------------------------
    // DETERMINE PRIMARY BARCODE
    // ------------------------------------------------------------

    if (cleanedBarcodes.length > 0) {
      const primaryCount =
        cleanedBarcodes.filter(
          (item) => item.isPrimary
        ).length;

      if (primaryCount === 0) {
        cleanedBarcodes[0].isPrimary = true;
      } else if (primaryCount > 1) {
        let foundPrimary = false;

        for (const barcode of cleanedBarcodes) {
          if (barcode.isPrimary) {
            if (!foundPrimary) {
              foundPrimary = true;
            } else {
              barcode.isPrimary = false;
            }
          }
        }
      }
    }

    const primaryBarcode =
      cleanedBarcodes.find(
        (item) => item.isPrimary
      )?.barcode ?? null;

    // ------------------------------------------------------------
    // CREATE PRODUCT
    // ------------------------------------------------------------

    try {
      await db.execAsync("BEGIN TRANSACTION;");

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
          primaryBarcode,
          category,
          data.buyingPrice,
          data.sellingPrice,
          lowStockThreshold,
          unit,
        ]
      );

      const productId =
        result.lastInsertRowId;

      // ----------------------------------------------------------
      // INSERT BAR CODES
      // ----------------------------------------------------------

      for (const barcode of cleanedBarcodes) {
        await db.runAsync(
          `
          INSERT INTO product_barcodes (
            product_id,
            barcode,
            barcode_type,
            unit_quantity,
            is_primary
          )
          VALUES (?, ?, ?, ?, ?);
          `,
          [
            productId,
            barcode.barcode,
            barcode.barcodeType,
            barcode.unitQuantity,
            barcode.isPrimary ? 1 : 0,
          ]
        );
      }

      await db.execAsync(
        "COMMIT;"
      );

      console.log(
        "✅ PRODUCT CREATED:",
        productId
      );

      return productId;
    } catch (error) {
      try {
        await db.execAsync(
          "ROLLBACK;"
        );
      } catch {
        // Ignore rollback errors.
      }

      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message.includes(
          "UNIQUE constraint failed"
        )
      ) {
        throw new Error(
          "A product with this SKU or one of these barcodes already exists."
        );
      }

      throw error;
    }
  }

  // ============================================================
  // UPDATE PRODUCT
  // ============================================================

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

    const sku =
      data.sku?.trim() || null;

    const category =
      data.category?.trim() || null;

    const unit =
      data.unit.trim() || "pcs";

    // ------------------------------------------------------------
    // BUILD BARCODE LIST
    // ------------------------------------------------------------

    const barcodeInputs: UpdateProductBarcodeInput[] =
      [];

    if (data.barcodes) {
      barcodeInputs.push(
        ...data.barcodes
      );
    }

    // Legacy compatibility.
    if (data.barcode?.trim()) {
      const alreadyExists =
        barcodeInputs.some(
          (item) =>
            item.barcode.trim() ===
            data.barcode!.trim()
        );

      if (!alreadyExists) {
        barcodeInputs.unshift({
          barcode: data.barcode.trim(),
          barcodeType: "unknown",
          unitQuantity: 1,
          isPrimary: true,
        });
      }
    }

    const cleanedBarcodes =
      barcodeInputs
        .map((item) => ({
          id: item.id,
          barcode: item.barcode.trim(),
          barcodeType:
            item.barcodeType?.trim() ||
            "unknown",
          unitQuantity:
            item.unitQuantity ?? 1,
          isPrimary:
            item.isPrimary ?? false,
        }))
        .filter(
          (item) => item.barcode.length > 0
        );

    const barcodeSet = new Set<string>();

    for (const barcode of cleanedBarcodes) {
      if (barcodeSet.has(barcode.barcode)) {
        throw new Error(
          `Duplicate barcode: ${barcode.barcode}`
        );
      }

      barcodeSet.add(barcode.barcode);

      if (barcode.unitQuantity <= 0) {
        throw new Error(
          `Unit quantity for barcode ${barcode.barcode} must be greater than zero.`
        );
      }
    }

    // ------------------------------------------------------------
    // PRIMARY BARCODE
    // ------------------------------------------------------------

    if (cleanedBarcodes.length > 0) {
      const primaryCount =
        cleanedBarcodes.filter(
          (item) => item.isPrimary
        ).length;

      if (primaryCount === 0) {
        cleanedBarcodes[0].isPrimary = true;
      } else if (primaryCount > 1) {
        let foundPrimary = false;

        for (const barcode of cleanedBarcodes) {
          if (barcode.isPrimary) {
            if (!foundPrimary) {
              foundPrimary = true;
            } else {
              barcode.isPrimary = false;
            }
          }
        }
      }
    }

    const primaryBarcode =
      cleanedBarcodes.find(
        (item) => item.isPrimary
      )?.barcode ?? null;

    try {
      await db.execAsync(
        "BEGIN TRANSACTION;"
      );

      // ----------------------------------------------------------
      // UPDATE PRODUCT
      // ----------------------------------------------------------

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
          primaryBarcode,
          category,
          data.buyingPrice,
          data.sellingPrice,
          data.lowStockThreshold,
          unit,
          productId,
        ]
      );

      // ----------------------------------------------------------
      // REPLACE BARCODE LIST
      // ----------------------------------------------------------

      await db.runAsync(
        `
        DELETE FROM product_barcodes
        WHERE product_id = ?;
        `,
        [productId]
      );

      for (const barcode of cleanedBarcodes) {
        await db.runAsync(
          `
          INSERT INTO product_barcodes (
            product_id,
            barcode,
            barcode_type,
            unit_quantity,
            is_primary
          )
          VALUES (?, ?, ?, ?, ?);
          `,
          [
            productId,
            barcode.barcode,
            barcode.barcodeType,
            barcode.unitQuantity,
            barcode.isPrimary ? 1 : 0,
          ]
        );
      }

      await db.execAsync(
        "COMMIT;"
      );

      console.log(
        "✅ PRODUCT UPDATED:",
        productId
      );
    } catch (error) {
      try {
        await db.execAsync(
          "ROLLBACK;"
        );
      } catch {
        // Ignore rollback errors.
      }

      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message.includes(
          "UNIQUE constraint failed"
        )
      ) {
        throw new Error(
          "A product with this SKU or one of these barcodes already exists."
        );
      }

      throw error;
    }
  }

  // ============================================================
  // ADD ONE BARCODE
  // ============================================================

  async addBarcode(
    productId: number,
    data: CreateProductBarcodeInput
  ): Promise<number> {
    const db = await getDatabase();

    const barcode =
      data.barcode.trim();

    if (!barcode) {
      throw new Error(
        "Barcode is required."
      );
    }

    const unitQuantity =
      data.unitQuantity ?? 1;

    if (unitQuantity <= 0) {
      throw new Error(
        "Unit quantity must be greater than zero."
      );
    }

    // Check whether this barcode already exists.
    const existing =
      await db.getFirstAsync<{
        id: number;
        productId: number;
      }>(
        `
        SELECT
          id,
          product_id AS productId
        FROM product_barcodes
        WHERE barcode = ?
        LIMIT 1;
        `,
        [barcode]
      );

    if (existing) {
      if (
        existing.productId ===
        productId
      ) {
        throw new Error(
          "This barcode is already assigned to this product."
        );
      }

      throw new Error(
        "This barcode is already assigned to another product."
      );
    }

    let isPrimary =
      data.isPrimary ?? false;

    if (isPrimary) {
      await db.runAsync(
        `
        UPDATE product_barcodes
        SET is_primary = 0
        WHERE product_id = ?;
        `,
        [productId]
      );
    }

    const result =
      await db.runAsync(
        `
        INSERT INTO product_barcodes (
          product_id,
          barcode,
          barcode_type,
          unit_quantity,
          is_primary
        )
        VALUES (?, ?, ?, ?, ?);
        `,
        [
          productId,
          barcode,
          data.barcodeType?.trim() ||
            "unknown",
          unitQuantity,
          isPrimary ? 1 : 0,
        ]
      );

    // If this is the first barcode,
    // make it primary automatically.
    const count =
      await db.getFirstAsync<{
        count: number;
      }>(
        `
        SELECT COUNT(*) AS count
        FROM product_barcodes
        WHERE product_id = ?;
        `,
        [productId]
      );

    if (
      count &&
      count.count === 1
    ) {
      await db.runAsync(
        `
        UPDATE product_barcodes
        SET is_primary = 1
        WHERE id = ?;
        `,
        [result.lastInsertRowId]
      );

      await db.runAsync(
        `
        UPDATE products
        SET
          barcode = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
        `,
        [barcode, productId]
      );
    }

    return result.lastInsertRowId;
  }

  // ============================================================
  // UPDATE ONE BARCODE
  // ============================================================

  async updateBarcode(
    barcodeId: number,
    data: UpdateProductBarcodeInput
  ): Promise<void> {
    const db = await getDatabase();

    const barcode =
      data.barcode.trim();

    if (!barcode) {
      throw new Error(
        "Barcode is required."
      );
    }

    const unitQuantity =
      data.unitQuantity ?? 1;

    if (unitQuantity <= 0) {
      throw new Error(
        "Unit quantity must be greater than zero."
      );
    }

    const current =
      await db.getFirstAsync<{
        id: number;
        productId: number;
      }>(
        `
        SELECT
          id,
          product_id AS productId
        FROM product_barcodes
        WHERE id = ?
        LIMIT 1;
        `,
        [barcodeId]
      );

    if (!current) {
      throw new Error(
        "Barcode not found."
      );
    }

    const duplicate =
      await db.getFirstAsync<{
        id: number;
        productId: number;
      }>(
        `
        SELECT
          id,
          product_id AS productId
        FROM product_barcodes
        WHERE barcode = ?
          AND id != ?
        LIMIT 1;
        `,
        [barcode, barcodeId]
      );

    if (duplicate) {
      throw new Error(
        "This barcode is already assigned to another barcode record."
      );
    }

    if (data.isPrimary) {
      await db.runAsync(
        `
        UPDATE product_barcodes
        SET is_primary = 0
        WHERE product_id = ?;
        `,
        [current.productId]
      );
    }

    await db.runAsync(
      `
      UPDATE product_barcodes
      SET
        barcode = ?,
        barcode_type = ?,
        unit_quantity = ?,
        is_primary = ?
      WHERE id = ?;
      `,
      [
        barcode,
        data.barcodeType?.trim() ||
          "unknown",
        unitQuantity,
        data.isPrimary ? 1 : 0,
        barcodeId,
      ]
    );

    // Keep legacy products.barcode synchronized
    // with the primary barcode.
    const primary =
      await db.getFirstAsync<{
        barcode: string;
      }>(
        `
        SELECT barcode
        FROM product_barcodes
        WHERE product_id = ?
          AND is_primary = 1
        LIMIT 1;
        `,
        [current.productId]
      );

    await db.runAsync(
      `
      UPDATE products
      SET
        barcode = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
      `,
      [
        primary?.barcode ?? null,
        current.productId,
      ]
    );
  }

  // ============================================================
  // DELETE BARCODE
  // ============================================================

  async deleteBarcode(
    barcodeId: number
  ): Promise<void> {
    const db = await getDatabase();

    const barcode =
      await db.getFirstAsync<{
        id: number;
        productId: number;
        isPrimary: number;
      }>(
        `
        SELECT
          id,
          product_id AS productId,
          is_primary AS isPrimary
        FROM product_barcodes
        WHERE id = ?
        LIMIT 1;
        `,
        [barcodeId]
      );

    if (!barcode) {
      throw new Error(
        "Barcode not found."
      );
    }

    await db.runAsync(
      `
      DELETE FROM product_barcodes
      WHERE id = ?;
      `,
      [barcodeId]
    );

    // If the deleted barcode was primary,
    // promote another barcode.
    if (barcode.isPrimary === 1) {
      const next =
        await db.getFirstAsync<{
          id: number;
          barcode: string;
        }>(
          `
          SELECT
            id,
            barcode
          FROM product_barcodes
          WHERE product_id = ?
          ORDER BY id ASC
          LIMIT 1;
          `,
          [barcode.productId]
        );

      if (next) {
        await db.runAsync(
          `
          UPDATE product_barcodes
          SET is_primary = 1
          WHERE id = ?;
          `,
          [next.id]
        );

        await db.runAsync(
          `
          UPDATE products
          SET
            barcode = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?;
          `,
          [
            next.barcode,
            barcode.productId,
          ]
        );
      } else {
        await db.runAsync(
          `
          UPDATE products
          SET
            barcode = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?;
          `,
          [barcode.productId]
        );
      }
    }
  }

  // ============================================================
  // SET PRIMARY BARCODE
  // ============================================================

  async setPrimaryBarcode(
    barcodeId: number
  ): Promise<void> {
    const db = await getDatabase();

    const barcode =
      await db.getFirstAsync<{
        id: number;
        productId: number;
        barcode: string;
      }>(
        `
        SELECT
          id,
          product_id AS productId,
          barcode
        FROM product_barcodes
        WHERE id = ?
        LIMIT 1;
        `,
        [barcodeId]
      );

    if (!barcode) {
      throw new Error(
        "Barcode not found."
      );
    }

    await db.execAsync(
      "BEGIN TRANSACTION;"
    );

    try {
      await db.runAsync(
        `
        UPDATE product_barcodes
        SET is_primary = 0
        WHERE product_id = ?;
        `,
        [barcode.productId]
      );

      await db.runAsync(
        `
        UPDATE product_barcodes
        SET is_primary = 1
        WHERE id = ?;
        `,
        [barcodeId]
      );

      // Keep old products.barcode synchronized.
      await db.runAsync(
        `
        UPDATE products
        SET
          barcode = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
        `,
        [
          barcode.barcode,
          barcode.productId,
        ]
      );

      await db.execAsync(
        "COMMIT;"
      );
    } catch (error) {
      try {
        await db.execAsync(
          "ROLLBACK;"
        );
      } catch {
        // Ignore rollback errors.
      }

      throw error;
    }
  }

  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  async deleteProduct(
    productId: number
  ): Promise<void> {
    const db = await getDatabase();

    const product =
      await this.getProductById(
        productId
      );

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

    // Explicitly remove barcodes first.
    // This keeps deletion safe even if
    // foreign-key enforcement is unavailable.
    await db.runAsync(
      `
      DELETE FROM product_barcodes
      WHERE product_id = ?;
      `,
      [productId]
    );

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

  // ============================================================
  // STOCK
  // ============================================================

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
      await this.getProductById(
        productId
      );

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
        ? product.stockQuantity +
          quantity
        : product.stockQuantity -
          quantity;

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