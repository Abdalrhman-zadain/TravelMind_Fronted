import "dotenv/config";
import axios from "axios";
import { Pool } from "pg";

const FALLBACK_IMAGE = "https://via.placeholder.com/400x300?text=No+Image";

function buildPoolConfig() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (connectionString) return { connectionString };

  return {
    host: String(process.env.DB_HOST || "localhost"),
    user: String(process.env.DB_USER || "postgres"),
    password: String(process.env.DB_PASSWORD ?? ""),
    database: String(process.env.DB_NAME || "travelmind"),
    port: Number(process.env.DB_PORT || 5432)
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateRestaurantPhotos({
  batchSize = 10,
  perRequestDelayMs = 500
} = {}) {
  const unsplashKey = String(
    process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_KEY || ""
  ).trim();

  if (!unsplashKey) {
    throw new Error("Missing Unsplash key. Set UNSPLASH_ACCESS_KEY or UNSPLASH_KEY in backend/.env.");
  }

  const safeBatchSize = Math.max(1, Math.min(50, Number(batchSize) || 10));
  const safeDelay = Math.max(0, Number(perRequestDelayMs) || 500);

  const pool = new Pool(buildPoolConfig());
  let processed = 0;
  let success = 0;
  let failed = 0;

  try {
    await pool.query(`
      ALTER TABLE restaurants
      ADD COLUMN IF NOT EXISTS photo_url TEXT;
    `);

    const { rows } = await pool.query(`
      SELECT id, "nameEn", city
      FROM restaurants
      ORDER BY id ASC;
    `);

    processed = rows.length;

    for (let i = 0; i < rows.length; i += safeBatchSize) {
      const batch = rows.slice(i, i + safeBatchSize);

      for (const row of batch) {
        try {
          const nameEn = String(row.nameEn || "").trim();
          const city = String(row.city || "Jordan").trim() || "Jordan";

          if (!nameEn) {
            failed += 1;
            await sleep(safeDelay);
            continue;
          }

          const query = `${nameEn} restaurant ${city}`;
          let photoUrl = FALLBACK_IMAGE;

          try {
            const response = await axios.get("https://api.unsplash.com/search/photos", {
              timeout: 15000,
              headers: {
                Authorization: `Client-ID ${unsplashKey}`
              },
              params: {
                query,
                per_page: 1
              }
            });

            const maybeUrl = response.data?.results?.[0]?.urls?.regular;
            if (typeof maybeUrl === "string" && maybeUrl.trim()) {
              photoUrl = maybeUrl.trim();
            }
          } catch (_apiErr) {
            failed += 1;
            await sleep(safeDelay);
            continue;
          }

          await pool.query(
            `
            UPDATE restaurants
            SET photo_url = $1
            WHERE id = $2;
            `,
            [photoUrl, row.id]
          );

          success += 1;
        } catch (_dbErr) {
          failed += 1;
        }

        await sleep(safeDelay);
      }
    }

    return { processed, success, failed };
  } finally {
    await pool.end();
  }
}
