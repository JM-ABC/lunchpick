# 식당 데이터 분리 설계 (2026-08-29)

## 배경

식당 목록을 앞으로도 종종(월 몇 회) 추가/폐점 수정할 예정. 사용자는 관리 UI나 DB 같은 큰 구조는 필요 없다고 판단 — 그때그때 Claude Code에게 요청해서 코드를 고치고 배포하는 방식을 유지하기로 함. 다만 지금 `server/app.ts`에 로직과 데이터(`RESTAURANTS` 배열)가 섞여 있어서, 다음에 데이터만 고칠 때 실수로 로직을 건드릴 위험이 있음.

## 변경 내용

`server/app.ts` 최상단의 `RESTAURANTS` 배열(현재 9-48행, 39개 항목)을 `server/restaurants.ts`로 그대로 옮기고, `app.ts`에서 `import { RESTAURANTS } from './restaurants.js';`로 불러온다.

- 데이터 내용, 타입, 값은 전혀 바꾸지 않는다 (순수 이동).
- `app.ts` 안에서 `RESTAURANTS`를 변경하는 곳(`POST /api/restaurants`에서 `RESTAURANTS.push(...)`)이 있으므로, `restaurants.ts`에서도 `export let RESTAURANTS = [...]`로 내보내 기존처럼 배열을 mutate할 수 있게 유지한다.
- 기능적 변화 없음 — 순수 리팩터링.

## 범위 밖

- DB, 관리 UI, 인증 등은 이번엔 안 함 (사용자가 명시적으로 필요 없다고 확인).

## 검증

`npm run dev`로 로컬 서버 재기동 후 혼밥 추천/팀 투표 두 화면이 기존과 동일하게 동작하는지 확인 (식당 데이터가 정상적으로 표시되는지).
