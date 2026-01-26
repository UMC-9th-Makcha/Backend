// src/dtos/myinfo.dto.js

export const toMyInfoDto = (user) => ({
    userId: user.user_id?.toString(),
    name: user.nickname,              // 이름
    email: user.email,                // 이메일
    phone: user.phone_number ?? null, // 연락처
})