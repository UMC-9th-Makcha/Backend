export function normalizeOdsayMapObject(raw) {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  // BaseX:BaseY@... 형태면 그대로
  if (s.includes("@")) return s;

  // ID:Class:StartIdx:EndIdx만 온 경우 -> 0:0@
  return `0:0@${s}`;
}
