import { SQLiteDatabase } from "expo-sqlite";

export const migration006 = {
  version: 6,

  async up(db: SQLiteDatabase) {
    // ============================================
    // PRODUCT BARCODES
    // ============================================
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS product_barcodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        product_id INTEGER NOT NULL,

        barcode TEXT NOT NULL UNIQUE,

        barcode_type TEXT NOT NULL DEFAULT 'unknown',

        unit_quantity REAL NOT NULL DEFAULT 1,

        is_primary INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
          ON DELETE CASCADE
      );
    `);

    // ============================================
    // INDEX FOR FAST BARCODE LOOKUP
    // ============================================
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS
      idx_product_barcodes_product_id
      ON product_barcodes(product_id);
    `);

    // ============================================
    // INDEX FOR BARCODE SCANNING
    // ============================================
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS
      idx_product_barcodes_barcode
      ON product_barcodes(barcode);
    `);

    // ============================================
    // MIGRATE EXISTING PRODUCT BARCODES
    // ============================================
    await db.execAsync(`
      INSERT OR IGNORE INTO product_barcodes (
        product_id,
        barcode,
        barcode_type,
        unit_quantity,
        is_primary
      )
      SELECT
        id,
        barcode,
        'unknown',
        1,
        1
      FROM products
      WHERE barcode IS NOT NULL
        AND TRIM(barcode) != '';
    `);

    console.log(
      "✅ Product barcode table created and existing barcodes migrated."
    );
  },
};