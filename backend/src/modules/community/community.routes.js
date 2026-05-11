export function registerCommunityRoutes({
    app,
    prisma,
    requireAuth,
    asyncHandler,
    toNumber,
    normalizeReviewPayload,
    normalizeChatPayload
}) {
    app.get("/api/reviews/place/:type/:id", asyncHandler(async (req, res) => {
        const placeType = String(req.params.type || "").trim();
        const placeId = toNumber(req.params.id, 0);

        const list = await prisma.review.findMany({
            where: {
                placeType: { equals: placeType, mode: "insensitive" },
                placeId
            },
            orderBy: { createdAt: "desc" }
        });

        res.json(list);
    }));

    app.get("/api/reviews/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.review.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });

        res.json(list);
    }));

    app.post("/api/reviews", requireAuth, asyncHandler(async (req, res) => {
        const { id: _ignored, ...body } = req.body || {};
        const created = await prisma.review.create({ data: normalizeReviewPayload(body) });
        res.status(201).json(created);
    }));

    app.delete("/api/reviews/:id", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const exists = await prisma.review.findUnique({ where: { id } });

        if (!exists) {
            return res.status(404).json({ message: "Review not found." });
        }

        await prisma.review.delete({ where: { id } });
        res.status(204).send();
    }));

    app.get("/api/chat/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" }
        });

        res.json(list);
    }));

    app.post("/api/chat", requireAuth, asyncHandler(async (req, res) => {
        const { id: _ignored, ...body } = req.body || {};
        const created = await prisma.chatMessage.create({ data: normalizeChatPayload(body) });
        res.status(201).json(created);
    }));

    app.delete("/api/chat/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        await prisma.chatMessage.deleteMany({ where: { userId } });
        res.status(204).send();
    }));
}
