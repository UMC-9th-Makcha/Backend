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
    CONVENIENCE_STORE: 'CS2',
    CAFE: 'CE7',
    RESTAURANT: 'FD6',        // 음식점
    FAST_FOOD: 'FD6',
    PARK: 'PK6',              // 공원
    LIBRARY: 'CT1',           // 도서관
    SHOPPING_MALL: 'MT1',     // 대형마트
    SAUNA: null,              // 찜질방은 키워드 검색
    PC_ROOM: null
  },
  
  // 키워드 검색용 카테고리 추가
  keywordCategories: {
    PC_ROOM: 'PC방',
    SAUNA: '찜질방'         
  }
};