// src/utils/month.util.js

import { CustomError } from "../response/customError.js";

export function assertMonthYYYYMM(month) {
    if (typeof month !== "string") {
        const e = new CustomError(
            "SAVEREPORT-400-001",
            "month must be string.",
            null,
            { month }
        )
        e.statusCode = 400;
        throw e;
    }

    // YYYY-MM (01~12)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        const e = new CustomError(
            "SAVEREPORT-400-001",
            "invalid month format. (YYYY-MM)",
            null,
            { month }
        )
        e.statusCode = 400;
        throw e;
    }
}

export function addMonths(yyyymm, diff) {
    const [yStr, mStr] = yyyymm.split("-");
    let y = Number(yStr);
    let m = Number(mStr); // 1..12
    m += diff;

    while (m <= 0) { m += 12; y -= 1; }
    while (m >= 13) { m -= 12; y += 1; }

    const mm = String(m).padStart(2, "0");
    return `${y}-${mm}`;
}

export function get3MonthRange(selectedMonth) {
    const prev = addMonths(selectedMonth, -1);
    const next = addMonths(selectedMonth, +1);
    return { prev, selected: selectedMonth, next, months: [prev, selectedMonth, next] };
}