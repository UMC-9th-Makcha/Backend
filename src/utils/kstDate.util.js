const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getKstParts(date = new Date()) {
  const t = date.getTime() + KST_OFFSET_MS; // KST로 시프트
  const d = new Date(t);

  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    hh: d.getUTCHours(),
    mm: d.getUTCMinutes(),
    ss: d.getUTCSeconds(),
    day: d.getUTCDay(), // 0=일 ~ 6=토 (KST 기준)
  };
}

export function makeKstDate({ y, m, d, hh = 0, mm = 0, ss = 0 }) {
  const utcMs = Date.UTC(y, m - 1, d, hh, mm, ss) - KST_OFFSET_MS;
  return new Date(utcMs);
}

// KST 기준 날짜 + dayOffset(일수)
export function makeKstDateWithDayOffset(
  { y, m, d, hh = 0, mm = 0, ss = 0 },
  dayOffset = 0,
) {
  const base = makeKstDate({ y, m, d, hh, mm, ss });
  return new Date(base.getTime() + dayOffset * 24 * 60 * 60 * 1000);
}
