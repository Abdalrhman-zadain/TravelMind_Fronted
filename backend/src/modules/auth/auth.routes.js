import { Router } from "express";
import bcrypt from "bcryptjs";

export function createAuthRouter({ prisma, asyncHandler, toLowerSafe, toDate, makeJwtToken }) {
    const router = Router();

    router.post("/api/auth/register", asyncHandler(async (req, res) => {
        const body = req.body || {};

        const name = String(body.name || "").trim();
        const email = toLowerSafe(body.email);
        const passwordHash = String(body.passwordHash || "").trim();
        const preferredLanguage = String(body.preferredLanguage || "en").trim() || "en";

        if (!name || !email || !passwordHash) {
            return res.status(400).json({ message: "Name, email and password are required." });
        }

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            return res.status(409).json({ message: "Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(passwordHash, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hashedPassword,
                role: String(body.role || "TRAVELER").trim().toUpperCase(),
                preferredLanguage,
                profileImage: String(body.profileImage || ""),
                createdAt: toDate(body.createdAt) || new Date()
            }
        });

        const token = makeJwtToken(user);

        res.status(201).json({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            language: user.preferredLanguage,
            token
        });
    }));

    router.post("/api/auth/login", asyncHandler(async (req, res) => {
        const body = req.body || {};

        const email = toLowerSafe(body.email);
        const passwordHash = String(body.passwordHash || "").trim();

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        let valid = false;
        const stored = String(user.passwordHash || "");
        if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
            valid = await bcrypt.compare(passwordHash, stored);
        } else {
            valid = stored === passwordHash;
            if (valid) {
                const upgraded = await bcrypt.hash(passwordHash, 10);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { passwordHash: upgraded }
                });
            }
        }

        if (!valid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = makeJwtToken(user);

        res.json({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            language: user.preferredLanguage,
            token
        });
    }));

    return router;
}
