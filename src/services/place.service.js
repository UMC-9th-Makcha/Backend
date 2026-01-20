// src/services/place.service.js

import { Prisma } from "@prisma/client";
import { CustomError } from "../response/customError.js";
import { insertPlace,
    patchPlace,
    findPlace,
    deletePlace
 } from "../repositories/place.repository.js";

// create
export const createPlace = async (payload) => {
    try {
        return await insertPlace(payload);
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const e = new CustomError(
                "PLACE-409-001",
                "Place already exists",
                "/api/myplaces",
                {
                    fields: ["user_id", "place_type", "provider_place_id"],
                }
            );
            e.statusCode = 409;
            throw e;
        }
    throw err;
    }
};

// update(PATCH)
export const updatePlace = async ({user_id, myplace_id, data}) => {
    if (!user_id) {
        const e = new CustomError("AUTH-401-000", "Unauthorized", "/places");
        e.statusCode = 401;
        throw e;
    }
    if (!myplace_id) {
        const e = new CustomError("PLACE-400-003", "Invalid myplace_id", "/places/:myplaceId", {
            field: "myplace_id",
        });
        e.statusCode = 400;
        throw e;
    }

    const result = await patchPlace({
        myplace_id,
        user_id,
        data,
    });
    
    if ( !result || result.count === 0) {
        // 없음  or 접근 권한 없음 -> 404
        const e = new CustomError(
            "PLACE-404-001",
            "Place not found",
            "/places/:myplaceId",
            { myplace_id: String(myplace_id) }
        )
        e.statusCode = 404;
        throw e;
    }

    // 업데이트된 값 반환
    const updated = await findPlace({ myplace_id, user_id });

    if (!updated) {
        const e = new CustomError(
            "PLACE-404-001",
            "Place not found",
            "/myplaces/:myplaceId",
            { myplace_id: String(myplace_id) }
        )
        e.statusCode = 404;
        throw e;
    }

    return updated;
};

// delete
export const removePlace = async ({ user_id, myplace_id }) => {
    if (!user_id) {
        const e = new CustomError("AUTH-401-000", "Unauthorized", "/places");
        e.statusCode = 401;
        throw e;
    }
    if (!myplace_id) {
        const e = new CustomError("PLACE-400-003", "Invalid myplace_id", "/places/:myplaceId", {
            field: "myplace_id",
        });
        e.statusCode = 400;
        throw e;
    }

    const result = await deletePlace({ myplace_id, user_id });

    if ( !result || result.count === 0) {
    // 없음  or 접근 권한 없음 -> 404
    const e = new CustomError(
        "PLACE-404-001",
        "Place not found",
        "/places/:myplaceId",
        { myplace_id: String(myplace_id) }
    )
    e.statusCode = 404;
    throw e;
    }

    return { myplace_id: String(myplace_id) };
}