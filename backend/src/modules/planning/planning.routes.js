export function registerPlanningRoutes({
    app,
    prisma,
    modelCrud,
    normalizeTripPayload,
    normalizeExpensePayload,
    normalizeJournalPayload,
    requireAuth,
    requireAdmin,
    requireSelfOrAdmin,
    requireCompanyOwnerOrAdmin,
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

    app.get("/api/trips/user/:userId", requireSelfOrAdmin((req) => req.params.userId), asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.trip.findMany({
            where: { userId },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.get("/api/expenses/user/:userId", requireSelfOrAdmin((req) => req.params.userId), asyncHandler(async (req, res) => {
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

    app.get("/api/journals/user/:userId", requireSelfOrAdmin((req) => req.params.userId), asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.journal.findMany({
            where: { userId },
            orderBy: { id: "asc" }
        });

        res.json(list);
    }));

    app.get("/api/users", requireAdmin, asyncHandler(async (_req, res) => {
        const list = await prisma.user.findMany({
            orderBy: { id: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });

        res.json(list);
    }));

    app.get("/api/ai-plans/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const list = await prisma.aiTripPlan.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" }
        });

        res.json(list);
    }));

    app.get("/api/ai-plans/:id", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const plan = await prisma.aiTripPlan.findUnique({ where: { id } });
        if (!plan) {
            return res.status(404).json({ message: "AI trip plan not found." });
        }
        res.json(plan);
    }));

    app.post("/api/ai-plans", requireAuth, asyncHandler(async (req, res) => {
        const body = req.body || {};
        const userId = toNumber(body.userId, 0) || req.user?.id || 0;
        const destination = String(body.destination || "").trim();
        const duration = toNumber(body.duration, 0);
        const travelersCount = toNumber(body.travelersCount, 1) || 1;
        const budget = body.budget == null ? null : toNumber(body.budget, 0);
        const estimatedCost = body.estimatedCost == null ? null : toNumber(body.estimatedCost, 0);
        const travelInterests = Array.isArray(body.travelInterests)
            ? body.travelInterests.map((item) => String(item || "").trim()).filter(Boolean)
            : [];
        const generatedItinerary = body.generatedItinerary;

        if (!userId || !destination || !duration || !Array.isArray(generatedItinerary)) {
            return res.status(400).json({ message: "Invalid AI trip plan payload." });
        }

        const created = await prisma.aiTripPlan.create({
            data: {
                userId,
                destination,
                duration,
                budget,
                travelersCount,
                travelInterests,
                generatedItinerary,
                estimatedCost
            }
        });

        res.status(201).json(created);
    }));

    app.put("/api/ai-plans/:id", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const exists = await prisma.aiTripPlan.findUnique({ where: { id } });
        if (!exists) {
            return res.status(404).json({ message: "AI trip plan not found." });
        }

        const body = req.body || {};
        const payload = {};
        if (body.destination !== undefined) payload.destination = String(body.destination || "").trim();
        if (body.duration !== undefined) payload.duration = toNumber(body.duration, exists.duration);
        if (body.budget !== undefined) payload.budget = body.budget == null ? null : toNumber(body.budget, exists.budget || 0);
        if (body.travelersCount !== undefined) payload.travelersCount = toNumber(body.travelersCount, exists.travelersCount || 1);
        if (body.travelInterests !== undefined) {
            payload.travelInterests = Array.isArray(body.travelInterests)
                ? body.travelInterests.map((item) => String(item || "").trim()).filter(Boolean)
                : [];
        }
        if (body.generatedItinerary !== undefined) payload.generatedItinerary = body.generatedItinerary;
        if (body.estimatedCost !== undefined) payload.estimatedCost = body.estimatedCost == null ? null : toNumber(body.estimatedCost, exists.estimatedCost || 0);

        const updated = await prisma.aiTripPlan.update({
            where: { id },
            data: payload
        });

        res.json(updated);
    }));

    app.delete("/api/ai-plans/:id", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const exists = await prisma.aiTripPlan.findUnique({ where: { id } });
        if (!exists) {
            return res.status(404).json({ message: "AI trip plan not found." });
        }

        await prisma.aiTripPlan.delete({ where: { id } });
        res.status(204).send();
    }));

    function dateRangeFilters(req) {
        const from = req.query?.from ? new Date(String(req.query.from)) : null;
        const to = req.query?.to ? new Date(String(req.query.to)) : null;
        const createdAt = {};
        if (from && !Number.isNaN(from.getTime())) createdAt.gte = from;
        if (to && !Number.isNaN(to.getTime())) {
            to.setHours(23, 59, 59, 999);
            createdAt.lte = to;
        }
        return Object.keys(createdAt).length ? { createdAt } : {};
    }

    function topNameFromMap(counter) {
        return [...counter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    }

    function buildOwnerNotifications(company, bookings) {
        const notifications = [];
        const latestBooking = bookings[0];
        if (latestBooking) {
            notifications.push({
                audienceRole: "owner",
                companyId: company.id,
                title: "New booking received",
                message: `${latestBooking.customerName} booked a ${latestBooking.serviceType || "service"} request.`,
                isRead: false
            });
        }
        if ((company.reviewsCount || 0) > 0) {
            notifications.push({
                audienceRole: "owner",
                companyId: company.id,
                title: "New review submitted",
                message: `${company.name} currently has ${company.reviewsCount} total reviews.`,
                isRead: false
            });
        }
        const activeTravelers = bookings.reduce((sum, item) => sum + (item.travelersCount || 0), 0);
        if (activeTravelers >= 10) {
            notifications.push({
                audienceRole: "owner",
                companyId: company.id,
                title: "Tour reaching full capacity",
                message: `${company.name} has high active traveler volume this period.`,
                isRead: false
            });
        }
        if (company.specialOffer?.active) {
            notifications.push({
                audienceRole: "owner",
                companyId: company.id,
                title: "Offer expiration reminder",
                message: `${company.name} still has an active promotional offer running.`,
                isRead: false
            });
        }
        return notifications;
    }

    async function persistNotifications(rows) {
        for (const row of rows) {
            const exists = await prisma.dashboardNotification.findFirst({
                where: {
                    companyId: row.companyId ?? null,
                    audienceRole: row.audienceRole,
                    title: row.title,
                    message: row.message
                }
            });
            if (!exists) {
                await prisma.dashboardNotification.create({ data: row });
            }
        }
    }

    app.get("/api/analytics/owner/:companyId", requireCompanyOwnerOrAdmin((req) => req.params.companyId), asyncHandler(async (req, res) => {
        const companyId = toNumber(req.params.companyId, 0);
        if (!companyId) {
            return res.status(400).json({ message: "Invalid company id." });
        }

        const company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return res.status(404).json({ message: "Company not found." });
        }

        const bookings = await prisma.companyBooking.findMany({
            where: { companyId, ...dateRangeFilters(req) },
            orderBy: { createdAt: "desc" }
        });
        const tours = await prisma.tour.findMany({ where: { companyId } });
        const packages = await prisma.package.findMany({ where: { companyId } });
        const reviews = await prisma.review.findMany({ where: { placeType: "company", placeId: companyId } });

        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
        const averageRating = reviews.length
            ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
            : Number(company.rating || 0);

        const tourCounter = new Map();
        const packageCounter = new Map();
        bookings.forEach((booking) => {
            if ((booking.serviceType || "").toLowerCase().includes("tour")) {
                const tour = tours.find((item) => Number(item.id) === Number(booking.serviceId));
                const key = tour?.title || "Tour";
                tourCounter.set(key, (tourCounter.get(key) || 0) + 1);
            }
            if ((booking.serviceType || "").toLowerCase().includes("package")) {
                const pkg = packages.find((item) => Number(item.id) === Number(booking.serviceId));
                const key = pkg?.title || "Package";
                packageCounter.set(key, (packageCounter.get(key) || 0) + 1);
            }
        });

        const payload = {
            companyId,
            totalBookings,
            totalRevenue,
            averageRating,
            activeTours: tours.filter((item) => item.isActive).length,
            activePackages: packages.filter((item) => item.isActive).length,
            customerRatings: averageRating,
            recentBookings: bookings.slice(0, 10),
            mostPopularTour: topNameFromMap(tourCounter),
            mostPopularPackage: topNameFromMap(packageCounter)
        };

        await prisma.analyticsRecord.create({
            data: {
                companyId,
                totalBookings,
                totalRevenue,
                averageRating,
                mostPopularTour: payload.mostPopularTour,
                mostPopularPackage: payload.mostPopularPackage,
                reportDate: new Date()
            }
        });

        await persistNotifications(buildOwnerNotifications(company, bookings));
        res.json(payload);
    }));

    app.get("/api/analytics/admin", requireAdmin, asyncHandler(async (req, res) => {
        const [users, companies, bookings, tours] = await Promise.all([
            prisma.user.findMany(),
            prisma.company.findMany(),
            prisma.companyBooking.findMany({ where: dateRangeFilters(req), orderBy: { createdAt: "desc" } }),
            prisma.tour.findMany()
        ]);

        const totalRevenue = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
        const destinationCounter = new Map();
        const tourCounter = new Map();
        const companyCounter = new Map();

        bookings.forEach((booking) => {
            const company = companies.find((item) => Number(item.id) === Number(booking.companyId));
            if (company?.city) destinationCounter.set(company.city, (destinationCounter.get(company.city) || 0) + 1);
            if (company?.name) companyCounter.set(company.name, (companyCounter.get(company.name) || 0) + Number(booking.totalPrice || 0));
            const tour = tours.find((item) => Number(item.id) === Number(booking.serviceId));
            if (tour?.title) tourCounter.set(tour.title, (tourCounter.get(tour.title) || 0) + 1);
        });

        await persistNotifications([
            bookings[0] ? {
                audienceRole: "admin",
                userId: req.user?.id || null,
                title: "New booking received",
                message: `${bookings[0].customerName} created a new booking request.`,
                isRead: false
            } : null,
            companies[0] ? {
                audienceRole: "admin",
                userId: req.user?.id || null,
                title: "New review submitted",
                message: `${companies[0].name} continues to receive traveler engagement.`,
                isRead: false
            } : null,
            tourCounter.size ? {
                audienceRole: "admin",
                userId: req.user?.id || null,
                title: "Tour reaching full capacity",
                message: `${topNameFromMap(tourCounter)} is trending across bookings.`,
                isRead: false
            } : null
        ].filter(Boolean));

        res.json({
            totalUsers: users.length,
            totalCompanies: companies.length,
            totalBookings: bookings.length,
            totalRevenue,
            mostPopularDestinations: [...destinationCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
            mostBookedTours: [...tourCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
            topPerformingCompanies: [...companyCounter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, revenue]) => ({ name, revenue }))
        });
    }));

    app.get("/api/analytics/company/:companyId/records", requireCompanyOwnerOrAdmin((req) => req.params.companyId), asyncHandler(async (req, res) => {
        const companyId = toNumber(req.params.companyId, 0);
        const records = await prisma.analyticsRecord.findMany({
            where: { companyId },
            orderBy: { reportDate: "desc" }
        });
        res.json(records);
    }));

    app.get("/api/dashboard-notifications", requireAuth, asyncHandler(async (req, res) => {
        if (req.query?.companyId && req.user?.role !== "ADMIN") {
            const requestedCompanyId = toNumber(req.query.companyId, 0);
            const company = await prisma.company.findUnique({ where: { id: requestedCompanyId }, select: { ownerUserId: true } });
            if (!company || Number(company.ownerUserId) !== Number(req.user?.id)) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }
        if (req.query?.userId && req.user?.role !== "ADMIN" && Number(req.query.userId) !== Number(req.user?.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const companyId = req.query?.companyId ? toNumber(req.query.companyId, 0) : undefined;
        const userId = req.query?.userId ? toNumber(req.query.userId, 0) : undefined;
        const role = String(req.query?.role || "").trim();
        const notifications = await prisma.dashboardNotification.findMany({
            where: {
                ...(companyId ? { companyId } : {}),
                ...(userId ? { userId } : {}),
                ...(role ? { audienceRole: role } : {})
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(notifications);
    }));

    app.post("/api/dashboard-notifications", requireAdmin, asyncHandler(async (req, res) => {
        const body = req.body || {};
        const title = String(body.title || "").trim();
        const message = String(body.message || "").trim();
        const audienceRole = String(body.audienceRole || "").trim() || "owner";
        if (!title || !message) {
            return res.status(400).json({ message: "Notification title and message are required." });
        }

        const created = await prisma.dashboardNotification.create({
            data: {
                userId: body.userId == null ? null : toNumber(body.userId, null),
                companyId: body.companyId == null ? null : toNumber(body.companyId, null),
                audienceRole,
                title,
                message,
                isRead: Boolean(body.isRead)
            }
        });
        res.status(201).json(created);
    }));

    app.patch("/api/dashboard-notifications/:id/read", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const exists = await prisma.dashboardNotification.findUnique({ where: { id } });
        if (!exists) {
            return res.status(404).json({ message: "Notification not found." });
        }
        if (req.user?.role !== "ADMIN") {
            if (exists.userId && Number(exists.userId) !== Number(req.user?.id)) {
                return res.status(403).json({ message: "Forbidden" });
            }
            if (exists.companyId) {
                const company = await prisma.company.findUnique({ where: { id: exists.companyId }, select: { ownerUserId: true } });
                if (!company || Number(company.ownerUserId) !== Number(req.user?.id)) {
                    return res.status(403).json({ message: "Forbidden" });
                }
            }
        }

        const updated = await prisma.dashboardNotification.update({
            where: { id },
            data: { isRead: req.body?.isRead === false ? false : true }
        });
        res.json(updated);
    }));

    function normalizeStringArray(value) {
        return Array.isArray(value)
            ? value.map((item) => String(item || "").trim()).filter(Boolean)
            : [];
    }

    function normalizeNullableDate(value) {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function normalizeStoryPayload(body, existingStory = null) {
        const title = body.title !== undefined ? String(body.title || "").trim() : existingStory?.title;
        const destination = body.destination !== undefined ? String(body.destination || "").trim() : existingStory?.destination;
        const storyTextSource = body.storyText ?? body.description ?? existingStory?.storyText ?? "";
        const storyText = String(storyTextSource || "").trim();

        return {
            userId: body.userId == null
                ? existingStory?.userId ?? null
                : toNumber(body.userId, existingStory?.userId ?? 0) || existingStory?.userId || null,
            guideId: body.guideId === undefined
                ? existingStory?.guideId ?? undefined
                : body.guideId == null ? null : toNumber(body.guideId, existingStory?.guideId ?? null),
            attractionId: body.attractionId === undefined
                ? existingStory?.attractionId ?? undefined
                : body.attractionId == null ? null : toNumber(body.attractionId, existingStory?.attractionId ?? null),
            title,
            destination,
            destinationSlug: body.destinationSlug !== undefined
                ? String(body.destinationSlug || "").trim() || null
                : existingStory?.destinationSlug ?? undefined,
            description: body.description !== undefined
                ? String(body.description || "").trim() || null
                : existingStory?.description ?? undefined,
            videoUrl: body.videoUrl !== undefined
                ? String(body.videoUrl || "").trim() || null
                : existingStory?.videoUrl ?? undefined,
            thumbnailUrl: body.thumbnailUrl !== undefined
                ? String(body.thumbnailUrl || "").trim() || null
                : existingStory?.thumbnailUrl ?? undefined,
            sponsorCompanyName: body.sponsorCompanyName !== undefined
                ? String(body.sponsorCompanyName || "").trim() || null
                : existingStory?.sponsorCompanyName ?? undefined,
            viewsCount: body.viewsCount !== undefined
                ? Math.max(0, toNumber(body.viewsCount, existingStory?.viewsCount ?? 0))
                : existingStory?.viewsCount ?? undefined,
            isActive: body.isActive !== undefined
                ? Boolean(body.isActive)
                : existingStory?.isActive ?? undefined,
            coverImage: body.coverImage !== undefined
                ? String(body.coverImage || "").trim() || null
                : existingStory?.coverImage ?? undefined,
            mediaType: body.mediaType !== undefined
                ? String(body.mediaType || "video").trim() || "video"
                : existingStory?.mediaType ?? undefined,
            storyText,
            estimatedCost: body.estimatedCost !== undefined
                ? body.estimatedCost == null ? null : toNumber(body.estimatedCost, existingStory?.estimatedCost ?? 0)
                : existingStory?.estimatedCost ?? undefined,
            durationDays: body.durationDays !== undefined
                ? toNumber(body.durationDays, existingStory?.durationDays ?? 1) || 1
                : existingStory?.durationDays ?? undefined,
            travelersCount: body.travelersCount !== undefined
                ? toNumber(body.travelersCount, existingStory?.travelersCount ?? 1) || 1
                : existingStory?.travelersCount ?? undefined,
            rating: body.rating !== undefined
                ? body.rating == null ? null : toNumber(body.rating, existingStory?.rating ?? 0)
                : existingStory?.rating ?? undefined,
            travelInterests: body.travelInterests !== undefined
                ? normalizeStringArray(body.travelInterests)
                : existingStory?.travelInterests ?? undefined,
            tags: body.tags !== undefined
                ? normalizeStringArray(body.tags)
                : existingStory?.tags ?? undefined,
            activities: body.activities !== undefined
                ? normalizeStringArray(body.activities)
                : existingStory?.activities ?? undefined,
            travelTips: body.travelTips !== undefined
                ? normalizeStringArray(body.travelTips)
                : existingStory?.travelTips ?? undefined
        };
    }

    function storyInclude() {
        return {
            user: { select: { id: true, name: true, preferredLanguage: true } },
            guide: { select: { id: true, fullName: true, rating: true, hourlyRate: true, languages: true, isVerified: true, isLicensed: true } },
            attraction: { select: { id: true, nameEn: true, city: true } },
            interactions: {
                include: {
                    user: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: "desc" }
            }
        };
    }

    function canManageStory(user, story) {
        if (!user || !story) return false;
        return user.role === "ADMIN" || Number(user.id) === Number(story.userId);
    }

    app.get("/api/traveler-stories", asyncHandler(async (req, res) => {
        const destination = String(req.query?.destination || "").trim();
        const tag = String(req.query?.tag || "").trim();
        const stories = await prisma.travelerStory.findMany({
            where: {
                isActive: true,
                ...(destination ? { destination: { equals: destination, mode: "insensitive" } } : {}),
                ...(tag ? { tags: { has: tag } } : {})
            },
            include: storyInclude(),
            orderBy: { updatedAt: "desc" }
        });
        res.json(stories);
    }));

    app.get("/api/traveler-stories/mine/:userId", requireSelfOrAdmin((req) => req.params.userId), asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        const stories = await prisma.travelerStory.findMany({
            where: { userId },
            include: storyInclude(),
            orderBy: { updatedAt: "desc" }
        });
        res.json(stories);
    }));

    app.get("/api/admin/traveler-stories", requireAdmin, asyncHandler(async (_req, res) => {
        const stories = await prisma.travelerStory.findMany({
            include: storyInclude(),
            orderBy: { updatedAt: "desc" }
        });
        res.json(stories);
    }));

    app.get("/api/traveler-stories/:id", asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const story = await prisma.travelerStory.findUnique({
            where: { id },
            include: storyInclude()
        });
        if (!story) {
            return res.status(404).json({ message: "Traveler story not found." });
        }
        if (!story.isActive) {
            return res.status(404).json({ message: "Traveler story not found." });
        }
        res.json(story);
    }));

    app.post("/api/traveler-stories", requireAuth, asyncHandler(async (req, res) => {
        const body = req.body || {};
        const userId = toNumber(body.userId, 0) || req.user?.id || 0;
        const payload = normalizeStoryPayload({ ...body, userId });
        if (!userId || !payload.title || !payload.destination || !payload.storyText || !payload.videoUrl) {
            return res.status(400).json({ message: "Traveler story title, destination, description, and video are required." });
        }

        const created = await prisma.travelerStory.create({
            data: {
                ...payload,
                coverImage: payload.coverImage || payload.thumbnailUrl
            }
        });
        res.status(201).json(created);
    }));

    app.put("/api/traveler-stories/:id", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const existing = await prisma.travelerStory.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Traveler story not found." });
        }
        if (!canManageStory(req.user, existing)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const payload = normalizeStoryPayload(req.body || {}, existing);
        if (!payload.title || !payload.destination || !payload.storyText || !payload.videoUrl) {
            return res.status(400).json({ message: "Traveler story title, destination, description, and video are required." });
        }

        const updated = await prisma.travelerStory.update({
            where: { id },
            data: {
                ...payload,
                coverImage: payload.coverImage || payload.thumbnailUrl || existing.coverImage
            }
        });
        res.json(updated);
    }));

    app.delete("/api/traveler-stories/:id", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const existing = await prisma.travelerStory.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Traveler story not found." });
        }
        if (!canManageStory(req.user, existing)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await prisma.travelerStory.delete({ where: { id } });
        res.status(204).send();
    }));

    app.patch("/api/admin/traveler-stories/:id/status", requireAdmin, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const existing = await prisma.travelerStory.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ message: "Traveler story not found." });
        }

        const updated = await prisma.travelerStory.update({
            where: { id },
            data: {
                isActive: req.body?.isActive === false ? false : true
            }
        });
        res.json(updated);
    }));

    app.post("/api/traveler-stories/:id/view", asyncHandler(async (req, res) => {
        const storyId = toNumber(req.params.id, 0);
        const story = await prisma.travelerStory.findUnique({ where: { id: storyId } });
        if (!story || !story.isActive) {
            return res.status(404).json({ message: "Traveler story not found." });
        }

        const updated = await prisma.travelerStory.update({
            where: { id: storyId },
            data: {
                viewsCount: { increment: 1 }
            }
        });
        res.json({ viewsCount: updated.viewsCount });
    }));

    app.post("/api/traveler-stories/:id/interactions", requireAuth, asyncHandler(async (req, res) => {
        const storyId = toNumber(req.params.id, 0);
        const story = await prisma.travelerStory.findUnique({ where: { id: storyId } });
        if (!story || !story.isActive) {
            return res.status(404).json({ message: "Traveler story not found." });
        }

        const interactionType = String(req.body?.interactionType || "").trim().toLowerCase();
        const content = req.body?.content == null ? null : String(req.body.content).trim();
        if (!["like", "comment", "save", "share"].includes(interactionType)) {
            return res.status(400).json({ message: "Invalid interaction type." });
        }

        const created = await prisma.travelerStoryInteraction.create({
            data: {
                storyId,
                userId: req.user?.id || toNumber(req.body?.userId, 0),
                interactionType,
                content
            }
        });
        res.status(201).json(created);
    }));

    app.get("/api/certified-guides", asyncHandler(async (req, res) => {
        const attractionId = req.query?.attractionId ? toNumber(req.query.attractionId, 0) : undefined;
        const companyId = req.query?.companyId ? toNumber(req.query.companyId, 0) : undefined;
        const language = String(req.query?.language || "").trim();
        const availability = String(req.query?.availability || "").trim();
        const minRating = req.query?.minRating ? toNumber(req.query.minRating, 0) : undefined;
        const guides = await prisma.certifiedGuide.findMany({
            where: {
                ...(attractionId ? { attractionId } : {}),
                ...(companyId ? { companyId } : {}),
                ...(language ? { languages: { has: language } } : {}),
                ...(availability ? { availability: { contains: availability, mode: "insensitive" } } : {}),
                ...(minRating ? { rating: { gte: minRating } } : {})
            },
            include: {
                company: { select: { id: true, name: true, slug: true } },
                attraction: { select: { id: true, nameEn: true, city: true } }
            },
            orderBy: [{ rating: "desc" }, { yearsExperience: "desc" }]
        });
        res.json(guides);
    }));

    app.get("/api/certified-guides/:id", asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const guide = await prisma.certifiedGuide.findUnique({
            where: { id },
            include: {
                company: true,
                attraction: true,
                travelerStories: true
            }
        });
        if (!guide) {
            return res.status(404).json({ message: "Guide not found." });
        }
        res.json(guide);
    }));

    app.post("/api/certified-guides", requireAuth, asyncHandler(async (req, res) => {
        const body = req.body || {};
        if (!String(body.fullName || "").trim()) {
            return res.status(400).json({ message: "Guide full name is required." });
        }
        if (req.user?.role !== "ADMIN") {
            const companyId = body.companyId == null ? 0 : toNumber(body.companyId, 0);
            if (!companyId) {
                return res.status(403).json({ message: "Only admins or company owners can create guides." });
            }
            const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerUserId: true } });
            if (!company || Number(company.ownerUserId) !== Number(req.user?.id)) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }

        const created = await prisma.certifiedGuide.create({
            data: {
                companyId: body.companyId == null ? null : toNumber(body.companyId, null),
                attractionId: body.attractionId == null ? null : toNumber(body.attractionId, null),
                fullName: String(body.fullName).trim(),
                profilePhoto: String(body.profilePhoto || "").trim() || null,
                languages: normalizeStringArray(body.languages),
                yearsExperience: toNumber(body.yearsExperience, 0),
                rating: body.rating == null ? null : toNumber(body.rating, 0),
                hourlyRate: body.hourlyRate == null ? null : toNumber(body.hourlyRate, 0),
                isVerified: body.isVerified !== false,
                isLicensed: body.isLicensed !== false,
                availability: String(body.availability || "").trim() || null,
                destinations: normalizeStringArray(body.destinations),
                bio: String(body.bio || "").trim() || null,
                services: normalizeStringArray(body.services)
            }
        });
        res.status(201).json(created);
    }));

    app.post("/api/guide-bookings", requireAuth, asyncHandler(async (req, res) => {
        const body = req.body || {};
        const guideId = toNumber(body.guideId, 0);
        if (!guideId || !String(body.customerName || "").trim() || !String(body.customerEmail || "").trim()) {
            return res.status(400).json({ message: "Guide, customer name, and customer email are required." });
        }

        const created = await prisma.guideBooking.create({
            data: {
                guideId,
                userId: body.userId == null ? req.user?.id || null : toNumber(body.userId, null),
                attractionId: body.attractionId == null ? null : toNumber(body.attractionId, null),
                bookingDate: normalizeNullableDate(body.bookingDate) || new Date(),
                travelersCount: toNumber(body.travelersCount, 1) || 1,
                customerName: String(body.customerName).trim(),
                customerPhone: String(body.customerPhone || "").trim(),
                customerEmail: String(body.customerEmail).trim(),
                specialRequests: String(body.specialRequests || "").trim() || null,
                totalPrice: body.totalPrice == null ? null : toNumber(body.totalPrice, 0),
                currency: String(body.currency || "JOD").trim(),
                paymentMethod: String(body.paymentMethod || "").trim() || null,
                paymentStatus: String(body.paymentStatus || "Pending").trim(),
                bookingStatus: String(body.bookingStatus || "Pending").trim()
            }
        });
        res.status(201).json(created);
    }));

    app.get("/api/guide-bookings", requireAuth, asyncHandler(async (req, res) => {
        const guideId = req.query?.guideId ? toNumber(req.query.guideId, 0) : undefined;
        const userId = req.query?.userId ? toNumber(req.query.userId, 0) : undefined;
        if (req.user?.role !== "ADMIN") {
            if (userId && Number(userId) !== Number(req.user?.id)) {
                return res.status(403).json({ message: "Forbidden" });
            }
            if (guideId) {
                const guide = await prisma.certifiedGuide.findUnique({ where: { id: guideId }, select: { companyId: true } });
                const company = guide?.companyId ? await prisma.company.findUnique({ where: { id: guide.companyId }, select: { ownerUserId: true } }) : null;
                if (Number(userId || 0) !== Number(req.user?.id) && (!company || Number(company.ownerUserId) !== Number(req.user?.id))) {
                    return res.status(403).json({ message: "Forbidden" });
                }
            }
        }
        const bookings = await prisma.guideBooking.findMany({
            where: {
                ...(guideId ? { guideId } : {}),
                ...(userId ? { userId } : {})
            },
            include: {
                guide: { select: { id: true, fullName: true, hourlyRate: true } },
                attraction: { select: { id: true, nameEn: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(bookings);
    }));

    app.post("/api/checkout-orders", requireAuth, asyncHandler(async (req, res) => {
        const body = req.body || {};
        if (!String(body.orderType || "").trim() || !String(body.serviceName || "").trim() || !String(body.customerName || "").trim()) {
            return res.status(400).json({ message: "Order type, service name, and customer name are required." });
        }

        const created = await prisma.checkoutOrder.create({
            data: {
                userId: body.userId == null ? req.user?.id || null : toNumber(body.userId, null),
                companyId: body.companyId == null ? null : toNumber(body.companyId, null),
                guideId: body.guideId == null ? null : toNumber(body.guideId, null),
                orderType: String(body.orderType).trim(),
                referenceId: body.referenceId == null ? null : toNumber(body.referenceId, null),
                serviceName: String(body.serviceName).trim(),
                destination: String(body.destination || "").trim() || null,
                bookingDate: normalizeNullableDate(body.bookingDate),
                startDate: normalizeNullableDate(body.startDate),
                endDate: normalizeNullableDate(body.endDate),
                travelersCount: toNumber(body.travelersCount, 1) || 1,
                addOns: normalizeStringArray(body.addOns),
                subtotal: toNumber(body.subtotal, 0),
                taxes: toNumber(body.taxes, 0),
                fees: toNumber(body.fees, 0),
                total: toNumber(body.total, 0),
                currency: String(body.currency || "JOD").trim(),
                paymentMethod: String(body.paymentMethod || "").trim() || null,
                orderStatus: String(body.orderStatus || "Pending").trim(),
                customerName: String(body.customerName).trim(),
                customerEmail: String(body.customerEmail || "").trim(),
                customerPhone: String(body.customerPhone || "").trim(),
                notes: String(body.notes || "").trim() || null
            }
        });
        res.status(201).json(created);
    }));

    app.get("/api/checkout-orders", requireAuth, asyncHandler(async (req, res) => {
        const userId = req.query?.userId ? toNumber(req.query.userId, 0) : undefined;
        const companyId = req.query?.companyId ? toNumber(req.query.companyId, 0) : undefined;
        if (req.user?.role !== "ADMIN") {
            if (userId && Number(userId) !== Number(req.user?.id)) {
                return res.status(403).json({ message: "Forbidden" });
            }
            if (companyId) {
                const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerUserId: true } });
                if (!company || Number(company.ownerUserId) !== Number(req.user?.id)) {
                    return res.status(403).json({ message: "Forbidden" });
                }
            }
        }
        const orders = await prisma.checkoutOrder.findMany({
            where: {
                ...(userId ? { userId } : {}),
                ...(companyId ? { companyId } : {})
            },
            include: {
                paymentTransactions: true,
                company: { select: { id: true, name: true } },
                guide: { select: { id: true, fullName: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(orders);
    }));

    app.get("/api/checkout-orders/:id", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const order = await prisma.checkoutOrder.findUnique({
            where: { id },
            include: {
                paymentTransactions: true,
                company: true,
                guide: true
            }
        });
        if (!order) {
            return res.status(404).json({ message: "Checkout order not found." });
        }
        if (req.user?.role !== "ADMIN") {
            const ownsOrder = order.userId && Number(order.userId) === Number(req.user?.id);
            const ownsCompany = order.companyId
                ? Number((await prisma.company.findUnique({ where: { id: order.companyId }, select: { ownerUserId: true } }))?.ownerUserId) === Number(req.user?.id)
                : false;
            if (!ownsOrder && !ownsCompany) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }
        res.json(order);
    }));

    app.patch("/api/checkout-orders/:id/status", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const exists = await prisma.checkoutOrder.findUnique({ where: { id } });
        if (!exists) {
            return res.status(404).json({ message: "Checkout order not found." });
        }
        if (req.user?.role !== "ADMIN") {
            const company = exists.companyId ? await prisma.company.findUnique({ where: { id: exists.companyId }, select: { ownerUserId: true } }) : null;
            if (!company || Number(company.ownerUserId) !== Number(req.user?.id)) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }
        const updated = await prisma.checkoutOrder.update({
            where: { id },
            data: {
                orderStatus: String(req.body?.orderStatus || exists.orderStatus).trim(),
                paymentMethod: req.body?.paymentMethod !== undefined ? String(req.body.paymentMethod || "").trim() || null : exists.paymentMethod
            }
        });
        res.json(updated);
    }));

    app.post("/api/payment-transactions", requireAuth, asyncHandler(async (req, res) => {
        const body = req.body || {};
        const checkoutOrderId = toNumber(body.checkoutOrderId, 0);
        if (!checkoutOrderId || !body.amount) {
            return res.status(400).json({ message: "Checkout order and amount are required." });
        }
        const order = await prisma.checkoutOrder.findUnique({ where: { id: checkoutOrderId } });
        if (!order) {
            return res.status(404).json({ message: "Checkout order not found." });
        }
        if (req.user?.role !== "ADMIN" && Number(order.userId || 0) !== Number(req.user?.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const created = await prisma.paymentTransaction.create({
            data: {
                checkoutOrderId,
                provider: String(body.provider || "").trim() || null,
                transactionRef: String(body.transactionRef || "").trim() || null,
                amount: toNumber(body.amount, 0),
                currency: String(body.currency || "JOD").trim(),
                status: String(body.status || "Pending").trim(),
                paidAt: normalizeNullableDate(body.paidAt)
            }
        });

        if (created.status.toLowerCase() === "paid") {
            await prisma.checkoutOrder.update({
                where: { id: checkoutOrderId },
                data: { orderStatus: "Paid" }
            });
        }

        res.status(201).json(created);
    }));

    app.get("/api/payment-transactions/order/:checkoutOrderId", requireAuth, asyncHandler(async (req, res) => {
        const checkoutOrderId = toNumber(req.params.checkoutOrderId, 0);
        const order = await prisma.checkoutOrder.findUnique({ where: { id: checkoutOrderId } });
        if (!order) {
            return res.status(404).json({ message: "Checkout order not found." });
        }
        if (req.user?.role !== "ADMIN") {
            const ownsOrder = Number(order.userId || 0) === Number(req.user?.id);
            const ownsCompany = order.companyId
                ? Number((await prisma.company.findUnique({ where: { id: order.companyId }, select: { ownerUserId: true } }))?.ownerUserId) === Number(req.user?.id)
                : false;
            if (!ownsOrder && !ownsCompany) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }
        const transactions = await prisma.paymentTransaction.findMany({
            where: { checkoutOrderId },
            orderBy: { createdAt: "desc" }
        });
        res.json(transactions);
    }));

    app.get("/api/company-chat/:companyId", requireAuth, asyncHandler(async (req, res) => {
        const companyId = toNumber(req.params.companyId, 0);
        const userId = req.query?.userId ? toNumber(req.query.userId, 0) : undefined;
        if (req.user?.role !== "ADMIN") {
            const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerUserId: true } });
            const isOwner = company && Number(company.ownerUserId) === Number(req.user?.id);
            const isSelf = userId && Number(userId) === Number(req.user?.id);
            if (!isOwner && !isSelf) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }
        const messages = await prisma.companyChatMessage.findMany({
            where: {
                companyId,
                ...(userId ? { userId } : {})
            },
            orderBy: { createdAt: "asc" }
        });
        res.json(messages);
    }));

    app.post("/api/company-chat", requireAuth, asyncHandler(async (req, res) => {
        const body = req.body || {};
        const companyId = toNumber(body.companyId, 0);
        if (!companyId || !String(body.senderName || "").trim() || !String(body.message || "").trim()) {
            return res.status(400).json({ message: "Company, sender name, and message are required." });
        }

        const created = await prisma.companyChatMessage.create({
            data: {
                companyId,
                userId: body.userId == null ? req.user?.id || null : toNumber(body.userId, null),
                senderName: String(body.senderName).trim(),
                message: String(body.message).trim(),
                direction: String(body.direction || "traveler_to_company").trim(),
                isRead: Boolean(body.isRead)
            }
        });
        res.status(201).json(created);
    }));

    app.patch("/api/company-chat/:id/read", requireAuth, asyncHandler(async (req, res) => {
        const id = toNumber(req.params.id, 0);
        const exists = await prisma.companyChatMessage.findUnique({ where: { id } });
        if (!exists) {
            return res.status(404).json({ message: "Company chat message not found." });
        }
        if (req.user?.role !== "ADMIN") {
            const company = await prisma.company.findUnique({ where: { id: exists.companyId }, select: { ownerUserId: true } });
            const isOwner = company && Number(company.ownerUserId) === Number(req.user?.id);
            const isSelf = exists.userId && Number(exists.userId) === Number(req.user?.id);
            if (!isOwner && !isSelf) {
                return res.status(403).json({ message: "Forbidden" });
            }
        }

        const updated = await prisma.companyChatMessage.update({
            where: { id },
            data: { isRead: req.body?.isRead === false ? false : true }
        });
        res.json(updated);
    }));
}
