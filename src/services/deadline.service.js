// bufferMinutes 뒤에 도착해야 한다고 가정할 때,
// firstLastTimeHHMM 시각까지 남은 시간을 계산하고,
// deadlineAt(ISO), minutesLeft, isPossible 반환
// buffer = 5 + 2 * transfer_count
// deadline = firstLastTime - buffer
// minutesLeft = deadline - now
// isPossible = minutesLeft >= 0

import {
  getKstParts,
  makeKstDate,
  makeKstDateWithDayOffset,
} from "../utils/kstDate.util.js";

// 00:00 ~ 04:59는 심야로 취급
const EARLY_CUTOFF = 5;

export function resolveLastDepartureDateTime({ hhmm }) {
  // 1) 입력 검증 + "HH:MM" 파싱
  if (typeof hhmm !== "string") return new Date(NaN);

  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return new Date(NaN);

  const hhRaw = Number(match[1]);
  const mm = Number(match[2]);

  if (!Number.isFinite(hhRaw) || !Number.isFinite(mm)) return new Date(NaN);
  if (hhRaw < 0 || hhRaw > 28 || mm < 0 || mm > 59) return new Date(NaN);
  // 24시 이상이면 다음날로 넘기기
  const dayOffset = Math.floor(hhRaw / 24); // 24~47 => 1
  const hh = hhRaw % 24; // 24:56 => 0:56

  // 2) 현재 KST 기준 날짜/시간
  const nowMs = Date.now();
  const nowKst = getKstParts(); // KST 기준
  const base = { y: nowKst.y, m: nowKst.m, d: nowKst.d };

  // 24~28시는 다음날 (오늘/내일 판정 적용 대상 X)
  if (dayOffset > 0) {
    return makeKstDateWithDayOffset({ ...base, hh, mm, ss: 0 }, dayOffset);
  }

  // hhRaw가 0~23일 때만 오늘/내일 판정
  const todayAt = makeKstDate({ ...base, hh, mm, ss: 0 });
  const tomorrowAt = makeKstDateWithDayOffset({ ...base, hh, mm, ss: 0 }, 1);

  // 새벽(0~4시)에는 오늘
  if (nowKst.hh < EARLY_CUTOFF) return todayAt;

  // 그 외: 오늘 시각이 아직 안 지났으면 오늘, 지났으면 내일
  return todayAt.getTime() >= nowMs ? todayAt : tomorrowAt;
}

export function computeDeadline({
  firstLastTimeHHMM,
  bufferMinutes,
  minutesToFirstBoard = 0,
  firstBoardBufferMinutes = 0,
}) {
  if (!firstLastTimeHHMM) {
    return {
      deadlineAt: null,
      minutesLeft: null,
      isPossible: false,
      reason: "FIRST_LEG_LAST_TIME_UNKNOWN",
    };
  }

  const lastDeparture = resolveLastDepartureDateTime({
    hhmm: firstLastTimeHHMM,
  });
  const lastMs = lastDeparture?.getTime?.();

  if (!Number.isFinite(lastMs)) {
    return {
      deadlineAt: null,
      minutesLeft: null,
      isPossible: false,
      reason: "FIRST_LEG_LAST_TIME_INVALID",
    };
  }

  const totalMinusMinutes =
    Number(bufferMinutes ?? 0) +
    Number(minutesToFirstBoard ?? 0) +
    Number(firstBoardBufferMinutes ?? 0);

  const deadlineMs = lastMs - totalMinusMinutes * 60 * 1000;

  if (!Number.isFinite(deadlineMs)) {
    return {
      deadlineAt: null,
      minutesLeft: null,
      isPossible: false,
      reason: "DEADLINE_COMPUTE_INVALID",
    };
  }

  const deadlineDate = new Date(deadlineMs);
  if (!Number.isFinite(deadlineDate.getTime())) {
    return {
      deadlineAt: null,
      minutesLeft: null,
      isPossible: false,
      reason: "DEADLINE_DATE_INVALID",
    };
  }

  const minutesLeft = Math.floor((deadlineMs - Date.now()) / (60 * 1000));

  return {
    deadlineAt: deadlineDate.toISOString(),
    minutesLeft,
    isPossible: minutesLeft >= 0,
    reason: null,
  };
}
