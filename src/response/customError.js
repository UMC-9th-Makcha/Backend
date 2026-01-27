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

// SAVEREPORT-200-001 세이브 리포트 조회 성공
// SAVEREPORT-400-001 잘못된 month 파라미터

// PLACE-400-001 잘못된 장소 요청
// PLACE-400-002 필수 장소 파라미터 누락
// PLACE-400-003 유효하지 않은 장소 타입
// PLACE-404-001 장소 정보 없음
// PLACE-409-001 이미 등록된 장소

// HOME-200-001 홈 설정 성공
// HOME-200-002 홈 삭제 성공
// HOME-400-001 잘못된 홈 요청
// HOME-404-001 홈 정보 없음

// MYPLACE-200-001 내 장소 조회 성공
// MYINFO-200-001 내 정보 조회 성공
// MYINFO-200-002 전화번호 수정 성공

// USER-400-001 잘못된 전화번호 형식
// USER-404-001 사용자 정보 없음

// SAVEREPORT-200-001 세이브 리포트 조회 성공
// SAVEREPORT-400-001 잘못된 month 파라미터z
// RECENT-400-001 잘못된 recentId
// RECENT-404-001 최근 목적지 정보 없음

