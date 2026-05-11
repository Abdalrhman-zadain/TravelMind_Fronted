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

    function requireAuth(req, res, next) {
        const userId = parseAuthUserId(req);
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.authUserId = userId;
        next();
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
        makeJwtToken
    };
}
