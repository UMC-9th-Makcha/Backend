// bufferMinutes 뒤에 도착해야 한다고 가정할 때,
// firstLastTimeHHMM 시각까지 남은 시간을 계산하고,
// deadlineAt(ISO), minutesLeft, isPossible 반환
// buffer = 5 + 2 * transfer_count
// deadline = firstLastTime - buffer
// minutesLeft = deadline - now
// isPossible = minutesLeft >= 0

// 00:00 ~ 04:59는 심야로 취급
const EARLY_CUTOFF = 5;

function pad2(n) {
  return String(n).padStart(2, "0");
}

function makeKstDate(y, m, d, hh, mm) {
  return new Date(
    `${y}-${pad2(m)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}:00+09:00`,
  );
}

function nowKstParts() {
  const nowMs = Date.now();
  const kstMs = nowMs + 9 * 60 * 60 * 1000;
  const k = new Date(kstMs);

  return {
    nowMs,
    kstMs,
    y: k.getUTCFullYear(),
    m: k.getUTCMonth() + 1,
    d: k.getUTCDate(),
    hour: k.getUTCHours(),
  };
}

export function resolveLastDepartureDateTime({ hhmm }) {
  // 1) 입력 검증 + "HH:MM" 파싱
  if (typeof hhmm !== "string") return new Date(NaN);

  const match = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return new Date(NaN);

  const hh = Number(match[1]);
  const mm = Number(match[2]);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return new Date(NaN);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return new Date(NaN);

  // 2) 현재 KST 기준 날짜 파트 가져오기
  const { kstMs, y, m, d, hour } = nowKstParts();

  // 3) 오늘/내일 해당 시각 만들기
  const todayAt = makeKstDate(y, m, d, hh, mm);

  const tomorrowBase = makeKstDate(y, m, d, 0, 0);
  tomorrowBase.setDate(tomorrowBase.getDate() + 1);

  const y2 = tomorrowBase.getFullYear();
  const m2 = tomorrowBase.getMonth() + 1;
  const d2 = tomorrowBase.getDate();

  const tomorrowAt = makeKstDate(y2, m2, d2, hh, mm);

  // 4) 새벽(0~4시)에는 오늘
  if (hour < EARLY_CUTOFF) return todayAt;

  // 5) 그 외: 오늘 시각이 아직 안 지났으면 오늘, 지났으면 내일
  return todayAt.getTime() >= kstMs ? todayAt : tomorrowAt;
}

export function computeDeadline({ firstLastTimeHHMM, bufferMinutes }) {
  // 막차 시간 정보가 없으면 계산 불가
  if (!firstLastTimeHHMM) {
    return { deadlineAt: null, minutesLeft: null, isPossible: false };
  }

  const lastDeparture = resolveLastDepartureDateTime({
    hhmm: firstLastTimeHHMM,
  });

  const lastMs = lastDeparture?.getTime?.();
  if (!Number.isFinite(lastMs)) {
    // hhmm 파싱 실패 or resolve 로직 실패
    return { deadlineAt: null, minutesLeft: null, isPossible: false };
  }

  const deadlineMs = lastMs - Number(bufferMinutes ?? 0) * 60 * 1000;
  if (!Number.isFinite(deadlineMs)) {
    return { deadlineAt: null, minutesLeft: null, isPossible: false };
  }

  const deadlineDate = new Date(deadlineMs);
  if (Number.isNaN(deadlineDate.getTime())) {
    return { deadlineAt: null, minutesLeft: null, isPossible: false };
  }

  const minutesLeft = Math.floor((deadlineMs - Date.now()) / (60 * 1000));

  return {
    deadlineAt: deadlineDate.toISOString(),
    minutesLeft,
    isPossible: minutesLeft >= 0,
  };
}
