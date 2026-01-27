// src/services/saveReport.service.js

import { assertMonthYYYYMM, get3MonthRange, addMonths } from "../utils/month.util.js";
import { findSaveReportsByMonths } from "../repositories/saveReport.repository.js";
import { findSaveItemsInMonth } from "../repositories/saveReportItem.repository.js";

export const getSaveReport = async ({ userId, month }) => {
    assertMonthYYYYMM(month);

    const { prev, selected, next, months } = get3MonthRange(month);

    // chart data
    const rows = await findSaveReportsByMonths({ userId, months });

    const map = new Map(rows.map(r => [
        r.month,
        { savedAmount: r.saved_amount, totalCount: r.total_count }
    ]));

    const chart = months.map(m => {
        const v = map.get(m) ?? { savedAmount:0, totalCount: 0 };
        return {
            month: m,
            savedAmount: v.savedAmount,
            totalCount: v.totalCount,
            highlight: m === selected,
        };
    });

    // items는 selected month만 조회, 월 필터(KST)
    // 기간: [selectedMonth 1일 00:00, nextMonth 1일 00:00)
    const start = new Date(`${selected}-01T00:00:00+09:00`);
    const endMonth = addMonths(selected, +1);
    const end = new Date(`${endMonth}-01T00:00:00+09:00`);

    const itemsRaw = await findSaveItemsInMonth({ userId, start, end, limit: 50 });

    const items = itemsRaw.map(x => ({
        notificationHistoryId: String(x.notification_history_id),

        originName: x.origin_name,
        destinationName: x.destination_name,

        departureDatetime: x.departure_datetime.toISOString(),
        arrivalDatetime: x.arrival_datetime.toISOString(),

        savedFareWon: x.saved_fare_won ?? 0,
    }));

    return {
        selectedMonth: selected,
        range: { from: prev, to: next },
        chart,
        items,
    };
}