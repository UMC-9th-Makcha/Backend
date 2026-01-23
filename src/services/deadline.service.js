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
  const [hh, mm] = hhmm.split(":").map(Number);

  const { kstMs, y, m, d, hour } = nowKstParts();

  const todayAt = makeKstDate(y, m, d, hh, mm);

  // 내일 KST 날짜
  const tomorrowBase = makeKstDate(y, m, d, 0, 0);
  tomorrowBase.setDate(tomorrowBase.getDate() + 1);
  const y2 = tomorrowBase.getFullYear();
  const m2 = tomorrowBase.getMonth() + 1;
  const d2 = tomorrowBase.getDate();
  const tomorrowAt = makeKstDate(y2, m2, d2, hh, mm);

  // 새벽(0~4시)에는 "오늘"로 고정
  if (hour < EARLY_CUTOFF) return todayAt;

  // 현재보다 미래면 오늘, 아니면 내일
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
  const deadlineMs = lastDeparture.getTime() - bufferMinutes * 60 * 1000;

  const minutesLeft = Math.floor((deadlineMs - Date.now()) / (60 * 1000));

  return {
    deadlineAt: new Date(deadlineMs).toISOString(),
    minutesLeft,
    isPossible: minutesLeft >= 0,
  };
}
