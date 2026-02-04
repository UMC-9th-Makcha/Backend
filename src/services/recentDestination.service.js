// src/services/recentDestination.service.js

import {
    findRecentDestinations,
    upsertRecentDestination,
    findRecentDestinationByIdAndUser,
    deleteRecentDestinationByIdAndUser,
} from "../repositories/recentDestination.repository.js";
import { toRecentDestinationDto } from "../dtos/recentDestination.dto.js";
import { CustomError } from "../response/customError.js";

export const getRecentDestinations = async (userId, limit) => {
    const rows = await findRecentDestinations(userId, limit);
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
    
    const usedAt = new Date();

    return await upsertRecentDestination({
        userId,
        placeId,
        title,
        roadAddress,
        detailAddress,
        latitude,
        longitude,
        usedAt,
    });
};

export const deleteRecentDestination = async ({ userId, recentId }) => {
    // 삭제 대상 조회
    // user의 목적지가 아닌 경우 포함
    const row = await findRecentDestinationByIdAndUser(
        userId,
        recentId
    );

    if (!row) {
        const e = new CustomError(
        "RECENT-404-001",
        "recent destinations not found",
        "/api/recent-destinations"
        );
        e.statusCode = 404;
        throw e;
    }

    // hard delete
    await deleteRecentDestinationByIdAndUser(userId, recentId);

    // 삭제된 row DTO 변환 후 return
    return toRecentDestinationDto(row);
};