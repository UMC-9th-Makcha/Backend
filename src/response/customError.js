export class CustomError {
  constructor(errorCode, message, path, result = {}) {
    this.errorCode = errorCode;
    this.message = message;
    this.path = path;
    this.result = result;
  }
}


// AUTH-401-001 Access Token 만료
// AUTH-401-002 Refresh Token 만료
// AUTH-403-001 권한 없음
// MAP-400-001 잘못된 좌표값
// MAP-404-001 역 정보 없음
// MAP-404-002 경로 탐색 실패
// NOTI-404-001 알림 정보 없음
// COM-400-001 필수 파라미터 누락
// COM-500-001 서버 내부 오류
