import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_JSON_PATH = path.join(__dirname, "..", "data", "db.json");

function readJsonSeed() {
  const raw = fs.readFileSync(DB_JSON_PATH, "utf8");
  return JSON.parse(raw);
}

function asDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function normalizePasswordHash(rawValue) {
  const value = String(rawValue || "");
  if (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$")) {
    return value;
  }
  return bcrypt.hash(value, 10);
}

async function resetTableSequence(tableName, idColumn = "id") {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"${tableName}"', '${idColumn}'), COALESCE(MAX(${idColumn}), 1), MAX(${idColumn}) IS NOT NULL) FROM "${tableName}";`
  );
}

async function main() {
  const seed = readJsonSeed();

  // attempt to clear existing data where tables exist (skip missing tables)
  const clearActions = [
    async () => prisma.chatMessage.deleteMany(),
    async () => prisma.review.deleteMany(),
    async () => prisma.journal.deleteMany(),
    async () => prisma.expense.deleteMany(),
    async () => prisma.trip.deleteMany(),
    async () => prisma.category.deleteMany(),
    async () => prisma.restaurant.deleteMany(),
    async () => prisma.hotel.deleteMany(),
    async () => prisma.attraction.deleteMany(),
    async () => prisma.user.deleteMany()
  ];

  for (const action of clearActions) {
    try {
      await action();
    } catch (err) {
      // ignore missing-table errors (Prisma P2021) and continue seeding
      console.warn('Seed: skipping clear action due to error:', err.message || err);
    }
  }

  if (seed.users?.length) {
    const users = await Promise.all(
      seed.users.map(async (u) => ({
        id: u.id,
        name: u.name,
        email: String(u.email || "").toLowerCase(),
        passwordHash: await normalizePasswordHash(u.passwordHash),
        preferredLanguage: u.preferredLanguage || "en",
        profileImage: u.profileImage || "",
        createdAt: asDate(u.createdAt) || new Date()
      }))
    );

    await prisma.user.createMany({
      data: users
    });
  }

  if (seed.categories?.length) {
    await prisma.category.createMany({ data: seed.categories });
  }

  if (seed.attractions?.length) {
    await prisma.attraction.createMany({ data: seed.attractions });
  }

  if (seed.hotels?.length) {
    await prisma.hotel.createMany({ data: seed.hotels });
  }

  if (seed.restaurants?.length) {
    await prisma.restaurant.createMany({ data: seed.restaurants });
  }

  if (seed.trips?.length) {
    await prisma.trip.createMany({
      data: seed.trips.map((t) => ({
        ...t,
        startDate: asDate(t.startDate),
        endDate: asDate(t.endDate),
        createdAt: asDate(t.createdAt) || new Date()
      }))
    });
  }

  if (seed.expenses?.length) {
    await prisma.expense.createMany({
      data: seed.expenses.map((e) => ({
        ...e,
        date: asDate(e.date),
        createdAt: asDate(e.createdAt) || new Date()
      }))
    });
  }

  if (seed.journals?.length) {
    await prisma.journal.createMany({
      data: seed.journals.map((j) => ({
        ...j,
        date: asDate(j.date),
        createdAt: asDate(j.createdAt) || new Date()
      }))
    });
  }

  if (seed.reviews?.length) {
    await prisma.review.createMany({
      data: seed.reviews.map((r) => ({
        ...r,
        createdAt: asDate(r.createdAt) || new Date()
      }))
    });
  }

  if (seed.chat?.length) {
    try {
      await prisma.chatMessage.createMany({
        data: seed.chat.map((m) => ({
          id: m.id,
          userId: m.userId,
          message: m.message,
          response: m.response || null,
          createdAt: asDate(m.createdAt) || new Date()
        }))
      });
    } catch (err) {
      console.warn('Seed: skipping chat seed (table may be missing):', err.message || err);
    }
  }

  const sequences = [
    'users',
    'categories',
    'attractions',
    'hotels',
    'restaurants',
    'trips',
    'expenses',
    'journals',
    'reviews',
    'chat_messages'
  ];

  for (const tbl of sequences) {
    try {
      await resetTableSequence(tbl);
    } catch (err) {
      console.warn(`Seed: failed to reset sequence for ${tbl} (may not exist):`, err.message || err);
    }
  }

  console.log("Database seeded from backend/data/db.json");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
