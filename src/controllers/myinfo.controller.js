// src/controllers/myinfo.js

import { CustomError } from "../response/customError.js";
import { CustomSuccess } from "../response/customSuccess.js";
import { getMyInfo, updateMyPhone } from "../services/myinfo.service.js"

// 내 정보 조회(GET /me)
export const getMyInfoHandler = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // 서비스 호출
        const userInfo = await getMyInfo(userId);

        // 응답
        return res.status(200).json(
            new CustomSuccess(
                "MYINFO-200-001",
                200,
                "내 정보 조회 성공",
                userInfo
            )
        )
    } catch (err) {
        return next(err);
    }
}

// 전화번호 수정(PATCH /me/phone)
export const updateMyPhoneHandler = async(req, res, next) => {
    try {
        const userId = req.user.userId;
        const { phone } = req.body;

        if (typeof(phone) !== "string" || phone.trim().length === 0) {
                const e = new CustomError(
                "USER-400-001",
                "Invalid phone number",
                req.originalUrl,
                { phone }
            );
            e.statusCode = 400;
            return next(e);
        }

        // 서비스 호출
        const updated = await updateMyPhone(userId, phone.trim());

        // 응답
        return res.status(200).json(
            new CustomSuccess(
                "MYINFO-200-002",
                200,
                "전화번호 수정 성공",
                updated
            )
        )
    } catch (err) {
        return next(err);
    }
}