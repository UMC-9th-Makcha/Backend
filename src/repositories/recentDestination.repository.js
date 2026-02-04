// src/repositories/recentDestination.repository.js
import { prisma } from "../config/prisma.js";

export const findRecentDestinations = async (userId, limit) => {
    return prisma.recentDestination.findMany({
        where: { user_id: BigInt(userId) },
        orderBy: { used_at: "desc" },
        take: Number(limit) || 10,
    });
};

export const upsertRecentDestination = async ({
    userId,
    title,
    roadAddress,
    detailAddress,
    placeId,
    latitude,
    longitude,
    usedAt,
}) => {
    return prisma.recentDestination.upsert({
        where: {
            user_place_unique: {
                user_id: BigInt(userId),
                place_id: placeId,
            },
        },
        create: {
            user_id: BigInt(userId),
            title,
            road_address: roadAddress,
            detail_address: detailAddress ?? null,
            place_id: placeId,
            latitude,
            longitude,
            used_at: usedAt,
        },
        update: {
            title,
            road_address: roadAddress,
            detail_address: detailAddress ?? null,
            latitude,
            longitude,
            used_at: usedAt,
        },
    });
};


export const findRecentDestinationByIdAndUser = async (
    userId,
    recentId
) => {
    return prisma.recentDestination.findFirst({
        where: {
            recent_id: BigInt(recentId),
            user_id: BigInt(userId),
        },
    });
};

export const deleteRecentDestinationByIdAndUser = async (
    userId,
    recentId
) => {
    return prisma.recentDestination.deleteMany({
        where: {
            recent_id: BigInt(recentId),
            user_id: BigInt(userId),
        },
    });
};