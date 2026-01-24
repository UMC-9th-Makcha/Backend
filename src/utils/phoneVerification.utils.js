// utils/phoneVerification.utils.js

const store = new Map();

const TTL = 3 * 60 * 1000;      // 3분
const MAX_SEND_COUNT = 3;       // 3분 동안 최대 3회

/**
 * key: phoneNumber
 * value: {
 *   code,
 *   expiresAt,
 *   count,
 *   firstSentAt
 * }
 */ //무한 요청을 방지했습니다.(금액 보완)

export const saveCode = (phoneNumber, code) => {
  const now = Date.now();
  const existing = store.get(phoneNumber);

  // 이미 기록이 있고, 아직 3분이 지나지 않았다면
  if (existing && now < existing.expiresAt) {
    if (existing.count >= MAX_SEND_COUNT) {
      // 서비스에서 CustomError로 변환해서 처리
      throw new Error('AUTH-429-001');
    }

    // 횟수만 증가 + 코드 갱신 (expiresAt은 유지)
    store.set(phoneNumber, {
      ...existing,
      code,
      count: existing.count + 1,
    });
    return;
  }

  // 처음 요청이거나, 3분이 지난 경우 → 새 세션 시작
  store.set(phoneNumber, {
    code,
    expiresAt: now + TTL,
    count: 1,
    firstSentAt: now,
  });
};

export const verifyCode = (phoneNumber, code) => {
    const data = store.get(phoneNumber);
    if (!data) return false;
  
    if (Date.now() > data.expiresAt) {
      store.delete(phoneNumber); // 만료 시 제거할 수 있도록 함.
      return false;
    }
  
    return data.code === code;
  };
export const deleteCode = (phoneNumber) => {
  store.delete(phoneNumber);
};
