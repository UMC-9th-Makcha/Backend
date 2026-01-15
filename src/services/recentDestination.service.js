// src/services/recentDestination.service.js

import {
    findRecentDestinations,
    upsertRecentDestination
} from "../repositories/recentDestination.repository.js";
import { toRecentDestinationDto } from "../dtos/recentDestination.dto.js";
import { CustomError } from "../response/customError.js";

export const getRecentDestinations = async (userId, limit) => {
    const userIdBigint = typeof userId === "bigint" ? userId : BigInt(userId);
    const rows = await findRecentDestinations(userIdBigint, limit);
    return rows.map(toRecentDestinationDto);
}

export const recordRecentDestination = async({
    userId,
    placeId,
    title,
    roadAddress,
    detailAddress = null,
    latitude,
    longitude,    
}) => {
    if (!userId) {
        const e = new CustomError("UNAUTHORIZED", "Unauthorized", "recordRecentDestination", {});
        e.statusCode = 401;
        throw e;
    }
    if (!placeId) {
        const e = new CustomError("INVALID_PLACE_ID", "place_id 필요", "recordRecentDestination", {});
        e.statusCode = 400;
        throw e;
    }

    const userIdBigint = typeof userId === "bigint" ? userId : BigInt(userId);
    const usedAt = new Date();

    return await upsertRecentDestination({
        userId: userIdBigint,
        placeId,
        title,
        roadAddress,
        detailAddress,
        latitude,
        longitude,
        usedAt,
    });
};