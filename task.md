# TASKS.md — Build Checklist (3D Residential Design Generator)

Use this as your working checklist. Each phase is a self-contained chunk you can hand to an AI coding session (or do yourself) without needing the full context of every other phase — just this file + the TRD.

## Phase 0 — Skeleton
- [x] Create `index.html` with basic structure: header, `<div id="app">`, `<style>` block, `<script>` block.
- [x] Add Three.js CDN `<script type="module">` import, confirm a blank scene renders (spinning cube test — throwaway code, delete once confirmed).
- [x] Set up the global `state` object (per TRD §6).
- [x] Set up a single `render()` dispatcher function that shows/hides screens based on `state.screen`.

## Phase 1 — Plot Input Screen
- [x] Build `PlotInputCard` UI (width/length inputs, unit toggle).
- [x] Inline validation (min/max bounds).
- [x] Live scaled-rectangle preview on the same screen.
- [x] Wire "Next" button to save into `state.plot` and advance `state.screen`.

## Phase 2 — Requirements Screen
- [x] Build `RequirementsForm` (BHK stepper, parking segmented control, kitchen toggle, extras chips, facing compass picker).
- [x] Wire into `state.requirements`.
- [x] Back/Next navigation.

## Phase 3 — One Hardcoded Template End-to-End
- [x] Write ONE template object by hand (per TRD §3.1 schema).
- [x] Render it in the 2D canvas at its reference size (no scaling yet) — confirm walls/rooms/labels look right.
- [x] Implement `scaleTemplate()` (parametric engine) — confirm it resizes correctly for a few different plot inputs.
- [x] Implement basic geometry engine (room data → wall segments).
- [x] Get the same scaled data rendering in the 3D view (extruded walls, floor plane, basic lighting, OrbitControls).
- [x] Add 2D/3D toggle button.

## Phase 4 — Constraint Engine
- [x] Implement each check function from TRD §4.4 individually.
- [x] Build the `ConstraintList` UI component showing pass/warning badges.
- [x] Manually test each check with a deliberately broken template (undersized room, room outside plot, missing door) to confirm it actually fires.

## Phase 5 — Expand Template Library
- [x] Write remaining templates (target: 20+) using DATA-SCHEMA.md as the spec — batch this, e.g. 5 at a time, testing render after each batch.
- [x] Sanity-render every template once in isolation before relying on the matcher (catch typos/bad coordinates early).

## Phase 6 — Matcher + Scoring
- [x] Implement hard filter (BHK, parking) — TRD §4.1 step 1.
- [x] Implement soft scoring (aspect ratio, facing, extras) — TRD §4.1 step 2.
- [x] Implement final scoring formula (TRD §4.5).
- [x] Build `CandidateCard` grid UI (Screen 3), wire selection to advance to Result screen.

## Phase 7 — Save / Export
- [x] Export JSON (state → Blob → download).
- [x] Import JSON (file input → repopulate state → re-render).
- [x] Export PNG snapshot of the 2D canvas.
- [x] Toast notification on successful export/import.

## Phase 8 — Polish Pass
- [x] Apply visual style from UI-UX.md §3 (palette, blueprint-style canvas background).
- [x] Responsive check: mobile stacking for all 4 screens.
- [x] Accessibility pass: keyboard focus states, color+text on score badges.
- [x] Edge cases: no-match fallback message, extreme-aspect-ratio advisory banner.

## Phase 9 — Final QA
- [x] Run through PRD §6 Success Criteria one by one, confirm each is actually met.
- [x] Test on at least 2 different plot sizes per BHK count.
- [x] Test full offline reload (after first CDN fetch) if that matters to you.

---
**Status:** ALL PHASES COMPLETE & VERIFIED.