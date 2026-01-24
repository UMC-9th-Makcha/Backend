import { fetchSubwaySchedule } from "../repositories/odsaySubway.repository.js";

// 오늘 요일 기준으로 어떤 시간표 블록을 쓸지 결정

function pickScheduleBlock(result) {
  const now = new Date();
  const day = now.getDay(); // 0:일, 6:토

  if (day === 6) return result.saturdaySchedule; // 토요일
  if (day === 0) return result.holidaySchedule; // 일요일(공휴일 포함)
  return result.weekdaySchedule; // 평일
}

// "HH:MM"만 통과
function normalizeHHMM(t) {
  if (typeof t !== "string") return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;

  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function toMin(hhmm) {
  const m = normalizeHHMM(hhmm);
  if (!m) return null;
  const [hh, mm] = m.split(":").map(Number);
  return hh * 60 + mm;
}

/*
scheduleBlock 안에서 (up/down) 방향의 막차 시간을 찾음
여러 개면 "가장 늦은 시간"을 막차로 취급
*/
function extractLastTimeFromDirection(list) {
  if (!Array.isArray(list)) return null;

  // 막차 표시(2)만 필터
  const lastOnes = list.filter((item) => Number(item?.firstLastFlag) === 2);

  // 막차 항목이 없으면 null
  if (lastOnes.length === 0) return null;

  const times = lastOnes
    .map((x) => normalizeHHMM(x?.departureTime))
    .filter(Boolean);

  if (times.length === 0) return null;

  // 가장 늦은 시각 선택
  let best = times[0];
  let bestMin = toMin(best) ?? -1;

  for (let i = 1; i < times.length; i++) {
    const cur = times[i];
    const curMin = toMin(cur);
    if (curMin != null && curMin > bestMin) {
      best = cur;
      bestMin = curMin;
    }
  }

  return best;
}

/*
지하철역 막차 시간 조회 (ODsay 시간표 기반)

입력:
- stationID: 지하철역 ID (필수)
- wayCode: 1(상행)/2(하행) - 있으면 해당 방향만 조회해서 막차 반환
    없으면 up/down 둘 다 보고 더 보수적으로 결정

반환:
- "HH:MM" (막차 출발 시각) 또는 null
*/
export async function getSubwayLastTimeAtStation({ stationID, wayCode }) {
  const { ok, status, data } = await fetchSubwaySchedule({
    stationID,
    wayCode,
  });

  if (!ok) {
    throw new Error(
      `ODsay subway schedule HTTP error: status=${status}, body=${JSON.stringify(
        data,
      )}`,
    );
  }

  // ODsay는 HTTP 200이어도 error가 올 수 있음
  if (data?.error) {
    throw new Error(
      `ODsay subway schedule API error: ${JSON.stringify(data.error)}`,
    );
  }

  const result = data?.result;
  if (!result) return null;

  const scheduleBlock = pickScheduleBlock(result);
  if (!scheduleBlock) return null;

  const upList = scheduleBlock.up;
  const downList = scheduleBlock.down;

  const wc = wayCode == null ? null : Number(wayCode);
  // 방향이 명시된 경우: 해당 방향만
  if (wc === 1) return extractLastTimeFromDirection(upList);
  if (wc === 2) return extractLastTimeFromDirection(downList);

  // 방향이 없으면 보수적으로 up/down 중 더 이른 막차를 선택 (min)
  const upLast = extractLastTimeFromDirection(upList);
  const downLast = extractLastTimeFromDirection(downList);

  if (!upLast && !downLast) return null;
  if (upLast && !downLast) return upLast;
  if (!upLast && downLast) return downLast;

  return (toMin(upLast) ?? Infinity) <= (toMin(downLast) ?? Infinity)
    ? upLast
    : downLast;
}
