export function registerPlanningRoutes({
    app,
    prisma,
    modelCrud,
    normalizeTripPayload,
    normalizeExpensePayload,
    normalizeJournalPayload,
    requireAuth,
    asyncHandler,
    toNumber
}) {
    modelCrud({
        base: "/api/trips",
        delegate: "trip",
        normalize: normalizeTripPayload,
        authCreate: true,
        authUpdate: true,
        authDelete: true,
        notFoundMessage: "trips item not found."
    });

    modelCrud({
        base: "/api/expenses",
        delegate: "expense",
        normalize: normalizeExpensePayload,
        authCreate: true,
        authUpdate: true,
        authDelete: true,
        notFoundMessage: "expenses item not found."
    });

    modelCrud({
        base: "/api/journals",
        delegate: "journal",
        normalize: normalizeJournalPayload,
        authCreate: true,
        authUpdate: true,
        authDelete: true,
        notFoundMessage: "journals item not found."
    });

    app.get("/api/trips/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.trip.findMany({
            where: { userId },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.get("/api/expenses/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.expense.findMany({
            where: { userId },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.get("/api/expenses/trip/:tripId", requireAuth, asyncHandler(async (req, res) => {
        const tripId = toNumber(req.params.tripId, 0);
        const list = await prisma.expense.findMany({
            where: { tripId },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.get("/api/journals/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.journal.findMany({
            where: { userId },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));
}
