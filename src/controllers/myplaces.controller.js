// src/controllers/myplaces.controller.js

import { CustomSuccess } from '../response/customSuccess.js';
import { CustomError } from '../response/customError.js';
import { getMyPlaces } from "../services/place.service.js";

// GET /api/myplaces - HOME + PLACE 통합 조회
export const getMyPlacesHandler = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            const e = new CustomError("UNAUTHORIZED", "Unauthorized", req.originalUrl, {});
            e.statusCode = 401;
            throw e;
        }
        //const userIdBigint = BigInt(userId);
        
        // 서비스 호출
        const result = await getMyPlaces(userId);

        // 응답
        return res.status(200).json(
            new CustomSuccess(
                "MYPLACE-200-001",
                200,
                "내 장소 조회 성공",
                result
            )
        );
    } catch (err) {
        return next(err);
    }
}