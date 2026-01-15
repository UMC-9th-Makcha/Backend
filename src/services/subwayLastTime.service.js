import { fetchSubwaySchedule } from "../repositories/odsaySubway.repository.js";

// 오늘 요일 기준으로 어떤 시간표 블록을 쓸지 결정

function pickScheduleBlock(result) {
  const now = new Date();
  const day = now.getDay(); // 0:일, 6:토

  if (day === 6) return result.saturdaySchedule; // 토요일
  if (day === 0) return result.holidaySchedule; // 일요일(공휴일 포함)
  return result.weekdaySchedule; // 평일
}

/*
scheduleBlock 안에서 (up/down) 방향의 막차 시간을 찾는다.
- firstLastFlag === 2 인 항목의 departureTime을 반환
- 여러 개면 "가장 늦은 시간"을 막차로 취급
반환: "HH:MM" 또는 null
*/
function extractLastTimeFromDirection(list) {
  if (!Array.isArray(list)) return null;

  // 막차 표시(2)만 필터
  const lastOnes = list.filter((item) => item?.firstLastFlag === 2);

  // 막차 항목이 없으면 null
  if (lastOnes.length === 0) return null;

  // departureTime은 "HH:MM" 문자열로 온다고 가정
  // 여러 개면 가장 늦은 시간을 선택
  const times = lastOnes.map((x) => x?.departureTime).filter(Boolean);

  if (times.length === 0) return null;

  // 문자열 "HH:MM" 비교는 pad가 보장되면 문자열 비교로도 가능하지만,
  // 안전하게 숫자로 변환해 최대값을 구함
  const toMin = (t) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };

  times.sort((a, b) => toMin(a) - toMin(b));
  return times[times.length - 1]; // 가장 늦은 시각
}

/*
지하철역 막차 시간 조회 (ODsay 시간표 기반)

입력:
- stationID: 지하철역 ID (필수)
- wayCode: 1(상행)/2(하행) - 있으면 해당 방향만 조회해서 막차 반환
    없으면 up/down 둘 다 보고 더 보수적으로 결정(정책)

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
        data
      )}`
    );
  }

  // ODsay는 HTTP 200이어도 error가 올 수 있음
  if (data?.error) {
    throw new Error(
      `ODsay subway schedule API error: ${JSON.stringify(data.error)}`
    );
  }

  const result = data?.result;
  if (!result) return null;

  const scheduleBlock = pickScheduleBlock(result);
  if (!scheduleBlock) return null;

  // ODsay 신규 포맷: scheduleBlock.up / scheduleBlock.down
  const upList = scheduleBlock.up;
  const downList = scheduleBlock.down;

  // 방향이 명시된 경우: 해당 방향만
  if (wayCode === 1) return extractLastTimeFromDirection(upList);
  if (wayCode === 2) return extractLastTimeFromDirection(downList);

  // 방향이 없으면 정책 선택이 필요함.
  // MVP에서는 "더 보수적으로": up/down 중 더 이른 막차를 선택 (min)
  // (낙관적으로 하려면 max를 선택)
  const upLast = extractLastTimeFromDirection(upList);
  const downLast = extractLastTimeFromDirection(downList);

  if (!upLast && !downLast) return null;
  if (upLast && !downLast) return upLast;
  if (!upLast && downLast) return downLast;

  const toMin = (t) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  };

  // 보수적(min) 선택
  return toMin(upLast) <= toMin(downLast) ? upLast : downLast;
}
