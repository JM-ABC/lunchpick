# LunchPick 잠실 리빌드 — 설계 문서

날짜: 2026-08-28

## 배경

원본: https://github.com/JM-ABC/lunchpick — Google AI Studio로 스캐폴딩된 앱.
`@google/genai`(Gemini SDK)가 package.json에 있지만 실제 코드 어디서도 호출되지 않음.
추천 코멘트는 하드코딩된 문장 배열에서 랜덤으로 골라 보여주는 방식이었고, 진짜 AI 호출은 없었음.

## 목표

- 기능은 원본과 동일하게 유지 (새로운 AI 기능 추가 안 함 — 사용자가 명시적으로 보류)
- Google AI Studio 종속성 제거: `@google/genai` 의존성, GEMINI_API_KEY/APP_URL 환경변수, README의 AI Studio 안내
- 추천 코멘트(하드코딩된 감탄사 문장)는 오글거린다는 피드백으로 완전히 제거 — 식당 정보만 보여줌
- Vercel에 배포 가능한 상태로 구성

## 채택한 접근

원본과 동일한 스택으로 새 프로젝트를 직접 포팅한다 (Vite + React 19 + Express + ws).
Next.js 마이그레이션이나 프론트/백엔드 분리 배포는 "로직 그대로 유지" 요구와 맞지 않고
이 앱 규모에 비해 과도한 작업이라 기각.

## 아키텍처

- 프론트엔드: Vite + React 19 + TypeScript, Tailwind CSS, framer-motion(모션) 애니메이션, lucide-react 아이콘
- 백엔드: Express 서버 하나가 개발 모드에선 Vite 미들웨어를 붙여 SPA를 서빙하고,
  프로덕션 모드에선 빌드된 정적 파일을 서빙. 같은 HTTP 서버에 WebSocketServer(ws)를 붙여
  실시간 팀 투표를 처리
- 상태 저장: 데이터베이스 없이 서버 메모리에 팀 상태(`teamState`)와 식당 목록(`RESTAURANTS`)을 보관
  (원본과 동일 — 서버 재시작 시 초기화됨, 잠실 롯데월드몰/백화점 지역의 실제 맛집 이름/카테고리 데이터 그대로 사용)
- 배포: Vercel. Express 앱은 별도 설정 없이 Vercel Functions로 구동 가능 — `vercel.ts`로
  빌드 커맨드만 지정

## 컴포넌트 / 기능

1. **혼밥 추천 탭**
   - 진입 시 `/api/daily-recommend` 호출, 랜덤 식당 1곳 표시 (이름/카테고리/평점/거리)
   - "다른 메뉴 추천받기" 버튼으로 재요청
   - ~~추천 코멘트 문구~~ → 제거 (사용자 요청)

2. **팀 투표 탭**
   - WebSocket 연결, 최초 접속 시 닉네임 입력 프롬프트
   - 랜덤으로 뽑힌 후보 4곳 중 투표 (한 사람당 1표, 실시간으로 득표수 갱신)
   - "직접 입력"으로 후보 식당 추가 가능
   - 투표 종료 시 최다 득표 식당을 승자로 표시, 투표 상세 내역(누가 뭘 찍었는지) 표시
   - ~~승자 코멘트 문구~~ → 제거 (사용자 요청)
   - "다시 투표하기"로 초기화 (닉네임은 유지)

## 데이터 흐름

REST:
- `GET /api/daily-recommend` — 랜덤 식당 1곳
- `GET /api/recommend` — 혼밥 가능(isSoloFriendly) 식당 중 랜덤 1곳
- `POST /api/restaurants` — 식당 추가 (name 필수)

WebSocket 메시지 (클라이언트→서버 / 서버→클라이언트):
- `IDENTIFY` → `SYNC_STATE` (재접속 시 기존 userId로 상태 동기화)
- `SET_NICKNAME`, `START_VOTING`, `SUBMIT_VOTE`, `FINISH_VOTING`, `ADD_CANDIDATE`, `RESET_VOTE`
- 모든 상태 변경은 `STATE_UPDATED` 브로드캐스트로 전체 접속자에게 전파

## 제거 대상 (원본 대비)

- `@google/genai` 패키지 및 관련 import
- `.env.example`의 `GEMINI_API_KEY`, `APP_URL`
- README의 "AI Studio에서 앱 보기" 안내, Gemini API 키 설정 안내
- `RECOMMENDATION_COMMENTS` 딕셔너리와 `getCommentForRestaurant` 함수 (서버/클라이언트 양쪽) 및 이를 사용하는 UI 문구

## 에러 처리

원본과 동일한 범위 유지:
- `POST /api/restaurants`에 이름 없으면 400 응답
- WebSocket 재연결 로직은 원본에도 없었으므로 이번에도 추가하지 않음 (탭 전환 시 재연결)

## 테스트 계획

자동화 테스트 없이 수동 QA로 확인 (앱 규모상 과한 테스트 인프라는 불필요):
- `npm run dev`로 로컬 구동 후 브라우저에서 혼밥 추천 탭 동작 확인
- 브라우저 창 2개를 동시에 열어 팀 투표 탭에서 닉네임 설정 → 후보 추가 → 투표 → 종료까지
  실시간으로 반영되는지 확인
- 빌드(`npm run build`) 후 프로덕션 모드로 정상 구동되는지 확인
