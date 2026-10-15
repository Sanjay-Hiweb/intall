# MASTER-SPEC.md — 3D Residential Design Generator (Complete Build Spec)

This is the single authoritative document. If you only hand an AI coding tool one file, hand it this one. It consolidates PRD, TRD, UI-UX, DATA-SCHEMA, and TASKS into one build-ready spec, plus full wireframes.

---

## 1. Project Summary

**What it is:** A single-page web app (`index.html`, zero backend) where a user enters a plot size + house requirements, the app matches it against a library of 20+ house templates, scales the best match to fit, validates it, scores it, and displays it in both 2D floor plan and 3D model — with export.

**Tech stack:** Vanilla HTML + CSS + JS in one file. Three.js (CDN) for 3D. HTML5 Canvas for 2D. No frameworks, no build step, no backend, no database.

**User in one sentence:** Someone with a plot of land and a rough house wishlist who wants an instant, visual, adjustable layout — not a final architectural drawing.

---

## 2. Full User Flow

```
START
  │
  ▼
[Screen 1: Plot Input] ──(Next)──▶ [Screen 2: Requirements] ──(Next)──▶ [Screen 3: Candidates]
  ▲                                        │                                     │
  └──────────────(Back)───────────────────┘                                     │
                                                                          (Select one)
                                                                                 ▼
                                                                     [Screen 4: Result View]
                                                                       (2D ⇄ 3D toggle)
                                                                                 │
                                                              ┌──────────────────┼──────────────────┐
                                                              ▼                  ▼                  ▼
                                                       Export JSON        Export PNG        Try Another Layout
                                                                                              (back to Screen 3)
```

---

## 3. Full Wireframes (ASCII, annotated)

### Screen 1 — Plot Input

```
┌──────────────────────────────────────────────────────────┐
│  🏠  3D House Design Generator                            │
├──────────────────────────────────────────────────────────┤
│                                                            │
│              STEP 1 OF 4 — Plot Size                      │
│                                                            │
│   ┌────────────────────────────────────────────────┐     │
│   │                                                  │     │
│   │   Width (ft)      [   30   ]                     │     │
│   │   Length (ft)     [   40   ]                     │     │
│   │                                                  │     │
│   │   Units:  ( • ft )  (  m  )                       │     │
│   │                                                  │     │
│   │   ┌──────────────────────────────┐              │     │
│   │   │                              │              │     │
│   │   │      [ live plot outline     │              │     │
│   │   │        drawn to scale ]      │              │     │
│   │   │                              │              │     │
│   │   └──────────────────────────────┘              │     │
│   │   Plot area: 1,200 sqft                          │     │
│   │                                                  │     │
│   └────────────────────────────────────────────────┘     │
│                                                            │
│                                    [ Next: Requirements →]│
└──────────────────────────────────────────────────────────┘
```
Notes: number inputs, inline red text below field if out of 15–100 ft range. Live outline redraws on every keystroke (debounced ~150ms).

---

### Screen 2 — Requirements

```
┌──────────────────────────────────────────────────────────┐
│  🏠  3D House Design Generator          [← Back]          │
├──────────────────────────────────────────────────────────┤
│              STEP 2 OF 4 — Requirements                   │
│                                                            │
│   BHK Count        ( 1 ) ( 2 ) [ 3 ] ( 4 ) ( 5 )          │
│                                                            │
│   Parking          [ None ] [ 1 Car ✓ ] [ 2 Car ]         │
│                                                            │
│   Kitchen Type     ( Closed )  [ Open ✓ ]                 │
│                                                            │
│   Extra Rooms      [✓ Pooja Room] [ Study ] [ Servant ]   │
│                                                            │
│   Facing Direction        ┌─────────┐                     │
│                           │    N    │                     │
│                           │  W  ⊙E✓ │  ← compass picker    │
│                           │    S    │                     │
│                           └─────────┘                     │
│                                                            │
│                                   [ Find Layouts → ]      │
└──────────────────────────────────────────────────────────┘
```
Notes: button-group / segmented-control style (not dropdowns) — faster to scan and tap. Compass picker is a simple 4-quadrant clickable SVG or 4 buttons arranged in a plus shape; a dropdown is an acceptable fallback if the compass is too fiddly to build first.

---

### Screen 3 — Candidate Selection

