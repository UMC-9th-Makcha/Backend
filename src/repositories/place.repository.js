// src/repositories/place.repository.js

import { prisma } from '../config/prisma.js';

// create
export const insertPlace = async (data) => {
  return prisma.myPlace.create({
    data: {
      user: { connect: { user_id: BigInt(data.user_id) } },
      place_type: data.place_type,
      provider_place_id: data.provider_place_id ?? null,
      place_address: data.place_address,
      place_detail_address: data.place_detail_address,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    select: {
      myplace_id: true,
      user_id: true,
      place_type: true,
      provider_place_id: true,
      place_address: true,
      place_detail_address: true,
      latitude: true,
      longitude: true,
      created_at: true,
    },
  });
};

// update(PATCH)
export const patchPlace = async ({ myplace_id, user_id, data }) => {
  // - user_id 필수
  // - 단건 PATCH
  // - 존재하지 않거나 권한 없으면 count = 0
  return prisma.myPlace.updateMany({
    where: {
      myplace_id: BigInt(myplace_id),
      user_id: BigInt(user_id),
    },
    data,
  });
};

// update 성공 후 최신 row 반환용
export const findPlace = async ({ myplace_id, user_id }) => {
  return prisma.myPlace.findFirst({
    where: {
      myplace_id: BigInt(myplace_id),
      user_id: BigInt(user_id),
    },
    select: {
      myplace_id: true,
      user_id: true,
      place_type: true,
      provider_place_id: true,
      place_address: true,
      place_detail_address: true,
      latitude: true,
      longitude: true,
      created_at: true,
      updated_at: true,
    },
  });
};

// delete
export const deletePlace = async ({ myplace_id, user_id }) => {
  return prisma.myPlace.deleteMany({
    where: {
      myplace_id: BigInt(myplace_id),
      user_id: BigInt(user_id),
    },
  });
};

// HOME: 기존 홈 1개 조회(업서트)
export const findHomeByUserId = async ({ user_id }) => {
  return prisma.myPlace.findFirst({
    where: {
      user_id: BigInt(user_id),
      place_type: "HOME",
    },
    orderBy: { updated_at: "desc" }, // 최신 1개
    select: {
      myplace_id: true,
      user_id: true,
      place_type: true,
      provider_place_id: true,
      place_address: true,
      place_detail_address: true,
      latitude: true,
      longitude: true,
      created_at: true,
      updated_at: true,
    },
  });
};

// HOME: 홈 삭제(유저 기준 전부 삭제)
export const deleteHomeByUserId = async ({ user_id }) => {
  return prisma.myPlace.deleteMany({
    where: {
      user_id: BigInt(user_id),
      place_type: "HOME",
    },
  });
};

// GET /api/myplaces 용: user_id 기준 전체 조회(HOME + PLACE)
export const findMyPlacesByUserId = async ({ user_id }) => {
  return prisma.myPlace.findMany({
    where: {
      user_id: BigInt(user_id),
    },
    select: {
      myplace_id: true,
      user_id: true,
      place_type: true,
      provider_place_id: true,
      place_address: true,
      place_detail_address: true,
      latitude: true,
      longitude: true,
      created_at: true,
      updated_at: true,
    },
  });
};