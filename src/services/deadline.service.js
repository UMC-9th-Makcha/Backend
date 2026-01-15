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
function kstNow() {
  const now = new Date();
  return new Date(now.toISOString());
}

function makeKstDate(y, m, d, hh, mm) {
  return new Date(
    `${y}-${pad2(m)}-${pad2(d)}T${pad2(hh)}:${pad2(mm)}:00+09:00`
  );
}

export function resolveLastDepartureDateTime({ hhmm }) {
  const [hh, mm] = hhmm.split(":").map(Number);

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  const todayAt = makeKstDate(y, m, d, hh, mm);

  // 내일 날짜 만들기
  const tomorrowBase = new Date(`${y}-${pad2(m)}-${pad2(d)}T00:00:00+09:00`);
  tomorrowBase.setDate(tomorrowBase.getDate() + 1);
  const y2 = tomorrowBase.getFullYear();
  const m2 = tomorrowBase.getMonth() + 1;
  const d2 = tomorrowBase.getDate();
  const tomorrowAt = makeKstDate(y2, m2, d2, hh, mm);

  const nowHour = now.getHours();

  // 새벽(0~4시)에는 "오늘"로 고정 (지났으면 음수로 나와야 정상)
  if (nowHour < EARLY_CUTOFF) {
    return todayAt;
  }

  // 그 외에는 현재보다 미래면 오늘, 아니면 내일
  return todayAt >= now ? todayAt : tomorrowAt;
}

export function computeDeadline({ firstLastTimeHHMM, bufferMinutes }) {
  // 막차 시간 정보가 없으면 계산 불가 -> null들로 반환
  if (!firstLastTimeHHMM) {
    return { deadlineAt: null, minutesLeft: null, isPossible: true };
  }
  const lastDeparture = resolveLastDepartureDateTime({
    hhmm: firstLastTimeHHMM,
  });

  const deadlineMs = lastDeparture.getTime() - bufferMinutes * 60 * 1000;
  const deadline = new Date(deadlineMs);

  const now = new Date();
  const minutesLeft = Math.floor((deadlineMs - now.getTime()) / (60 * 1000));

  return {
    deadlineAt: deadline.toISOString(),
    minutesLeft,
    isPossible: minutesLeft >= 0,
  };
}
