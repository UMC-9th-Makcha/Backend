export const appConfig = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  
  //baseUrl 추가
  baseUrl:
    process.env.BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api.makcha.store'
      : 'http://localhost:3000'),
  
  // 택시 요금 설정 (서울 기준)
  taxiFare: {
    baseFare: 4800,
    baseDistance: 2000,
    distanceRate: 100,
    distanceUnit: 132,
    timeRate: 100,
    timeUnit: 31,
    nightSurchargeRate: 0.2,
    nightStartHour: 0,
    nightEndHour: 4
  },
  
  // 검색 기본 설정
  search: {
    defaultRadius: 3000,  // 3km
    defaultLimit: 10,
    maxRadius: 5000
  }
};