// src/dtos/myPlace.dto.js
import { CustomError } from "../response/customError.js";

const isNumber = (v) => typeof v === "number" && Number.isFinite(v);

// create
export const toCreateMyPlaceDto = (req) => {
    // 입력값
     const {
        place_type,
        provider_place_id = null,
        place_address,
        place_detail_address = null,
        latitude,
        longitude,
    } = req.body ?? {};

    // 유효성 검증
    // provider_place_id: 선택, 있으면 길이만 체크
    if (
        provider_place_id !== null &&
        (typeof provider_place_id !== "string" || provider_place_id.length > 50)
    ) {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid provider_place_id",
            req.originalUrl,
            {
                field: "provider_place_id",
                maxLength: 50,
            }
        );
    }

    // place_type: 자주가는장소 CRUD면 PLACE만 받는 걸로 강제
    if (place_type !== "PLACE") {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid place_type",
            req.originalUrl,
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
            req.originalUrl,
            {
                field: "place_address",
            }
        );
    }

    if (place_address.length > 200) {
        throw new CustomError(
            "PLACE-400-001",
            "Invalid place_address",
            req.originalUrl,
            {
                field: "place_address",
                maxLength: 200,
            }
        );
    }

    // place_detail_address: 선택, 있으면 길이만 체크
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
        provider_place_id,
        place_address: place_address.trim(),
        place_detail_address: place_detail_address === "" ? null : place_detail_address,
        latitude,
        longitude,
    };
};

// update(PATCH)
export const toUpdateMyPlaceDto = (req) => {
    const {
        place_type, // 들어오면 에러
        provider_place_id,
        place_address,
        place_detail_address,
        latitude,
        longitude,
    } = req.body ?? {};

    // place_type: PLACE 고정, 업데이트 불가능
    if (place_type !== undefined) {
        throw new CustomError(
            "PLACE-400-001",
            "place_type cannot be updated",
            req.originalUrl,
            {
                field: "place_type"
            }
        );
    }

    const dto = {};

    // provider_place_id: 선택, 있으면 길이만 체크
    if (provider_place_id !== undefined) {
        if (
            provider_place_id !== null &&
            (typeof provider_place_id !== "string" || provider_place_id.length > 50)
        ) {
            throw new CustomError(
                "PLACE-400-001",
                "Invalid provider_place_id",
                req.originalUrl,
                {
                    field: "provider_place_id",
                    maxLength: 50
                }
            );
        }
        dto.provider_place_id = provider_place_id; // null이면 null로 업데이트됨
    }

    // place_address: type(string), 길이 검사
    if (place_address !== undefined) {
        if (
            typeof place_address !== "string" ||
            place_address.trim().length === 0 ||
            place_address.length > 200
        ) {
            throw new CustomError(
                "PLACE-400-001",
                "Invalid place_address",
                req.originalUrl,
                {
                    field: "place_address",
                    maxLength: 200
                }
            );
        }
        dto.place_address = place_address.trim();
    }

    // place_detail_address: 선택, 있으면 길이만 체크
    if (place_detail_address !== undefined) {
        if (
            place_detail_address !== null &&
            (typeof place_detail_address !== "string" ||
            place_detail_address.length > 200)
        ) {
            throw new CustomError(
                "PLACE-400-001",
                "Invalid place_detail_address",
                req.originalUrl,
                {
                    field: "place_detail_address",
                    maxLength: 200
                }
            );
        }
        dto.place_detail_address =
            place_detail_address === "" ? null : place_detail_address;
    }

    // latitude: 위도 범위 검사
    if (latitude !== undefined) {
        if (!isNumber(latitude) || latitude < -90 || latitude > 90) {
            throw new CustomError(
                "PLACE-400-001",
                "Invalid latitude",
                req.originalUrl,
                {
                    field: "latitude",
                    range: "[-90, 90]"
                }
            );
        }
        dto.latitude = latitude;
    }

    // longitude: 경도 범위 검사
    if (longitude !== undefined) {
        if (!isNumber(longitude) || longitude < -180 || longitude > 180) {
            throw new CustomError(
                "PLACE-400-001",
                "Invalid longitude",
                req.originalUrl,
                {
                    field: "longitude",
                    range: "[-180, 180]"
                }
            );
        }
        dto.longitude = longitude;
    }

    // 아무것도 안 보낸 경우
    if (Object.keys(dto).length === 0) {
        throw new CustomError(
            "PLACE-400-002",
            "No fields to update",
            req.originalUrl
        );
    }

    return dto;
};