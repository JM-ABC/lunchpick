# LunchPick Mobile UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the decorative stock photo from the solo-recommendation hero, fix the mobile header tab wrapping, and fix mobile content ordering on the team-vote screen so the vote cards appear before the informational sidebar cards.

**Architecture:** Single-file React app (`src/App.tsx`), Tailwind v4 utility classes only. All three changes are JSX structure + Tailwind class changes — no new components, no state changes, no new dependencies. There is no test framework in this repo (confirmed: no jest/vitest config, no test directory) and no business logic is touched, so verification is visual: gstack browse screenshots at desktop (1280px) and mobile (390px) before/after each task, in place of unit tests.

**Tech Stack:** React 19, Tailwind CSS v4 (CSS-first config, no `tailwind.config.js`), Vite, gstack browse (`~/.claude/skills/gstack/browse/dist/browse`, aliased `$B` below) for visual verification.

**Design doc:** `docs/plans/2026-08-29-lunchpick-mobile-ux-redesign-design.md`

---

## Before you start

Local dev server must be running on `http://localhost:3000` (`npm run dev` from repo root). If port 3000 is already in use, that's fine — it means a server from an earlier session is still up; just reuse it.

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
"$B" goto http://localhost:3000/
"$B" wait --networkidle
```

Working tree must be clean before starting (check `git status --porcelain`; if dirty, stop and ask — do not commit unrelated changes as part of this plan).

---

### Task A: Remove hero photo, collapse to single-column layout

**Files:**
- Modify: `src/App.tsx:157-204`

**Step 1: Screenshot the current state (desktop + mobile)**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
SCRATCH="C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-------/d55c7ac4-383f-4048-b46b-fda3386b16d6/scratchpad"
"$B" viewport 1280x900
"$B" goto http://localhost:3000/
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskA-before-desktop.png" --viewport
"$B" viewport 390x844
"$B" reload
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskA-before-mobile.png" --viewport
```

Read both screenshots with the Read tool so you have the "before" reference in context.

**Step 2: Replace the hero section JSX**

Current code at `src/App.tsx:157-204`:

```tsx
              <section className="relative overflow-hidden bg-white border border-black/5 rounded-[40px] p-8 sm:p-16 shadow-sm">
                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">
                        Today's Pick
                      </span>
                      <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
                        오늘의<br />추천 메뉴
                      </h2>
                    </div>
                    
                    {dailyRecommend && (
                      <div className="space-y-6">
                        <div className="p-8 bg-[#f9f9f9] rounded-3xl border border-black/5">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-3xl font-bold">{dailyRecommend.name}</h3>
                              <p className="text-[#9e9e9e] font-medium">{dailyRecommend.category} • {dailyRecommend.distance}</p>
                            </div>
                            <div className="flex items-center gap-1 bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              <span className="font-bold">{dailyRecommend.rating}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => fetch('/api/daily-recommend').then(res => res.json()).then(data => setDailyRecommend(data))}
                          className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                          다른 메뉴 추천받기
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative aspect-square rounded-[32px] overflow-hidden bg-emerald-50">
                    <img 
                      src={`https://picsum.photos/seed/${(dailyRecommend?.category || 'food').replace(/\//g, '-')}/800/800`}
                      alt="Food"
                      className="w-full h-full object-cover mix-blend-multiply opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                  </div>
                </div>
              </section>
