import fs from "fs";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config()

const pool = new Pool({connectionString: process.env.DATABASE_URL})

async function migrate() {
    const migrationsDir = path.join(__dirname, "migrations")
    const files = fs.readdirSync(migrationsDir).sort()

    console.log(`Running migrations`)

    for (const file of files) {
        if (!file.endsWith(".sql")) continue;
        const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8")
        console.log(`${file}`)
        await pool.query(sql)
    }

    await pool.end()
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});