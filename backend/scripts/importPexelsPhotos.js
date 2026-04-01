import "dotenv/config";
import axios from "axios";
import { Pool } from "pg";

const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";
const REQUEST_QUERIES = [
  { query: "Jordan travel", location: "Jordan", category: "travel" },
  { query: "Amman city", location: "Amman", category: "city" },
  { query: "Petra Jordan", location: "Petra", category: "landmark" },
  { query: "Aqaba beach", location: "Aqaba", category: "beach" },
  { query: "Wadi Rum desert", location: "Wadi Rum", category: "desert" },
  { query: "Jordan restaurants", location: "Jordan", category: "restaurants" }
];

function buildPoolConfig() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (connectionString) {
    return { connectionString };
  }

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

function randomDelayMs() {
  return 300 + Math.floor(Math.random() * 201);
}

export async function importPexelsPhotos() {
  const pexelsKey = String(process.env.PEXELS_KEY || "").trim();
  if (!pexelsKey) {
    throw new Error("Missing PEXELS_KEY in backend/.env.");
  }

  const pool = new Pool(buildPoolConfig());
  let totalFetched = 0;
  let inserted = 0;
  let skipped = 0;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id BIGSERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        location TEXT,
        category TEXT,
        source TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS photos_url_unique_idx
      ON photos (url);
    `);

    for (const item of REQUEST_QUERIES) {
      for (let page = 1; page <= 10; page += 1) {
        const { data } = await axios.get(PEXELS_SEARCH_URL, {
          headers: {
            Authorization: pexelsKey
          },
          params: {
            query: item.query,
            page,
            per_page: 50
          },
          timeout: 20000
        });

        const photos = Array.isArray(data?.photos) ? data.photos : [];
        totalFetched += photos.length;

        for (const photo of photos) {
          const url = String(photo?.src?.large || "").trim();
          if (!url) {
            skipped += 1;
            continue;
          }

          const result = await pool.query(
            `
            INSERT INTO photos (url, location, category, source)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (url) DO NOTHING
            `,
            [url, item.location, item.category, "pexels"]
          );

          if (result.rowCount > 0) {
            inserted += 1;
          } else {
            skipped += 1;
          }
        }

        await sleep(randomDelayMs());
      }
    }

    return {
      fetched: totalFetched,
      inserted,
      skipped
    };
  } finally {
    await pool.end();
  }
}
