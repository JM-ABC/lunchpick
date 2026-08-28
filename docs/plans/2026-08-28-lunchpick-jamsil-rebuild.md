# LunchPick 잠실 — Google AI Studio 종속 제거 Implementation Plan

> **For Claude:** This is a small cleanup/refactor on an existing working app (no new features, no behavior change beyond removing dead code). Execute tasks in order directly in this session — a dedicated worktree / subagent-per-task ceremony is unnecessary overhead for a change this size. No automated test suite exists or is being added (per the design doc's testing section); verification is `npm run lint`, `npm run build`, and manual smoke-testing in the browser.

**Goal:** Remove all Google AI Studio / Gemini scaffolding (unused dependency, env vars, branding) and the hardcoded flavor-text comments, while keeping every existing feature (혼밥 추천, 팀 투표) working identically.

**Architecture:** No architecture change — same Vite + React 19 + Express + ws app. Pure subtraction: delete dead code/config, don't restructure anything else.

**Tech Stack:** Vite, React 19, TypeScript, Express, ws, Tailwind CSS, motion, lucide-react.

**Design doc:** `docs/plans/2026-08-28-lunchpick-jamsil-rebuild-design.md`

---

### Task 1: Remove the Gemini dependency and env vars

**Files:**
- Modify: `package.json`
- Delete: `.env.example`
- Modify: `vite.config.ts:1-24`

**Step 1:** In `package.json`, remove the `"@google/genai": "^1.29.0",` line from `dependencies`.

**Step 2:** Delete `.env.example` entirely — the app needs no secrets/env vars anymore.

**Step 3:** In `vite.config.ts`, remove the `define` block that injects `GEMINI_API_KEY`, and simplify the `server` block to drop the AI-Studio-specific `DISABLE_HMR` comment/logic:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
```

**Step 4:** Run `npm install` to update `package-lock.json` (removes the now-unlisted `@google/genai` and its transitive deps).

Run: `npm install`
Expected: exits 0, `package-lock.json` changes to drop `@google/genai`.

**Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git rm .env.example
git commit -m "chore: remove unused Gemini SDK and AI Studio env vars"
```

---

### Task 2: Remove AI Studio branding

**Files:**
- Modify: `index.html:6`
- Modify: `README.md`
- Delete: `metadata.json` (AI-Studio-only app-submission metadata, unused by the build)

**Step 1:** In `index.html`, change the title:

```html
<title>LunchPick</title>
```

**Step 2:** Rewrite `README.md` to drop the AI Studio banner/link and Gemini key setup step:

```markdown
# LunchPick — 잠실 점심 메뉴 결정 서비스

잠실 롯데월드타워 직장인들을 위한 스마트 점심 메뉴 결정 솔루션입니다.
혼밥 추천과 팀 실시간 투표 기능을 제공합니다.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
```

**Step 3:** Delete `metadata.json`.

**Step 4: Commit**

```bash
git add index.html README.md
git rm metadata.json
git commit -m "chore: remove AI Studio branding"
```

---

### Task 3: Remove the hardcoded flavor-text comments

**Files:**
- Modify: `server.ts:119-133` (`RECOMMENDATION_COMMENTS` + `getCommentForRestaurant`), `server.ts:265-269` (`/api/daily-recommend`)
- Modify: `src/App.tsx` (quote line in the solo daily-recommend card, quote line in the team winner card, and the duplicate `getCommentForRestaurant` function at the bottom of the file)

**Step 1:** In `server.ts`, delete the `RECOMMENDATION_COMMENTS` dictionary and the `getCommentForRestaurant` function (lines 119-133).

**Step 2:** In `server.ts`, simplify the daily-recommend route to stop attaching a comment:

```ts
app.get('/api/daily-recommend', (req, res) => {
  const randomRestaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
  res.json(randomRestaurant);
});
```

**Step 3:** In `src/App.tsx`, remove the quote block in the solo tab:

```tsx
<div className="p-8 bg-[#f9f9f9] rounded-3xl border border-black/5">
  <p className="text-xl font-medium text-[#757575] italic leading-relaxed">
    "{dailyRecommend.comment}"
  </p>
  <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
```

becomes:

```tsx
<div className="p-8 bg-[#f9f9f9] rounded-3xl border border-black/5">
  <div className="flex items-center justify-between">
```

(Drop the closing `</div>` that paired with the removed `<p>`'s wrapper — keep the `name`/`category`/`distance`/`rating` block below unchanged, just un-nested by one level.)

**Step 4:** In `src/App.tsx`, remove the quote line in the team winner card:

```tsx
<p className="text-xl text-[#757575] font-medium italic">"{getCommentForRestaurant(getWinner())}"</p>
```

Delete this line entirely.

**Step 5:** In `src/App.tsx`, delete the duplicate `getCommentForRestaurant` function defined near the bottom of the file (the one right before `export default App;`) — it's now unused.

**Step 6:** Verify no leftover references:

Run: `grep -rn "getCommentForRestaurant\|RECOMMENDATION_COMMENTS\|dailyRecommend.comment" server.ts src/`
Expected: no output.

**Step 7: Commit**

```bash
git add server.ts src/App.tsx
git commit -m "feat: remove hardcoded flavor-text comments from recommendations"
```

---

### Task 4: Verify the app still builds and runs

**Step 1:** Type-check.

Run: `npm run lint`
Expected: exits 0 (no TypeScript errors).

**Step 2:** Production build.

Run: `npm run build`
Expected: exits 0, `dist/` produced.

**Step 3:** Manual smoke test.

Run: `npm run dev`, open the printed local URL in a browser:
- 혼밥 추천 탭: a restaurant card shows with no quote text, "다른 메뉴 추천받기" fetches a new one.
- 팀 투표 탭: open a second browser window, set nicknames in both, add/vote on candidates, finish voting — winner card shows with no quote text, both windows update live.

Expected: both flows work exactly as before, minus the comment text.

---

### Task 5: Set up Vercel deployment config

**Files:**
- Create: `vercel.ts`

**Step 1:** Add a minimal Vercel config so `vercel deploy` builds and serves the Express app as-is:

```ts
import type { VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'npm run build',
};
```

(Vercel runs Express apps natively via Fluid Compute with no further config needed — `server.ts` already serves `dist/` in production mode.)

**Step 2: Commit**

```bash
git add vercel.ts
git commit -m "chore: add Vercel deploy config"
```

**Step 3:** Ask the user whether to actually run `vercel deploy` now (a real, visible action against their Vercel account) before doing it.
