// src/services/place.service.js

import { Prisma } from "@prisma/client";
import { CustomError } from "../response/customError.js";
import { insertPlace,
    patchPlace,
    findPlace,
    deletePlace,
    findMyPlacesByUserId
 } from "../repositories/place.repository.js";

// create
export const createPlace = async (payload) => {
    try {
        const created = await insertPlace(payload);
        return { ...created, myplace_id: String(created.myplace_id), user_id: String(created.user_id) };

    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const e = new CustomError(
                "PLACE-409-001",
                "Place already exists",
                null,
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
        const e = new CustomError("AUTH-401-000", "Unauthorized", null);
        e.statusCode = 401;
        throw e;
    }
    if (!myplace_id) {
        const e = new CustomError("PLACE-400-003", "Invalid myplace_id", null, {
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
            null,
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
            null,
            { myplace_id: String(myplace_id) }
        )
        e.statusCode = 404;
        throw e;
    }

    return { ...updated, myplace_id: String(updated.myplace_id), user_id: String(updated.user_id) };
};

// delete
export const removePlace = async ({ user_id, myplace_id }) => {
    if (!user_id) {
        const e = new CustomError("AUTH-401-000", "Unauthorized", null);
        e.statusCode = 401;
        throw e;
    }
    if (!myplace_id) {
        const e = new CustomError("PLACE-400-003", "Invalid myplace_id", null, {
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
        null,
        { myplace_id: String(myplace_id) }
    )
    e.statusCode = 404;
    throw e;
    }

    return { myplace_id: String(myplace_id) };
}

// GET /api/myplaces - HOME + PLACE 통합 조회
export const getMyPlaces = async (user_id) => {
    if (!user_id) {
        const e = new CustomError("AUTH-401-000", "Unauthorized", null);
        e.statusCode = 401;
        throw e;
    }

    const rows = await findMyPlacesByUserId({ user_id });

    const normalized = rows.map((r) => ({
    ...r,
    myplace_id: String(r.myplace_id),
    user_id: String(r.user_id),
    }));

    const homes = normalized.filter((r) => r.place_type === "HOME");
    const places = normalized.filter((r) => r.place_type === "PLACE");


    const home =
        homes.length === 0
        ? null
        : homes
            .slice()
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
    
    // PLACE 정렬(최신순)
    const sortedPlaces = places
        .slice()
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return {
        home,
        places: sortedPlaces,
    }
}