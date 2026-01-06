// src/repositories/recentDestination.repository.js

//import { pisma } from './database/prisma.js'; // 경로 수정 필요

export const findRecentDestinations = async (userId, limit) => {
    return prisma.recentDestination.findMany({
        where: { userId },
        orderBy: { usedAt: "desc" },
        take: limit,
    });
};