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

export const deleteRecentDestination = async ({ userId, recentId }) => {
    // userId bigint 변환
    const userIdBigint = typeof userId === "bigint" ? userId : BigInt(userId);

    // 서비스에서만 recentId bigint 변환
    let recentIdBigint;
    try {
        recentIdBigint = BigInt(recentId);
    } catch {
        const e = new CustomError(
        "RECENT-400-001",
        "Invalid recentId",
        "/api/recent-destinations"
        );
        e.statusCode = 400;
        throw e;
    }

    // 삭제 대상 조회
    // user의 목적지가 아닌 경우 포함
    const row = await findRecentDestinationByIdAndUser(
        userIdBigint,
        recentIdBigint
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
    await deleteRecentDestinationByIdAndUser(
        userIdBigint,
        recentIdBigint
    );

    // 삭제된 row DTO 변환 후 return
    return toRecentDestinationDto(row);
};