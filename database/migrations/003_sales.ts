import { SQLiteDatabase } from "expo-sqlite";

export const migration003 = {
  version: 3,

  async up(db: SQLiteDatabase) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT NOT NULL UNIQUE,
        subtotal REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        amount_paid REAL NOT NULL DEFAULT 0,
        change_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (created_by)
          REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        buying_price REAL NOT NULL,
        subtotal REAL NOT NULL,

        FOREIGN KEY (sale_id)
          REFERENCES sales(id)
          ON DELETE CASCADE,

        FOREIGN KEY (product_id)
          REFERENCES products(id)
      );
    `);

    console.log("✅ Sales tables created.");
  },
};