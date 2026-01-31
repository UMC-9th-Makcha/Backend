const store = new Map(); // token -> { value, expiresAt }

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
