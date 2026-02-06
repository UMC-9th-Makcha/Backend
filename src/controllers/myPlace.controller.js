// src/controllers/myPlace.controller.js

import { toCreatePlaceDto, toUpdatePlaceDto } from '../dtos/place.dto.js';
import { CustomSuccess } from '../response/customSuccess.js';
import { CustomError } from '../response/customError.js';
import { createPlace, updatePlace, removePlace } from '../services/place.service.js';

// 파일 스코프 유틸
const bigintToString = (v) => (typeof v === "bigint" ? v.toString() : v);
const normalize = (obj) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, bigintToString(v)]));

// 장소 생성
export const createMyPlaceHandler = async(req, res, next) => {
    try {
        const dto = toCreatePlaceDto(req);

        // 서비스 호출
        const created = await createPlace({
            user_id: req.user.userId,
            place_type: "PLACE",
            ...dto,
        });

        // 응답
        return res.status(201).json(
            new CustomSuccess(
                "PLACE_CREATE_SUCCESS",
                201,
                "자주 가는 장소 생성 성공",
                normalize(created)
            )
        );
    } catch (err) {
        if (!err.path) {
            err.path = req.originalUrl;
        }
        return next(err);
    }
};

// 장소 수정(PATCH)
export const updateMyPlaceHandler = async(req, res, next) => {
    try {
        const { myPlaceId } = req.params ?? {};

        // myPlaceId 유효성
        if (!myPlaceId || !/^\d+$/.test(String(myPlaceId))){
            const e = new CustomError(
                "PLACE-400-003",
                "Invalid myPlaceId",
                req.originalUrl,
                { field: "myPlaceId" }
            );
            e.statusCode = 400;
            return next(e);
        }

        // body 유효성/부분 업데이트 DTO
        const data = toUpdatePlaceDto(req);

        // 서비스 호출
        const updated = await updatePlace({
            user_id: req.user.userId,
            myplace_id: req.params.myPlaceId,
            data,
        });

        // 응답
        return res.status(200).json(
            new CustomSuccess(
                "PLACE_UPDATE_SUCCESS",
                200,
                "자주 가는 장소 수정 성공",
                normalize(updated)
            )
        );
    } catch (err) {
        if (!err.path) {
            err.path = req.originalUrl;
        }
        return next(err);
    }
};

// 장소 삭제
export const deleteMyPlaceHandler = async (req, res, next) => {
    try {
        const { myPlaceId } = req.params ?? {};

        // myPlaceId 유효성
        if (!myPlaceId || !/^\d+$/.test(String(myPlaceId))){
            const e = new CustomError(
                "PLACE-400-003",
                "Invalid myPlaceId",
                req.originalUrl,
                { field: "myPlaceId" }
            );
            e.statusCode = 400;
            return next(e);
        }

        await removePlace({
            user_id: req.user.userId,
            myplace_id: myPlaceId,
        });

        // 응답
        return res.status(200).json(
            new CustomSuccess(
                "PLACE_DELETE_SUCCESS",
                200,
                "자주 가는 장소 삭제 성공",
                { myplace_id: String(myPlaceId) }
            )
        );

    } catch (err) {
        if (!err.path) {
            err.path = req.originalUrl;
        }
        return next(err);
    }
}