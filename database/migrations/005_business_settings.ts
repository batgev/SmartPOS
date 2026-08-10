import { SQLiteDatabase } from "expo-sqlite";

export const migration005 = {
  version: 5,

  async up(db: SQLiteDatabase) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),

        business_name TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',

        currency TEXT NOT NULL DEFAULT 'GH₵',

        receipt_footer TEXT NOT NULL DEFAULT 'Thank you for your business.',

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /*
     * SmartPOS is designed for one business per installation.
     *
     * Therefore, there should always be exactly one
     * business settings record.
     */
    await db.runAsync(
      `
      INSERT OR IGNORE INTO business_settings (
        id,
        business_name,
        address,
        phone,
        email,
        currency,
        receipt_footer
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [
        1,
        "",
        "",
        "",
        "",
        "GH₵",
        "Thank you for your business.",
      ]
    );

    console.log(
      "✅ Business settings table created."
    );
  },
};