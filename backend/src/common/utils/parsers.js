export function toLowerSafe(value) {
    return String(value || "").trim().toLowerCase();
}

export function toNumber(value, fallback = null) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function toDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
