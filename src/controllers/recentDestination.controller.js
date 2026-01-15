// src/controllers/recentDestination.controller.js
import { CustomSuccess } from "../response/customSuccess.js";
import { CustomError } from "../response/customError.js";
import {
    recordRecentDestination,
    getRecentDestinations
} from "../services/recentDestination.service.js";
import { toRecentDestinationDto } from "../dtos/recentDestination.dto.js";

export const createRecentDestinationHandler = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
        const e = new CustomError("UNAUTHORIZED", "Unauthorized", req.originalUrl, {});
        e.statusCode = 401;
        throw e;
    }

    const {
      placeId,
      title,
      roadAddress,
      detailAddress = null,
      latitude,
      longitude,
    } = req.body;

    const result = await recordRecentDestination({
      userId,
      placeId,
      title,
      roadAddress,
      detailAddress,
      latitude,
      longitude,
    });

    return res.status(200).json(
        new CustomSuccess(
            "RECENT_DESTINATION_UPSERT_OK",
            200,
            "최근 목적지 저장 성공",
            toRecentDestinationDto(result)));
  } catch (err) {
    next(err);
  }
};

export const getRecentDestinationsHandler = async(req, res, next) => {
    try {
        // 유저 확인
        const userId = req.user.userId;
        if (!userId) {
            const e = new CustomError("UNAUTHORIZED", "Unauthorized", req.originalUrl, {});
            e.statusCode = 401;
            throw e;
        }

        const userIdBigint = BigInt(userId);

        // limit 확인
        const limitRaw = req.query.limit;
        let limit = 10;
        if (limitRaw !== undefined) {
            const n  = Number(limitRaw);

            if (!Number.isInteger(n) || n <= 0) {
                const e = new CustomError("INVALID_LIMIT", "Invalid limit", req.originalUrl, {});
                e.statusCode = 400;
                throw e;
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
        return next(err);
    }
};