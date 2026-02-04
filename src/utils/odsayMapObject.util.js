export function normalizeOdsayMapObject(raw) {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  if (/\s/.test(s)) return null;

  // BaseX:BaseY@... 형태면 그대로
  if (s.includes("@")) return s;

  // ID:Class:StartIdx:EndIdx만 온 경우 -> 0:0@
  return `0:0@${s}`;
}

export function isLikelyValidOdsayMapObject(mapObj) {
  if (typeof mapObj !== "string") return false;
  const s = mapObj.trim();
  if (!s) return false;

  // 공백/개행 금지
  if (/\s/.test(s)) return false;

  // 허용 문자 제한(숫자, ':', '@')
  // if (!/^[0-9:@]+$/.test(s)) return false;

  // '@' 1개
  const parts = s.split("@");
  if (parts.length !== 2) return false;

  const [base, body] = parts;

  // base는 "숫자:(숫자)+"
  if (!/^\d+(?::\d+)+$/.test(base)) return false;

  // body도 "숫자:(숫자)+"
  if (!body || !/^\d+(?::\d+)+$/.test(body)) return false;

  return true;
}
