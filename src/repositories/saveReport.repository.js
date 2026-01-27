// src/repositories/saveReport.repository.js

import { prisma } from "../config/prisma.js";

export const findSaveReportsByMonths = async ({ userId, months }) => {
    return prisma.saveReport.findMany({
        where: {
            user_id: BigInt(userId),
            month: { in: months },
        },
        select: {
            month: true,
            saved_amount: true,
            total_count: true,
        },
    });
};