```
┌──────────────────────────────────────────────────────────┐
│  🏠  3D House Design Generator          [← Back]          │
├──────────────────────────────────────────────────────────┤
│         STEP 3 OF 4 — Choose Your Layout                  │
│                                                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ [thumbnail]   │ │ [thumbnail]   │ │ [thumbnail]   │   │
│  │               │ │               │ │               │   │
│  │ 3BHK North    │ │ 3BHK Compact  │ │ 3BHK Open     │   │
│  │ ●●●●●○ 87%    │ │ ●●●●○○ 71%    │ │ ●●●○○○ 58%    │   │
│  │ 3BHK·Parking  │ │ 3BHK·Parking  │ │ 3BHK·No Park  │   │
│  │  [ Select ]   │ │  [ Select ]   │ │  [ Select ]   │   │
│  └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                            │
│                    [ ⚡ Auto-pick best match ]             │
│                                                            │
│                                   [ Use This Layout → ]   │
│                                    (disabled until picked) │
└──────────────────────────────────────────────────────────┘
```
Notes: score badge color — green ≥80%, yellow 50–79%, red <50%. Selected card gets a highlighted border + checkmark overlay.

---

### Screen 4 — Result View

```
┌──────────────────────────────────────────────────────────┐
│  🏠  3D House Design Generator      [← Edit Requirements] │
├──────────────────────────────────────────────────┬───────┤
│                                        [ 2D | 3D ]│ SCORE │
│  ┌──────────────────────────────────────────────┐│  84   │
│  │                                                ││ /100  │
│  │                                                │├───────┤
│  │         [ 2D FLOOR PLAN                       ││ROOMS  │
│  │           or                                  ││Bed1   │
│  │           3D VIEWPORT — drag to rotate ]      ││120sqft│
│  │                                                ││Bed2   │
│  │                                                ││100sqft│
│  │                                                ││Kitchen│
│  │                                                ││ 80sqft│
│  │                                                │├───────┤
│  │                                                ││CHECKS │
│  │                                                ││✓ Rooms│
│  │                                                ││✓ Bound│
│  │                                                ││⚠ Hall │
│  │                                                ││  width│
│  └──────────────────────────────────────────────┘│narrow │
├────────────────────────────────────────────────────┴───────┤
│  [⬇ Export JSON]  [⬇ Export PNG]  [↻ Try Another Layout]  │
└──────────────────────────────────────────────────────────┘
```
Notes: right sidebar collapses to a bottom expandable drawer on mobile (<768px width). Canvas area always takes remaining space (flex-grow).

---

## 4. Complete File/Folder Structure

```
house-design-generator/
├── index.html              ← everything: HTML + CSS + JS in one file
├── templates.js             ← OPTIONAL split-out: 20+ template data objects
│                               (only if index.html exceeds ~2000 lines)
├── README.md
├── MASTER-SPEC.md            ← this file
├── PRD.md
├── TRD.md
├── UI-UX.md
├── DATA-SCHEMA.md
└── TASKS.md
```
Everything the app needs to run is `index.html` (+ optionally `templates.js`). The `.md` files are documentation only — never loaded by the browser.

---

## 5. Visual Style Guide

| Element | Value |
|---|---|
| Background | `#F7F5F2` (off-white) |
| Primary text | `#2B2B2B` (charcoal) |
| Accent (CTAs, score-good) | `#1F8A70` (teal) |
| Warning | `#E0A800` (amber) |
| Error/low-score | `#D64545` (muted red) |
| Card background | `#FFFFFF` with `1px solid #E2E0DC` border |
| Canvas/blueprint background | `#EEF1F0` with faint grid lines every 20px |
| Font | System font stack: `-apple-system, "Segoe UI", Roboto, sans-serif` |
| Headings | Semi-bold, slightly letter-spaced for step titles |
| Corner radius | 8px on cards/buttons, 4px on inputs |

---

## 6. Complete Data Schema

(Full detail lives in DATA-SCHEMA.md — summarized here for completeness.)

```js
Template = {
  id, name, bhk, hasParking, facing, referencePlot: {width, length},
  rooms: [ { id, name, type, x, y, w, h, doors: [{wall, offset, width}], windows: [...] } ]
}
```
- `type` enum: `bedroom | kitchen | bathroom | hall | dining | parking | pooja | study | servant | balcony | passage`
- `wall` enum: `north | south | east | west`
- Origin (0,0) = plot's bottom-left corner.

---

## 7. The 20 Templates To Build (checklist for content creation)

Use this list as your authoring checklist — one row = one template object to write per DATA-SCHEMA.md format.

