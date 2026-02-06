// src/repositories/myinfo.repository.js

import { prisma } from '../config/prisma.js';

export const findUserById = async (userId) => {
    return prisma.user.findUnique({
        where: {
            user_id: BigInt(userId),
        },
    });
};

export const updateUserPhone = async (userId, phoneNumber) => {
    return prisma.user.update({
        where: {
            user_id: BigInt(userId),
        },
        data: {
            phone_number: phoneNumber,
        },
    });
};