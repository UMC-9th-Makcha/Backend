// src/repositories/myinfo.repository.js

import { prisma } from '../config/prisma.js';

export const findUserById = async (userIdBigint) => {
    return prisma.user.findUnique({
        where: {
            user_id: userIdBigint,
        },
    });
};

export const updateUserPhone = async (userIdBigint, phoneNumber) => {
    return prisma.user.update({
        where: {
            user_id: userIdBigint,
        },
        data: {
            phone_number: phoneNumber,
        },
    });
};