| # | BHK | Parking | Facing | Notes |
|---|---|---|---|---|
| 1 | 1 | No | N | Compact studio-style |
| 2 | 1 | Yes | E | Small plot with parking |
| 3 | 2 | No | N | Budget 2BHK |
| 4 | 2 | Yes | N | 2BHK standard |
| 5 | 2 | Yes | S | 2BHK south-facing |
| 6 | 2 | Yes | E | 2BHK with open kitchen |
| 7 | 2 | No | W | 2BHK narrow plot |
| 8 | 3 | Yes | N | 3BHK standard (most common — build this one first) |
| 9 | 3 | Yes | S | 3BHK south-facing |
| 10 | 3 | Yes | E | 3BHK with pooja room |
| 11 | 3 | No | W | 3BHK no-parking variant |
| 12 | 3 | Yes | N | 3BHK with study |
| 13 | 3 | Yes | S | 3BHK wide plot |
| 14 | 3 | Yes | E | 3BHK narrow plot |
| 15 | 4 | Yes | N | 4BHK standard |
| 16 | 4 | Yes | S | 4BHK with servant room |
| 17 | 4 | Yes | E | 4BHK with study + pooja |
| 18 | 4 | Yes | W | 4BHK wide plot |
| 19 | 5 | Yes | N | 5BHK large family layout |
| 20 | 5 | Yes | S | 5BHK with servant + study |

Recommendation: build template #8 (3BHK standard) first as your Phase 3 test case in TASKS.md, since it's the most common request and will surface schema issues early.

---

## 8. Engine Logic (complete pseudocode)

### Matcher
```
filter templates where bhk matches (±1 if none exact) AND parking matches if requested
score each remaining template:
  aspectScore = 1 - abs(userRatio - templateRatio) / max(ratio)   [0–1]
  facingScore = 1 if exact match, 0.5 if adjacent (N~E/W), 0 if opposite
  extrasScore = (# requested extras present) / (# requested extras)
  total = aspectScore*0.5 + facingScore*0.3 + extrasScore*0.2
sort descending, return top 5
```

### Parametric scaling
```
scaleX = userPlot.width / template.referencePlot.width
scaleY = userPlot.length / template.referencePlot.length
for each room: x*=scaleX, y*=scaleY, w*=scaleX, h*=scaleY
```

### Constraint checks (each returns pass/warn + message)
```
minRoomSize(room)        — vs type-based minimum (bedroom≥90sqft, etc.)
withinPlotBounds(room, plot)
noOverlap(rooms)
hasDoor(room)
parkingPresent(rooms, requirements)
hallwayWidth(rooms)      — simplified check, flag if <3ft
```

### Scoring
```
finalScore = (constraintPassRate * 0.6 + matcherScore * 0.4) * 100
```

---

## 9. Edge Cases & QA Checklist
- [ ] No template matches requirements exactly → fall back to closest, show "No exact match — showing closest options" banner.
- [ ] Extreme plot aspect ratio (e.g. 15×100 ft) → show advisory banner, don't block.
- [ ] User enters plot size below/above allowed range → inline error, disable Next.
- [ ] Export/import round-trip: exported JSON, when re-imported, reproduces the identical layout.
- [ ] All 20 templates individually render without console errors before wiring up the matcher.
- [ ] Mobile: all 4 screens usable without horizontal scroll.

---

## 10. Kickoff Prompt (paste this into Antigravity / your agentic coding tool)

```
Build a single-file web app (index.html — HTML/CSS/JS only, no backend, no
build tools) called "3D Residential Design Generator" following the attached
MASTER-SPEC.md exactly: same user flow, same wireframe layouts, same data
schema, same engine logic, same visual style guide.

Use Three.js via CDN for the 3D view and HTML5 Canvas for the 2D floor plan.

Build it in the phase order listed in TASKS.md — complete and confirm each
phase works before moving to the next. Start with Phase 0 (skeleton) and
Phase 3 (one hardcoded template end-to-end, using the minimal valid example
from DATA-SCHEMA.md) before writing all 20 templates.

After each phase, briefly tell me what was completed and flag anything in
the spec that was ambiguous or needed a judgment call.
```

---

## 11. What "5% work" Actually Looks Like For You
Even with this spec, plan to:
1. Paste the kickoff prompt + attach these `.md` files.
2. Let it build Phase 0–3, then actually open `index.html` in a browser and look at it.
3. Point out anything visually wrong ("3D view is black", "rooms overlap") — the tool fixes faster with a specific note than a vague one.
4. Approve moving to the next phase.
5. Spot-check a handful of the 20 templates for sane layouts once generated.

That's the realistic 5% — reviewing, not writing.