import { SQLiteDatabase } from "expo-sqlite";
import { hashPassword } from "../../utils/password";

export const migration001 = {
  version: 1,

  async up(db: SQLiteDatabase) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        password_salt TEXT,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add password_salt for databases created before this column existed.
    try {
      await db.execAsync(`
        ALTER TABLE users ADD COLUMN password_salt TEXT;
      `);
    } catch {
      // Column already exists.
    }

    const admin = await db.getFirstAsync<{
      id: number;
    }>(`
      SELECT id
      FROM users
      WHERE username = 'admin'
      LIMIT 1;
    `);

    if (!admin) {
      const { hash, salt } = await hashPassword("admin123");

      await db.runAsync(
        `
        INSERT INTO users (
          username,
          password,
          password_salt,
          full_name,
          role
        )
        VALUES (?, ?, ?, ?, ?);
        `,
        [
          "admin",
          hash,
          salt,
          "Administrator",
          "admin",
        ]
      );

      console.log("✅ Default admin created.");
    }
  },
};