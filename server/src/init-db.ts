import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "./db";

async function initialize() {
  try {
    const schema = await readFile(fileURLToPath(new URL("../schema.sql", import.meta.url)), "utf8");
    await pool.query(schema);
    console.log("Database schema initialized.");
  } finally {
    await pool.end();
  }
}
initialize().catch((error) => { console.error(error); process.exitCode = 1; });
