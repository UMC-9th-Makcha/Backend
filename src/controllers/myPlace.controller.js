// src/controllers/myPlace.controller.js

import { toCreateMyPlaceDto } from '../dtos/myPlace.dto.js';
import { CustomSuccess } from '../response/customSuccess.js';
import { CustomError } from '../response/customError.js';
import { createMyplace } from '../services/myPlace.service.js';

// 장소 생성
export const createMyPlaceHandler = async(req, res, next) => {
    try {
        const dto = toCreateMyPlaceDto(req);

        // 서비스 호출
        const created = await createMyplace({
            user_id: req.user.user_id,
            ...dto,
        });

        // 응답
        return res.status(201).json(
            new CustomSuccess(
                "PLACE_CREATE_SUCCESS",
                201,
                "자주 가는 장소 생성 성공",
                created
            )
        );
    } catch (err) {
        // DTO / Service에서 던진 CustomError
        if (err instanceof CustomError) {
        return res.status(400).json(err);
        }

        console.error(err);
        return res.status(500).json(
            new CustomError(
                "COM-500-001",
                "Internal Server Error",
                req.originalUrl
            )
        );
    }
};