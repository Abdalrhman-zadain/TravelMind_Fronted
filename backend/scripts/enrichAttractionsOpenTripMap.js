import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { createAttractionEnrichmentService } from "../src/modules/catalog/attraction-geoapify-enrichment.service.js";

function parseArgs(argv) {
    const args = {
        overwrite: false,
        onlyMissing: true,
        batchSize: 20,
        limit: null,
    };

    for (const raw of argv) {
        const token = String(raw || "").trim();
        if (!token) continue;

        if (token === "--overwrite") args.overwrite = true;
        else if (token === "--all") args.onlyMissing = false;
        else if (token.startsWith("--batchSize=")) {
            const value = Number(token.split("=")[1]);
            if (Number.isFinite(value) && value > 0) args.batchSize = Math.floor(value);
        } else if (token.startsWith("--limit=")) {
            const value = Number(token.split("=")[1]);
            if (Number.isFinite(value) && value > 0) args.limit = Math.floor(value);
        }
    }

    return args;
}

async function main() {
    const prisma = new PrismaClient();

    try {
        const options = parseArgs(process.argv.slice(2));
        const service = createAttractionEnrichmentService({
            prisma,
            axiosInstance: axios,
            apiKey: process.env.GEOAPIFY_API_KEY || process.env.OPENTRIPMAP_API_KEY,
            logger: console,
        });

        console.log("[enrich-script] Starting Geoapify enrichment", options);
        const result = await service.enrichExistingAttractions(options);

        const failedIds = result.results
            .filter((row) => row.status === "failed")
            .map((row) => row.id);

        console.log("[enrich-script] Completed", {
            totalCandidates: result.totalCandidates,
            updated: result.updated,
            matchedNoChanges: result.matchedNoChanges,
            skipped: result.skipped,
            failed: result.failed,
            failedIds,
        });
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error("[enrich-script] Fatal error", error);
    process.exitCode = 1;
});
