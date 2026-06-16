import axios from "axios";

export function registerCommunityRoutes({
    app,
    prisma,
    requireAuth,
    asyncHandler,
    toNumber,
    normalizeReviewPayload,
    normalizeChatPayload,
    groqApiKey,
    groqModel
}) {
    const systemPrompt = `You are TravelMind AI, a friendly and knowledgeable travel assistant specializing in Jordan tourism.
You help travelers discover attractions, hotels, restaurants, plan trips, and learn about Jordanian culture and history.

Key facts about Jordan you know:
- Major destinations: Petra, Wadi Rum, Amman, Aqaba, Dead Sea, Jerash, Madaba, Ajloun
- Currency: Jordanian Dinar (JOD). 1 JOD is about 1.41 USD
- Language: Arabic (official), English widely spoken
- Best time to visit: March-May and September-November
- Famous food: Mansaf, Falafel, Hummus, Maqluba, Kunafa
- Petra entry fee: about 50 JOD for 1 day, about 55 JOD for 2 days
- Jordan Pass is available for multiple attractions
- Visa on arrival is available for many nationalities

Always be helpful, friendly, and concise. Use emojis occasionally.
If asked about bookings or real-time data, remind users to verify with official sources.
Answer in the same language the user writes in when possible.`;

    function normalizeConversation(history, message) {
        const safeHistory = Array.isArray(history) ? history : [];
        const normalized = safeHistory
            .map((entry) => {
                const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : null;
                const content = typeof entry?.content === "string" ? entry.content.trim() : "";
                if (!role || !content) return null;
                return { role, content };
            })
            .filter(Boolean)
            .slice(-20);

        const latestMessage = typeof message === "string" ? message.trim() : "";
        if (latestMessage) {
            const last = normalized[normalized.length - 1];
            if (!last || last.role !== "user" || last.content !== latestMessage) {
                normalized.push({ role: "user", content: latestMessage });
            }
        }

        return normalized;
    }

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

    app.post("/api/chat/reply", asyncHandler(async (req, res) => {
        if (!groqApiKey) {
            return res.status(503).json({ message: "Chat AI is not configured on the server." });
        }

        const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
        if (!message) {
            return res.status(400).json({ message: "Message is required." });
        }

        const messages = normalizeConversation(req.body?.history, message);

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: groqModel,
                temperature: 0.7,
                max_tokens: 700,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${groqApiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        const reply = response.data?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
            return res.status(502).json({ message: "Chat AI returned an empty response." });
        }

        res.json({ reply });
    }));

    app.delete("/api/chat/user/:userId", requireAuth, asyncHandler(async (req, res) => {
        const userId = toNumber(req.params.userId, 0);
        await prisma.chatMessage.deleteMany({ where: { userId } });
        res.status(204).send();
    }));
}
