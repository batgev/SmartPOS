import { SQLiteDatabase } from "expo-sqlite";

export const migration002 = {
  version: 2,

  async up(db: SQLiteDatabase) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        barcode TEXT UNIQUE,
        category TEXT,
        buying_price REAL NOT NULL DEFAULT 0,
        selling_price REAL NOT NULL DEFAULT 0,
        stock_quantity REAL NOT NULL DEFAULT 0,
        low_stock_threshold REAL NOT NULL DEFAULT 5,
        unit TEXT NOT NULL DEFAULT 'pcs',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        reference TEXT,
        notes TEXT,
        created_by INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (product_id)
          REFERENCES products(id),

        FOREIGN KEY (created_by)
          REFERENCES users(id)
      );
    `);

    console.log("✅ Products and stock tables created.");
  },
};