// src/repositories/recentDestination.repository.js

import { prisma } from '../config/prisma.js';

export const findRecentDestinations = async (userId, limit) => {
    return prisma.recentDestination.findMany({
        where: { user_id: userId },
        orderBy: { used_at: "desc" },
        take: Number(limit) || 10,
    });
};

export const upsertRecentDestination = async({
    user_id,
    title,
    road_address,
    detail_address,
    place_id,
    latitude,
    longitude,
    used_at,
}) => {
    return await prisma.recentDestination.upsert({
        where: {
            user_place_unique: {
                user_id,
                place_id,
            },
        },
        create: {
            user_id,
            title,
            road_address,
            detail_address: detail_address ?? null,
            place_id,
            latitude,
            longitude,
            used_at,
        },
        update: {         
            title,
            road_address,
            detail_address: detail_address ?? null,
            latitude,
            longitude,
            used_at,
        },
    });
};