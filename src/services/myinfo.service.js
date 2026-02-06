// src/services/myinfo.service.js

import { CustomError } from "../response/customError.js";
import { findUserById, updateUserPhone } from "../repositories/myinfo.repository.js"
import { toMyInfoDto } from "../dtos/myinfo.dto.js";

export const getMyInfo = async (userId) => {
    const user = await findUserById(userId);

    if (!user) {
        const e = new CustomError(
            "USER-404-001",
            "User not found",
            null,
            {}
        );
        e.statusCode = 404;
        throw e;
    }

    return toMyInfoDto(user);
}

export const updateMyPhone = async (userId, phone) => {
    // 숫자만 남김
    const normalizedPhone = phone.replace(/[^0-9]/g, "");

    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
        const e = new CustomError(
            "USER-400-001",
            "Invalid phone number",
            null,
            { phone }
        );
        e.statusCode = 400;
        throw e;
    }

    const updatedUser = await updateUserPhone(
        userId,
        normalizedPhone
    );

    return toMyInfoDto(updatedUser);
};