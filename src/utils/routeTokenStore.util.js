const store = new Map(); // token -> { value, expiresAt }

// cleanup
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1분
const ENABLE_CLEANUP = process.env.ROUTE_TOKEN_CLEANUP !== "false";

function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, hit] of store.entries()) {
    if (now > hit.expiresAt) {
      store.delete(token);
    }
  }
}

let cleanupTimer = null;
if (ENABLE_CLEANUP) {
  cleanupTimer = setInterval(cleanupExpiredTokens, CLEANUP_INTERVAL_MS);

  if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();
}

export function setRouteToken(token, value, ttlSec = 60 * 30) {
  const expiresAt = Date.now() + ttlSec * 1000;
  store.set(token, { value, expiresAt });
}

export function getRouteToken(token) {
  const hit = store.get(token);
  if (!hit) return null;

  if (Date.now() > hit.expiresAt) {
    store.delete(token);
    return null;
  }
  return hit.value;
}

export function deleteRouteToken(token) {
  store.delete(token);
}
