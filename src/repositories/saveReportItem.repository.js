// src/repositories/saveReportItem.repository.js

import { prisma } from "../config/prisma.js";

export const findSaveItemsInMonth = async ({ userId, start, end, limit = 50 }) => {
    return prisma.notificationHistory.findMany({
        where: {
            user_id: BigInt(userId),
            departure_datetime: { gte: start, lt: end },
            saved_fare_won: { gt: 0 },
        },
        orderBy: { departure_datetime: "desc" }, // idx_nh_user_depart
        take: limit,
        select: {
            notification_history_id: true,

            origin_name: true,
            destination_name: true,

            departure_datetime: true,
            arrival_datetime: true,

            saved_fare_won: true,
        },
    });
};