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

  await prisma.chatMessage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.attraction.deleteMany();
  await prisma.user.deleteMany();

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
    await prisma.chatMessage.createMany({
      data: seed.chat.map((m) => ({
        id: m.id,
        userId: m.userId,
        message: m.message,
        response: m.response || null,
        createdAt: asDate(m.createdAt) || new Date()
      }))
    });
  }

  await resetTableSequence("users");
  await resetTableSequence("categories");
  await resetTableSequence("attractions");
  await resetTableSequence("hotels");
  await resetTableSequence("restaurants");
  await resetTableSequence("trips");
  await resetTableSequence("expenses");
  await resetTableSequence("journals");
  await resetTableSequence("reviews");
  await resetTableSequence("chat_messages");

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