```

Replace with (grid removed, `lg:grid-cols-2` column dropped, image block deleted, card padding/type bumped up one notch to fill the reclaimed width):

```tsx
              <section className="relative overflow-hidden bg-white border border-black/5 rounded-[40px] p-8 sm:p-16 shadow-sm">
                <div className="relative z-10 max-w-2xl space-y-8">
                  <div className="space-y-4">
                    <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-widest">
                      Today's Pick
                    </span>
                    <h2 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
                      오늘의<br />추천 메뉴
                    </h2>
                  </div>

                  {dailyRecommend && (
                    <div className="space-y-6">
                      <div className="p-10 bg-[#f9f9f9] rounded-3xl border border-black/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-4xl font-bold">{dailyRecommend.name}</h3>
                            <p className="text-[#9e9e9e] font-medium">{dailyRecommend.category} • {dailyRecommend.distance}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-white px-4 py-2 rounded-2xl border border-black/5 shadow-sm">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{dailyRecommend.rating}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => fetch('/api/daily-recommend').then(res => res.json()).then(data => setDailyRecommend(data))}
                        className="group -my-3 flex items-center gap-3 py-3 text-sm font-bold text-[#9e9e9e] hover:text-emerald-600 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        다른 메뉴 추천받기
                      </button>
                    </div>
                  )}
                </div>
              </section>
```

**Step 3: Check unused imports**

`Star` and `RefreshCw` are still used above, but the removed `<img>` block was the only consumer of nothing extra (no icon was used inside it). No import cleanup needed. Confirm by running:

```bash
grep -n "picsum" src/App.tsx
```

Expected: no output (the only usage was in the deleted block).

**Step 4: Verify in browser (desktop + mobile)**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
SCRATCH="C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-------/d55c7ac4-383f-4048-b46b-fda3386b16d6/scratchpad"
"$B" viewport 1280x900
"$B" goto http://localhost:3000/
"$B" wait --networkidle
"$B" console --errors
"$B" screenshot "$SCRATCH/taskA-after-desktop.png" --viewport
"$B" viewport 390x844
"$B" reload
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskA-after-mobile.png" --viewport
```

Read both "after" screenshots. Confirm: no console errors, no leftover empty space on the right on desktop, card reads clearly, no horizontal scroll on mobile.

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "style: remove decorative hero photo, collapse to single-column layout"
```

---

### Task B: Mobile header — stack into two rows, full-width tabs

**Files:**
- Modify: `src/App.tsx:120-144`

**Step 1: Screenshot current mobile header**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
SCRATCH="C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-------/d55c7ac4-383f-4048-b46b-fda3386b16d6/scratchpad"
"$B" viewport 390x844
"$B" goto http://localhost:3000/
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskB-before-mobile.png" --viewport
```

Confirm in the screenshot that "혼밥"/"추천" and "팀"/"투표" are wrapping onto two lines inside the tab pills — that's the bug this task fixes.

**Step 2: Replace the header JSX**

Current code at `src/App.tsx:120-144`:

```tsx
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Utensils className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">LUNCHPICK</h1>
          </div>
          
          <nav className="flex bg-black/5 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('solo')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'solo' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              혼밥 추천
            </button>
            <button 
              onClick={() => setActiveTab('team')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              팀 투표
            </button>
          </nav>
        </div>
      </header>
```

Replace with (container becomes `flex-col sm:flex-row`, fixed `h-20` dropped in favor of `py-4 sm:h-20 sm:py-0`, nav gets `w-full sm:w-auto` and each button gets `flex-1 sm:flex-none` so the two tabs split the width 50/50 on mobile and shrink back to content-width pills at `sm` and up):

```tsx
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 sm:h-20 sm:py-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Utensils className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">LUNCHPICK</h1>
          </div>

          <nav className="flex w-full sm:w-auto bg-black/5 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('solo')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'solo' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              혼밥 추천
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'team' ? 'bg-white shadow-sm text-emerald-600' : 'text-[#9e9e9e] hover:text-[#141414]'}`}
            >
              팀 투표
            </button>
          </nav>
        </div>
      </header>
```

**Step 3: Verify in browser (mobile + desktop, plus the sm breakpoint edge)**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
SCRATCH="C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-------/d55c7ac4-383f-4048-b46b-fda3386b16d6/scratchpad"
"$B" viewport 390x844
"$B" goto http://localhost:3000/
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskB-after-mobile.png" --viewport
"$B" viewport 640x800
"$B" reload
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskB-after-sm-boundary.png" --viewport
"$B" viewport 1280x900
"$B" reload
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskB-after-desktop.png" --viewport
"$B" console --errors
```

