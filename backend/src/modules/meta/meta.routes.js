export function registerMetaRoutes({
    app,
    prisma,
    modelCrud,
    normalizeCategoryPayload,
    asyncHandler,
    toNumber
}) {
    modelCrud({
        base: "/api/categories",
        delegate: "category",
        normalize: normalizeCategoryPayload,
        notFoundMessage: "categories item not found."
    });

    app.get("/api/photos", asyncHandler(async (req, res) => {
        const location = String(req.query.location || "").trim();
        const category = String(req.query.category || "").trim();
        const limit = Math.max(1, Math.min(120, toNumber(req.query.limit, 30) || 30));

        const values = [];
        const where = [];

        if (location) {
            values.push(location);
            where.push(`location ILIKE $${values.length}`);
        }

        if (category) {
            values.push(category);
            where.push(`category ILIKE $${values.length}`);
        }

        values.push(limit);

        const sql = `
      SELECT id, url, location, category, source
      FROM photos
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY id DESC
      LIMIT $${values.length}
    `;

        const rows = await prisma.$queryRawUnsafe(sql, ...values);
        const serializedRows = Array.isArray(rows)
            ? rows.map((row) => ({
                ...row,
                id: typeof row?.id === "bigint" ? Number(row.id) : row?.id
            }))
            : [];

        res.json(serializedRows);
    }));

    app.get("/api/categories/type/:type", asyncHandler(async (req, res) => {
        const type = String(req.params.type || "").trim();
        const list = await prisma.category.findMany({
            where: { type: { equals: type, mode: "insensitive" } },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));
}
