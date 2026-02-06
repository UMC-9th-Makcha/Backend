import redis from "../config/redis.js";


// const store = new Map(); // token -> { value, expiresAt }

// cleanup
// const CLEANUP_INTERVAL_MS = 60 * 1000; // 1분
// const ENABLE_CLEANUP = process.env.ROUTE_TOKEN_CLEANUP !== "false";

export async function setRouteToken(token, value, ttlSec = 60 * 30) {
  const key = `route_token:${token}`;
  await redis.set(
    key,
    JSON.stringify(value),
    "EX",
    ttlSec
  );
}

// export function setRouteToken(token, value, ttlSec = 60 * 30) {
//   const expiresAt = Date.now() + ttlSec * 1000;
//   store.set(token, { value, expiresAt });
// }

// export function getRouteToken(token) {
//   const hit = store.get(token);
//   if (!hit) return null;

//   if (Date.now() > hit.expiresAt) {
//     store.delete(token);
//     return null;
//   }
//   return hit.value;
// }

export async function getRouteToken(token) {
  const key = `route_token:${token}`;
  const raw = await redis.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    await redis.del(key);
    return null;
  }
}

export async function deleteRouteToken(token) {
  const key = `route_token:${token}`;
  await redis.del(key);
}

// export function deleteRouteToken(token) {
//   store.delete(token);
// }
