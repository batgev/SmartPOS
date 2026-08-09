import { getDatabase } from "./sqlite";

export async function runMigrations() {
  const db = await getDatabase();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM users;"
  );

  if ((result?.count ?? 0) === 0) {
    await db.runAsync(
      `
      INSERT INTO users
      (username,password,full_name,role,created_at)
      VALUES (?,?,?,?,?)
      `,
      [
        "admin",
        "admin123",
        "Administrator",
        "Admin",
        new Date().toISOString(),
      ]
    );

    console.log("✅ Default admin account created.");
  }
}