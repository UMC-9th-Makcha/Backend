# Makcha - Frontend

## 1. Overview
카카오톡 로그인 기반으로 사용자가 웹에서 설정/확인할 수 있는 화면을 제공하는 프론트엔드 레포입니다.
알림은 카카오톡 **알림톡**으로 발송되며, 버튼 클릭 시 본 웹으로 유입됩니다.

---

## 2. MVP Screens (권장 라우팅)
알림톡 버튼 링크 및 주요 화면은 아래 URL 규칙을 기준으로 합니다.

### A. 알림 내역/상세
- /alerts
- /alerts/:alertId
  - 알림 설정 정보(목적지/출발 권장 시각)
  - 발송된 알림 히스토리(세이브 리포트로 연결 가능)

### B. 경로 확인
- /alerts/:alertId/route
  - 출발 시점(T-0)에서 “경로 확인하기” 버튼의 도착지

### C. 첫차 대기 장소
- /waiting-places?area={AREA_CODE}
  - 카테고리: 카페/PC방/찜질방
  - 필터: 가까운순 / 24시간
  - 상세: 전화하기 / 도보 길찾기

### D. 귀가 확인(클릭 기록)
- /arrive?alertId={ALERT_ID}&result={public|taxi}
  - 버튼 클릭 시 결과 저장 후, 간단한 완료 화면 제공(또는 리포트로 리다이렉트)

### E. 카카오T 호출(보조)
- /taxi?kakaoT=1&from=alert&alertId={ALERT_ID}
  - 실서비스에서는 카카오T 딥링크/리다이렉트 정책에 따라 처리

---

## 3. 알림톡 템플릿과의 연결(프론트 관점)
- 알림톡의 모든 버튼 링크는 프론트 URL로 유입됨
- 링크 유입 시 다음을 고려
  - 로그인 상태가 아니면 로그인 유도 후 원래 목적 URL로 복귀
  - alertId 기반으로 API 호출하여 화면 렌더링

---

## 4. Collaboration Rules
- feature 브랜치 → PR → 리뷰 후 merge
- URL/문구/정책 변경은 PRD/이슈 업데이트 후 진행

---

## 5. Getting Started (Local)
> 개발 진행에 따라 업데이트
- Install:
- Run:

---

## 6. Owner
- FE Lead: 자이/백병재
- PM: 에단/서낙원
