import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { env } from "./env";

export const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      ssl: env.databaseUrl.includes("localhost") ? undefined : { rejectUnauthorized: false },
    })
  : null;

const schemaPath = () => {
  const nearby = path.resolve(__dirname, "../sql/schema.sql");
  const sibling = path.resolve(__dirname, "../../database/schema.sql");
  try {
    readFileSync(nearby);
    return nearby;
  } catch {
    return sibling;
  }
};

export const migrate = async () => {
  if (!pool) {
    if (env.isProd) throw new Error("DATABASE_URL is required in production");
    console.warn("DATABASE_URL missing — tracker state is in memory only");
    return;
  }
  const sql = readFileSync(schemaPath(), "utf8");
  await pool.query(sql);
};
