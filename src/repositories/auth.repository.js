import prisma from '../database/prisma.js';

const upsertKakaoUser = async ({
  kakaoId,
  nickname,
  email,
}) => {
  return prisma.user.upsert({
    where: { kakao_id: kakaoId },
    update: {
      nickname,
      email,
      last_login_at: new Date(),
    },
    create: {
      kakao_id: kakaoId,
      nickname,
      email,
      social_type: 'KAKAO',
      phone_number: '',
      refresh_token: '',
    },
  });
};

const updateRefreshToken = async (userId, refreshToken) => {
  return prisma.user.update({
    where: { user_id: BigInt(userId) },
    data: { refresh_token: refreshToken },
  });
};

const findUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { user_id: BigInt(userId) },
  });
};

const deleteUserById = async (userId) => {
  return prisma.user.delete({
    where: { user_id: BigInt(userId) },
  });
};

export default {
  upsertKakaoUser,
  updateRefreshToken,
  findUserById,
  deleteUserById,
};