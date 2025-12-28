# Makcha - Backend

src/
├── config/
├── controllers/
├── dtos/
├── repositories/
├── services/
├── response/

├── database/
│   ├── migrations/
│   │   # 테이블 생성/수정/삭제 이력
│   │   # 예: 20250102_create_user_table.js
│   │
│   ├── seeders/
│   │   # 초기 데이터 (역, 노선, 대기장소 등)
│   │   # 예: seed_stations.js
│   │
│   └── index.js
│       # DB 연결 및 마이그레이션 실행 설정
│
├── app.js
├── index.js


## 1. Overview
서버가 막차 타이밍을 계산/스케줄링하고, 카카오톡 **알림톡(템플릿)** 을 발송하는 백엔드 레포입니다.
발송된 메시지는 버튼 클릭을 통해 웹으로 유입되며, 그 이력은 **세이브 리포트**의 근거가 됩니다.

---

## 2. MVP Responsibilities (Backend)
1) 사용자 식별(카카오 로그인 기반) 및 기본 사용자 정보 관리
2) 알림 설정(목적지/출발 권장 시각 등) 저장
3) 스케줄링:
   - 설정 완료 즉시(확인 메시지)
   - 출발 30분 전
   - 출발 n분 전(10~1분)
   - 출발 시각(T-0)
   - (옵션) 첫차 대기 장소 안내
   - (옵션) 귀가 확인 메시지
4) 알림톡 발송 연동(템플릿/변수 매핑)
5) 발송 로그/클릭 로그 저장(리포트 근거)

---

## 3. 알림톡 템플릿(변수 매핑 요약)
### Template #1 알림 설정 완료
- Variables: NAME, DESTINATION, DEPART_TIME, ALERT_ID
- Web link: /alerts/{ALERT_ID}

### Template #2 출발 30분 전
- Variables: NAME, DESTINATION, DEPART_TIME, ALERT_ID
- Web link: /alerts/{ALERT_ID}

### Template #3 출발 n분 전 (10~1)
- Variables: NAME, DESTINATION, DEPART_TIME, ALERT_ID, n
- Web link: /alerts/{ALERT_ID}

### Template #4 출발 알림 (T-0)
- Variables: NAME, DESTINATION, DEPART_TIME, ALERT_ID
- Web links:
  - /alerts/{ALERT_ID}/route
  - /taxi?kakaoT=1&from=alert&alertId={ALERT_ID}

### Template #5 첫차 대기 장소 안내
- Variables: NAME, AREA_NAME, AREA_CODE
- Web link: /waiting-places?area={AREA_CODE}

### Template #6 귀가 확인
- Variables: NAME, ALERT_ID
- Web links:
  - /arrive?alertId={ALERT_ID}&result=public
  - /arrive?alertId={ALERT_ID}&result=taxi

---

## 4. Sending Policy (운영 안정성)
- 과발송 금지:
  - 동일 이벤트 중복 발송 방지(idempotency key 권장)
  - 리마인드/반복은 MVP에서는 최소화(정책 확정 시 반영)
- 발송 실패 시:
  - 재시도 정책(횟수/간격) 결정 후 적용
  - 실패 로그 기록

---

## 5. Data/Logging (리포트 근거)
- alert(설정) 저장
- message_send_log(템플릿/시각/결과)
- click_log(버튼 클릭 결과: route/taxi/arrive 등)
- save_report는 위 로그를 기반으로 생성

---

## 6. Security
- 비밀키/토큰/발송 API 키는 절대 커밋 금지
- 환경변수(.env 등)로 관리

---

## 7. Collaboration Rules
- feature/{이슈번호}-{기능명}으로 브랜치 파고, develop으로 PR 올려주세요.
- 메시지 템플릿/발송 정책 변경은 PRD와 동기화

---

## 8. Getting Started (Local)
> 개발 진행에 따라 업데이트
- Install/Run:

---

## 9. Owner
- BE Lead: 조우/김수연
- PM: 에단/서낙원

