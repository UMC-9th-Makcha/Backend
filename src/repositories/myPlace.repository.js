// src/repositories/myPlace.repository.js

import { prisma } from '../config/prisma.js';

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