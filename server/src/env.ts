import { existsSync } from "node:fs";
import path from "node:path";

const loadLocalEnv = () => {
  const files = [path.resolve(process.cwd(), ".env"), path.resolve(__dirname, "../.env")];
  for (const file of files) {
    if (!existsSync(file)) continue;
    try {
      process.loadEnvFile(file);
      return;
    } catch {
      /* already loaded */
    }
  }
};

loadLocalEnv();

const isProd = process.env.NODE_ENV === "production";

const splitOrigins = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);

export const env = {
  isProd,
  port: Number(process.env.PORT || 4020),
  databaseUrl: process.env.DATABASE_URL || "",
  corsOrigin: splitOrigins(
    process.env.CORS_ORIGIN || (isProd ? "" : "http://localhost:3000,http://localhost:3020"),
  ),
  siteUrl: (process.env.SITE_URL || (isProd ? "" : "http://localhost:3020")).replace(/\/$/, ""),
  feedMs: Number(process.env.FEED_MS || 8000),
  boardMs: Number(process.env.BOARD_MS || 60000),
  scoreMs: Number(process.env.SCORE_MS || 15000),
};

export const assertProductionConfig = () => {
  if (!isProd) return;
  if (!env.databaseUrl) throw new Error("DATABASE_URL is required in production");
  if (!env.siteUrl.startsWith("https://")) throw new Error("SITE_URL must be your https frontend URL");
};

export const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");
  if (env.corsOrigin.includes("*")) return !isProd;
  if (env.corsOrigin.includes(normalized) || normalized === env.siteUrl) return true;
  try {
    const host = new URL(origin).hostname;
    if (isProd) return false;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
};
