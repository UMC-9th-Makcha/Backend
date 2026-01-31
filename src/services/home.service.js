// src/services/home.service.js

import { Prisma } from "@prisma/client";
import { CustomError } from "../response/customError.js";
import {
  insertPlace,
  patchPlace,
  findHomeByUserId,
  deleteHomeByUserId,
} from "../repositories/place.repository.js";

// HOME upsert (홈 설정/변경)
export const upsertHomeMyPlace = async (user_id, data) => {
    if (!user_id) {
        const e = new CustomError("AUTH-401-000", "Unauthorized", "/myplaces/home", {});
        e.statusCode = 401;
        throw e;
    }

    // 최소 필수값 검증
    const required = ["provider_place_id", "place_address", "latitude", "longitude"];
    for (const key of required) {
        if (data?.[key] === undefined || data?.[key] === null || data?.[key] === "") {
            const e = new CustomError(
                "HOME-400-001",
                "Invalid request body",
                "/myplaces/home",
                { field: key }
            );
            e.statusCode = 400;
            throw e;
        }
    }

    // 기존 HOME(최신 1개) 조회
    const existing = await findHomeByUserId({ user_id });
    
    // 기존 HOME 있으면 update
    if (existing?.myplace_id) {
        const result  = await patchPlace({
            myplace_id: existing.myplace_id,
            user_id,
            data: {
                place_type: "HOME", // 서버에서 고정
                provider_place_id: data.provider_place_id,
                place_address: data.place_address,
                place_detail_address: data.place_detail_address ?? null,
                latitude: data.latitude,
                longitude: data.longitude,
            },
        });

        if (!result || result.count === 0) {
            const e = new CustomError("HOME-404-001", "Home not found", "/myplaces/home", {});
            e.statusCode = 404;
            throw e;
        }

        // 업데이트된 row 반환
        return {
            myplace_id: String(existing.myplace_id),
            user_id: String(user_id),
            place_type: "HOME",
            provider_place_id: data.provider_place_id,
            place_address: data.place_address,
            place_detail_address: data.place_detail_address ?? null,
            latitude: data.latitude,
            longitude: data.longitude,
        };
    }

    // 기존 HOME 없으면 create
    try {
        const created = await insertPlace({
            user_id,
            place_type: "HOME",
            provider_place_id: data.provider_place_id,
            place_address: data.place_address,
            place_detail_address: data.place_detail_address ?? null,
            latitude: data.latitude,
            longitude: data.longitude,
        });

        return {
            ...created,
            myplace_id: String(created.myplace_id),
            user_id: String(created.user_id),
        };
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const e = new CustomError(
                "HOME-409-001",
                "Home place already exists",
                "/myplaces/home",
                { fields: ["user_id", "place_type", "provider_place_id"] }
            );
            e.statusCode = 409;
            throw e;
        }
        throw err;
    }
}

// HOME delete (홈 삭제)
export const deleteHomeMyPlace = async (user_id) => {
    if (!user_id) {
        const e = new CustomError("AUTH-401-000", "Unauthorized", "/myplaces/home", {});
        e.statusCode = 401;
        throw e;
    }

    // user_id 기준으로 삭제(멱등)
    await deleteHomeByUserId({ user_id });

    return {};
};