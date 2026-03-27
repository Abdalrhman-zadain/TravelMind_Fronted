import "dotenv/config";
import axios from "axios";
import { Pool } from "pg";

const HTTP_HEADERS = {
  "User-Agent": "TravelMind/1.0 (tourism data enrichment; educational use)",
  Accept: "application/json"
};

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

function cleanAttractionName(name) {
  return String(name || "")
    .replace(/\bVisitor Center\b/gi, "")
    .replace(/\bHotel\b/gi, "")
    .replace(/\bMuseum of\b/gi, "")
    .replace(/\bSite\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchWikiImage(title) {
  if (!title) return null;
  const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const response = await axios.get(endpoint, {
      timeout: 12000,
      headers: HTTP_HEADERS
    });
    return response.data?.thumbnail?.source || null;
  } catch (_err) {
    return null;
  }
}

async function searchWikipediaTitle(query) {
  if (!query) return null;
  try {
    const response = await axios.get("https://en.wikipedia.org/w/api.php", {
      timeout: 12000,
      headers: HTTP_HEADERS,
      params: {
        action: "query",
        list: "search",
        format: "json",
        utf8: 1,
        srlimit: 1,
        srsearch: query
      }
    });
    return response.data?.query?.search?.[0]?.title || null;
  } catch (_err) {
    return null;
  }
}

async function fetchThumbnailByTitle(title) {
  if (!title) return null;
  try {
    const response = await axios.get("https://en.wikipedia.org/w/api.php", {
      timeout: 12000,
      headers: HTTP_HEADERS,
      params: {
        action: "query",
        format: "json",
        titles: title,
        prop: "pageimages",
        pithumbsize: 1200
      }
    });

    const pages = response.data?.query?.pages || {};
    const firstPage = Object.values(pages)[0];
    return firstPage?.thumbnail?.source || null;
  } catch (_err) {
    return null;
  }
}

async function fetchNearbyTitleFromCoords(lat, lng) {
  const hasLat = Number.isFinite(Number(lat));
  const hasLng = Number.isFinite(Number(lng));
  if (!hasLat || !hasLng) return null;

  try {
    const response = await axios.get("https://en.wikipedia.org/w/api.php", {
      timeout: 12000,
      headers: HTTP_HEADERS,
      params: {
        action: "query",
        list: "geosearch",
        format: "json",
        gscoord: `${Number(lat)}|${Number(lng)}`,
        gsradius: 10000,
        gslimit: 1
      }
    });

    return response.data?.query?.geosearch?.[0]?.title || null;
  } catch (_err) {
    return null;
  }
}

async function fetchWikidataImage(wikidataId) {
  if (!/^Q\d+$/i.test(String(wikidataId || ""))) return null;
  try {
    const endpoint = `https://www.wikidata.org/wiki/Special:EntityData/${wikidataId}.json`;
    const response = await axios.get(endpoint, {
      timeout: 12000,
      headers: HTTP_HEADERS
    });

    const entity = response.data?.entities?.[wikidataId];
    const imageName =
      entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value || null;

    return imageName
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageName)}`
      : null;
  } catch (_err) {
    return null;
  }
}

export async function updateAttractionImages({
  batchSize = 15,
  perRequestDelayMs = 250
} = {}) {
  const pool = new Pool(buildPoolConfig());

  let processed = 0;
  let success = 0;
  let failed = 0;

  try {
    await pool.query(`
      ALTER TABLE attractions
      ADD COLUMN IF NOT EXISTS photo_url TEXT;
    `);

    const result = await pool.query(`
      SELECT id, "nameEn", "descriptionEn", latitude, longitude
      FROM attractions
      WHERE (photo_url IS NULL OR photo_url = '')
      ORDER BY id ASC;
    `);

    const rows = result.rows;
    processed = rows.length;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        const nameEn = String(row.nameEn || "").trim();
        if (!nameEn) {
          failed += 1;
          await sleep(perRequestDelayMs);
          continue;
        }

        let imageUrl = await fetchWikiImage(nameEn);

        if (!imageUrl) {
          const cleaned = cleanAttractionName(nameEn);
          if (cleaned && cleaned.toLowerCase() !== nameEn.toLowerCase()) {
            imageUrl = await fetchWikiImage(cleaned);
          }
        }

        if (!imageUrl) {
          const bestTitle = await searchWikipediaTitle(nameEn);
          if (bestTitle) imageUrl = await fetchWikiImage(bestTitle);
        }

        if (!imageUrl) {
          const maybeQid = String(row.descriptionEn || "").trim();
          if (/^Q\d+$/i.test(maybeQid)) {
            imageUrl = await fetchWikidataImage(maybeQid.toUpperCase());
          }
        }

        if (!imageUrl) {
          const nearbyTitle = await fetchNearbyTitleFromCoords(
            row.latitude,
            row.longitude
          );
          if (nearbyTitle) {
            imageUrl = await fetchThumbnailByTitle(nearbyTitle);
          }
        }

        if (!imageUrl) {
          failed += 1;
          await sleep(perRequestDelayMs);
          continue;
        }

        try {
          await pool.query(
            `UPDATE attractions SET photo_url = $1 WHERE id = $2`,
            [imageUrl, row.id]
          );
          success += 1;
        } catch (_dbErr) {
          failed += 1;
        }

        await sleep(perRequestDelayMs);
      }

      await sleep(400);
    }

    const summary = { processed, success, failed };
    console.log(`Attraction image update done: ${JSON.stringify(summary)}`);
    return summary;
  } catch (error) {
    console.error("updateAttractionImages failed:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}