Read all three screenshots. Confirm: mobile tabs are full-width and text stays on one line; at the 640px `sm` boundary the header returns to a single row without visual glitches; desktop is unchanged from before this task (compare against Task A's after-desktop screenshot — header area should be pixel-similar).

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "style: stack header into two rows on mobile so tab labels stop wrapping"
```

---

### Task C: Mobile team-vote screen — vote cards before sidebar

**Files:**
- Modify: `src/App.tsx:217, 249` (two `className` additions, no JSX restructuring)

**Step 1: Screenshot current mobile team-vote screen**

The team tab requires a nickname before showing the vote UI. Reuse whatever nickname flow is fastest — either fill the prompt or rely on `localStorage.lunchpick_userid` already being set from an earlier session.

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
SCRATCH="C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-------/d55c7ac4-383f-4048-b46b-fda3386b16d6/scratchpad"
"$B" viewport 390x844
"$B" goto http://localhost:3000/
"$B" wait --networkidle
"$B" js "(()=>{const c=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('팀 투표')); c && c.click();})()"
"$B" wait --networkidle
"$B" js "(()=>{const i=document.querySelector('input'); if(i && document.querySelector('h2')?.textContent.includes('반가워요')===false){} })()" >/dev/null 2>&1
```

If the nickname modal appears (check with `"$B" text` for "반가워요"), fill it:

```bash
"$B" fill "input" "테스터"
"$B" click "text=시작하기"
"$B" wait --networkidle
```

```bash
"$B" screenshot "$SCRATCH/taskC-before-mobile.png" --viewport
```

Confirm in the screenshot: "투표 관리" card and "접속 중" card appear above the restaurant vote cards.

**Step 2: Add `order` utility classes**

At `src/App.tsx:217`, the sidebar `<aside>` opening tag currently reads:

```tsx
                  <aside className="lg:sticky lg:top-32 space-y-6">
```

Change to:

```tsx
                  <aside className="order-2 lg:order-none lg:sticky lg:top-32 space-y-6">
```

At `src/App.tsx:249`, the main content `<div>` opening tag currently reads:

```tsx
                  <div className="space-y-8">
```

This is inside the `{teamState && (<div className="grid lg:grid-cols-[350px_1fr] gap-8 items-start">` block (started at line 215) — it's the second direct child, immediately after the `</aside>` closing tag on line 246. Change it to:

```tsx
                  <div className="order-1 lg:order-none space-y-8">
```

Note: `space-y-8` appears multiple times in this file. Use the surrounding context (immediately follows `</aside>` and precedes the `{/* Add Restaurant: Horizontal Bar for PC */}` comment) to make sure you're editing the right one — don't use a blind find-and-replace-all.

**Step 3: Verify in browser (mobile + desktop)**

```bash
B="$HOME/.claude/skills/gstack/browse/dist/browse"
SCRATCH="C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Desktop-projects-------/d55c7ac4-383f-4048-b46b-fda3386b16d6/scratchpad"
"$B" viewport 390x844
"$B" reload
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskC-after-mobile.png" --viewport
"$B" viewport 1280x900
"$B" reload
"$B" wait --networkidle
"$B" screenshot "$SCRATCH/taskC-after-desktop.png" --viewport
"$B" console --errors
```

Read both screenshots. Confirm: on mobile, the vote candidate cards (and the "식당 추가" form bar, if `teamState.status === 'voting'`) now appear before the "투표 관리" / "접속 중" cards. On desktop, layout must be pixel-identical to before this task — `lg:order-none` resets the order so the `lg:grid-cols-[350px_1fr]` grid positioning is unaffected.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "style: show vote cards before sidebar info cards on mobile"
```

---

## Final check

After all three tasks:

```bash
git log --oneline -3
git status --porcelain
```

Expected: three new commits, clean working tree (the pre-existing unstaged `.gitignore` change from before this session, if still present, is not part of this plan — leave it alone).

Ask the user whether to `git push origin main` so the live Vercel deployment picks up the changes, same as the previous round of fixes.
