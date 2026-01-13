import dotenv from 'dotenv';
dotenv.config();

export const kakaoConfig = {
  restApiKey: process.env.KAKAO_REST_API_KEY,
  baseURL: {
    local: 'https://dapi.kakao.com/v2/local',
    directions: 'https://apis-navi.kakaomobility.com/v1/directions'
  },
  timeout: parseInt(process.env.API_TIMEOUT) || 5000,
  retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 2,
  
  categoryCode: {
    CAFE: 'CE7',
    PC_ROOM: 'CT1',
    SAUNA: 'AC5'
  }
};