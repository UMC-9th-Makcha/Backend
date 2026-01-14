// src/repositories/myPlace.repository.js

import { prisma } from '../config/prisma.js';

// create
export const insertMyPlace = async (data) => {
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
export const patchMyPlace = async ({ myplace_id, user_id, data }) => {
  return prisma.myPlace.updateMany({
    where: {
      myplace_id: BigInt(myplace_id),
      user_id: BigInt(user_id),
      deleted_at: null,
    },
    data,
  });
};

export const findMyPlace = async ({ myplace_id, user_id }) => {
  return prisma.myPlace.findFirst({
    where: {
      myplace_id: BigInt(myplace_id),
      user_id: BigInt(user_id),
      deleted_at: null,
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