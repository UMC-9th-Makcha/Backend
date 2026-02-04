// utils/phoneVerification.utils.js

// const store = new Map();
import redis from '../config/redis.js'; // redis로 바꿈
//서버 재시작해도 데이터 유지됨. 여러 서버 인스턴스 공유 가능함.

const TTL = 3 * 60;      // 3분
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

export const saveCode = async (phoneNumber, code) => {
  const key = `phone:${phoneNumber}`;
  const now = Date.now();
  
  const existing = await redis.get(key);
  
  if (existing) {
    const data = JSON.parse(existing);
    
    // 아직 TTL 내라면
    if (data.count >= MAX_SEND_COUNT) {
      throw new Error('AUTH-429-001');
    }
    
    // 횟수 증가 + 코드 갱신 (TTL 유지를 위해 KEEPTTL 사용)
    await redis.set(key, JSON.stringify({
      ...data,
      code,
      count: data.count + 1,
    }), 'KEEPTTL');
    return;
  }
  
  // 새 세션 시작
  await redis.set(key, JSON.stringify({
    code,
    count: 1,
    firstSentAt: now,
  }), 'EX', TTL);
};

export const verifyCode = async (phoneNumber, code) => {
  const key = `phone:${phoneNumber}`;
  const data = await redis.get(key);
  
  if (!data) return false;
  
  const parsed = JSON.parse(data);
  return parsed.code === code;
};

export const deleteCode = async (phoneNumber) => {
  const key = `phone:${phoneNumber}`;
  await redis.del(key);
};
