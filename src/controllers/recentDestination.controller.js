// src/controllers/recentDestination.controller.js
import { CustomSuccess } from "../response/customSuccess.js";
import { CustomError } from "../response/customError.js";
import {
    recordRecentDestination,
    getRecentDestinations,
    deleteRecentDestination
} from "../services/recentDestination.service.js";
import { toRecentDestinationDto } from "../dtos/recentDestination.dto.js";

export const createRecentDestinationHandler = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const {
        placeId,
        title,
        roadAddress,
        detailAddress = null,
        latitude,
        longitude,
    } = req.body;

    // 필수값 검증
    if (!placeId) {
        const e = new CustomError(
            "RECENT-400-001",
            "place_id 필요",
            req.originalUrl,
            {}
        );
        e.statusCode = 400;
        return next(e);
    }

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
    return next(err);
  }
};

export const getRecentDestinationsHandler = async(req, res, next) => {
    try {
        // 유저 확인
        const userId = req.user.userId;

        // limit 확인
        const limitRaw = req.query.limit;
        let limit = 10;
        if (limitRaw !== undefined) {
            const n  = Number(limitRaw);

            if (!Number.isInteger(n) || n <= 0) {
                const e = new CustomError("RECENT-400-001", "Invalid limit", req.originalUrl, {});
                e.statusCode = 400;
                return next(e);
            }

            limit = Math.min(n, 10);    // limit 최댓값 10
        }

        const items  = await getRecentDestinations(userId, limit);

        return res.status(200).json(
            new CustomSuccess(
                "RECENT_DESTINATION_FETCH_SUCCESS",
                200,
                "최근 목적지 조회 성공",
                { recentDestinations: items }
            )
        );
    } catch (err) {
        return next(err);
    }
};

export const deleteRecentDestinationHandler = async (req, res, next) => {
    try {
        // 유저 확인
        const userId = req.user.userId;

        // path param - recentId(bigint) JSON/HTTP 경계에서는 string으로 고정
        const { recentId } = req.params;

        // recentId 검증 - 문자열 존재 여부 확인
        if (typeof recentId !== "string" || recentId.trim().length === 0) {
            const e = new CustomError(
                "RECENT-400-001",
                "Invalid recentId",
                req.originalUrl,
                { recentId }
            );
            e.statusCode = 400;
            return next(e);
        }

        // 서비스 호출
        await deleteRecentDestination({
            userId,
            recentId: recentId.trim(), // string 유지
        });

        return res.status(200).json(
            new CustomSuccess(
                "RECENT_DESTINATION_DELETE_SUCCESS",
                200,
                "최근 목적지 삭제 성공",
                { recentId: recentId.trim() }
            )
        );
    } catch (err) {
        if (!err.path) {
            err.path = req.originalUrl;
        }
        return next(err);
    }
}
