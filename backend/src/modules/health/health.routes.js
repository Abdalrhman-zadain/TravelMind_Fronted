import { Router } from "express";

export function createHealthRouter() {
    const router = Router();

    router.get("/api/health", (_req, res) => {
        res.json({ status: "ok", service: "travelmind-node-api", database: "postgresql" });
    });

    return router;
}
