// src/controllers/home.controller.js

import { CustomSuccess } from '../response/customSuccess.js';
import { upsertHomeMyPlace, deleteHomeMyPlace } from '../services/home.service.js';

// 홈 추가/수정(upsert)
export const upsertHomeHandler = async(req, res, next) => {
    try {
        const userId = req.user.userId;

        // 서비스 호출
        const home = await upsertHomeMyPlace(userId, req.body);

        // 응답
        return res.status(200).json(
            new CustomSuccess(
                "HOME-200-001",
                200,
                "홈 설정 성공",
                home
            )
        );
    } catch (err) {
        if (!err.path) {
            err.path = req.originalUrl;
        }
        return next(err);
    }
};

// 홈 삭제
export const removeHomeHandler = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // 서비스 호출
        await deleteHomeMyPlace(userId);

        // 응답
        return res.status(200).json(
            new CustomSuccess(
                "HOME-200-002",
                200,
                "홈 삭제 성공",
                {}
            )
        );

    } catch (err) {
        if (!err.path) {
            err.path = req.originalUrl;
        }
        return next(err);
    }
}