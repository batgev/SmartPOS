import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "smartpos.db";

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Opens and returns the SmartPOS SQLite database.
 *
 * If the database has already been opened, the existing
 * database instance is returned.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = await SQLite.openDatabaseAsync(DATABASE_NAME);

    console.log("✅ SmartPOS database opened.");
  }

  return database;
}

/**
 * Initializes the database.
 *
 * This function is kept separate because the app startup
 * process uses it before running migrations.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  return await getDatabase();
}