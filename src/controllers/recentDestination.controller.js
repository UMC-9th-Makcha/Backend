// src/controllers/recentDestination.controller.js
import { CustomSuccess } from "../response/customSuccess.js";
import { CustomError } from "../response/customError.js";
import { getRecentDestinations } from "../services/recentDestination.service.js";

export const getRecentDestinationsHandler = async(req, res, next) => {
    try {
        // 유저 확인
        const userId = req.userId;
        if (!userId) {
            throw new CustomError(
                "UNAUTHORIZED",
                "Unauthorized",
                401
            );
        }

        const userIdBigint = BigInt(userId);

        // limit 확인
        const limitRaw = req.query.limit;
        let limit = 10;
        if (limitRaw !== undefined) {
            const n  = Number(limitRaw);

            if (!Number.isInteger(n) || n <= 0) {
                throw new CustomError(
                    "INVALID_LIMIT",
                    "Invalid limit",
                    400
                )
            }

            limit = Math.min(n, 10);    // limit 최댓값 10
        }

        const items  = await getRecentDestinations(userIdBigint, limit);

        return res.status(200).json(
            new CustomSuccess(
                "RECENT_DESTINATION_FETCH_SUCCESS",
                200,
                "최근 목적지 조회 성공",
                { recentDestinations: items }
            )
        );
    } catch (err) {
        console.error(err);
        throw new CustomError(
            "COM-500-001",
            "Internal Server Error",
            500
        )
    }
};