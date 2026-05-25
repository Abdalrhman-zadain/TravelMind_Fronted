import jwt from "jsonwebtoken";

export function buildAuthHelpers({ jwtSecret, jwtExpiresIn, allowLegacyNumericToken }) {
    function parseAuthUserId(req) {
        const auth = req.headers.authorization || "";
        if (!auth.startsWith("Bearer ")) return null;
        const token = auth.slice("Bearer ".length).trim();

        try {
            const payload = jwt.verify(token, jwtSecret);
            const fromSub = Number(payload?.sub);
            if (Number.isInteger(fromSub) && fromSub > 0) return fromSub;
            const fromUserId = Number(payload?.userId);
            if (Number.isInteger(fromUserId) && fromUserId > 0) return fromUserId;
        } catch (_) {
            if (allowLegacyNumericToken) {
                const asInt = Number(token);
                if (Number.isInteger(asInt) && asInt > 0) return asInt;
            }
        }

        return null;
    }

    async function requireAuth(req, res, next) {
        const userId = parseAuthUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const prisma = req.app.locals?.prisma;
        if (!prisma) {
            return res.status(500).json({ message: "Auth layer is not configured correctly." });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                preferredLanguage: true
            }
        });

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.authUserId = userId;
        req.user = user;
        next();
    }

    function requireRole(allowedRoles) {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        return async function roleGuard(req, res, next) {
            await requireAuth(req, res, async () => {
                if (!roles.includes(req.user?.role)) {
                    return res.status(403).json({ message: "Forbidden" });
                }
                next();
            });
        };
    }

    function requireAdmin(req, res, next) {
        return requireRole("ADMIN")(req, res, next);
    }

    function requireSelfOrAdmin(resolveUserId) {
        return async function selfOrAdminGuard(req, res, next) {
            await requireAuth(req, res, async () => {
                const targetUserId = Number(resolveUserId(req));
                if (req.user?.role === "ADMIN" || Number(req.user?.id) === targetUserId) {
                    return next();
                }
                return res.status(403).json({ message: "Forbidden" });
            });
        };
    }

    function requireCompanyOwnerOrAdmin(resolveCompanyId) {
        return async function companyOwnerGuard(req, res, next) {
            await requireAuth(req, res, async () => {
                if (req.user?.role === "ADMIN") {
                    return next();
                }
                const prisma = req.app.locals?.prisma;
                const companyId = Number(resolveCompanyId(req));
                const company = await prisma.company.findUnique({
                    where: { id: companyId },
                    select: { ownerUserId: true }
                });
                if (company && Number(company.ownerUserId) === Number(req.user?.id)) {
                    return next();
                }
                return res.status(403).json({ message: "Forbidden" });
            });
        };
    }

    function makeJwtToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            jwtSecret,
            {
                subject: String(user.id),
                expiresIn: jwtExpiresIn
            }
        );
    }

    return {
        requireAuth,
        requireAdmin,
        requireRole,
        requireSelfOrAdmin,
        requireCompanyOwnerOrAdmin,
        makeJwtToken
    };
}
