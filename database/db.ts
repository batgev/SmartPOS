import { getDatabase } from "./sqlite";
import { migration001 } from "./migrations/001_users";
import { migration002 } from "./migrations/002_products";
import { migration003 } from "./migrations/003_sales";
import { migration004 } from "./migrations/004_sales";
import { migration005 } from "./migrations/005_business_settings";
import { migration006 } from "./migrations/006_product_barcodes";
const migrations = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
];
export async function runMigrations() {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY
    );
  `);

  for (const migration of migrations) {
    const alreadyRan =
      await db.getFirstAsync<{ version: number }>(
        `
        SELECT version
        FROM schema_migrations
        WHERE version = ?;
        `,
        [migration.version]
      );

    if (alreadyRan) {
      console.log(
        `⏩ Migration ${migration.version} already applied.`
      );
      continue;
    }

    console.log(
      `🚀 Running migration ${migration.version}...`
    );

    await migration.up(db);

    await db.runAsync(
      `
      INSERT INTO schema_migrations(version)
      VALUES (?);
      `,
      [migration.version]
    );

    console.log(
      `✅ Migration ${migration.version} completed.`
    );
  }

  console.log(
    "✅ Database migrations completed."
  );
}

export async function initializeDatabase() {
  await runMigrations();
}