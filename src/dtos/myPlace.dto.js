// src/dtos/myPlace.dto.js
import { CustomError } from "../response/customError.js";

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

export const toCreateMyPlaceDto = (req) => {
    // 입력값
     const {
        place_type,
        place_address,
        place_detail_address = null,
        latitude,
        longitude,
    } = req.body ?? {};

    // 필수값 검증
    // place_type: 자주가는장소 CRUD면 PLACE만 받는 걸로 강제
    if (place_type !== "PLACE") {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid place_type",
            req.original,
            {
                field: "place_type",
                    allowed: ["PLACE"],
            }
        );
    }

    // place_address: type(string), 길이 검사
    if (typeof place_address !== "string" || place_address.trim().length === 0) {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid place_address",
            req.original,
            {
                field: "place_address",
            }
        );
    }

    if (place_address.length > 200) {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid place_address",
            req.original,
            {
                field: "place_address",
                maxLength: 200,
            }
        );
    }

    // detail address: 선택, 있으면 길이만 체크
    if (
        place_detail_address !== null &&
        place_detail_address !== undefined &&
        (typeof place_detail_address !== "string" || place_detail_address.length > 200)
    ) {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid place_detail_address",
            req.originalUrl,
            {
                 field: "place_detail_address",
                maxLength: 200,
            }
        );
    }

    // latitude: 위도 범위 검사
    if (!isNumber(latitude) || latitude < -90 || latitude > 90) {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid latitude",
            req.originalUrl,
            {
                field: "latitude",
                range: "[-90, 90]",
            }
        );
    }

    // longitude: 경도 범위 검사
    if (!isNumber(longitude) || longitude < -180 || longitude > 180) {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid latitude",
            req.originalUrl,
            {
                field: "longitude",
                range: "[-180, 180]",
            }
        );
    }

    return {
        place_type,
        place_address: place_address.trim(),
        place_detail_address: place_detail_address === "" ? null : place_detail_address,
        latitude,
        longitude,
    };
};