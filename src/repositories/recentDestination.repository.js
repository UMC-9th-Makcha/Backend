// src/repositories/recentDestination.repository.js

import { prisma } from '../config/prisma.js';

export const findRecentDestinations = async (userId, limit) => {
    return prisma.recentDestination.findMany({
        where: { user_id: userId },
        orderBy: { used_at: "desc" },
        take: limit,
    });
};