# TRD — 3D Residential Design Generator (v1.0)

## 1. Architecture Summary
Single `index.html` file containing HTML + CSS + JS. No backend, no build tools, no npm install. External libraries loaded via CDN `<script>` tags. All template data embedded as JS objects in the same file (or a second `templates.js` file if it gets too large — see §7).

```
index.html
 ├── <style> ... </style>              (all CSS, inline)
 ├── <div id="app"> ... </div>         (UI markup)
 └── <script> ... </script>            (all JS: data + engines + rendering)
```

## 2. Libraries (all via CDN, no install step)
| Library | Purpose | CDN |
|---|---|---|
| Three.js (r150+) | 3D scene, meshes, camera, lighting | `unpkg.com/three@<version>/build/three.module.js` |
| OrbitControls | Mouse drag/zoom for 3D view | Three.js `examples/jsm/controls/OrbitControls.js` |
| (Optional) dat.GUI or plain HTML | Debug/tweak panel during dev | `unpkg.com/dat.gui` |

No React/Vue needed — vanilla JS with direct DOM manipulation keeps it a true single file and matches your existing HTML/CSS/JS workflow.

## 3. Data Model

### 3.1 Template object shape
```js
{
  id: "t01",
  name: "Compact 2BHK - North Facing",
  bhk: 2,
  hasParking: true,
  facing: "N",
  referencePlot: { width: 30, length: 40 }, // ft
  rooms: [
    { id: "bed1", name: "Bedroom 1", x: 0, y: 0, w: 12, h: 10,
      doors: [{ wall: "south", offset: 4, width: 3 }],
      windows: [{ wall: "north", offset: 4, width: 3 }] },
    { id: "kitchen", name: "Kitchen", x: 12, y: 0, w: 10, h: 8, doors: [...], windows: [...] },
    // ... etc, one entry per room including parking as a "room"
  ]
}
```
All coordinates are in feet, relative to the template's own `referencePlot`. Origin (0,0) = bottom-left corner of plot.

### 3.2 User input object shape
```js
{
  plot: { width: 30, length: 40, unit: "ft" },
  requirements: { bhk: 3, parking: "1car", kitchen: "open",
                  extras: ["pooja"], facing: "E" }
}
```

## 4. Engine Specs

### 4.1 Template Matcher
- **Input:** user requirements + template library array.
- **Step 1 (hard filter):** keep templates where `bhk === requirements.bhk` (or ±1 if no exact match) and `hasParking` matches if parking requested.
- **Step 2 (soft score):** for remaining templates, score = `aspectRatioScore * 0.5 + facingScore * 0.3 + extrasScore * 0.2`.
  - `aspectRatioScore`: 1 − abs(userRatio − templateRatio) / max(ratio), clamped 0–1.
  - `facingScore`: 1 if facing matches, 0.5 if adjacent direction, 0 otherwise.
  - `extrasScore`: fraction of requested extra rooms present in template.
- **Output:** top 5 templates sorted descending by score.

### 4.2 Parametric Engine
```js
function scaleTemplate(template, userPlot) {
  const scaleX = userPlot.width / template.referencePlot.width;
  const scaleY = userPlot.length / template.referencePlot.length;
  return template.rooms.map(r => ({
    ...r,
    x: r.x * scaleX, y: r.y * scaleY,
    w: r.w * scaleX, h: r.h * scaleY
  }));
}
```
Non-uniform scaling is intentional (v1) — keeps every room touching its original relative position. Note in code comments that this can distort room proportions on extreme aspect-ratio changes; flagged by the constraint engine (§4.3).

### 4.3 Geometry Engine
- Converts each scaled room into wall line segments (4 per rectangular room).
- Merges shared walls between adjacent rooms (optional in v1; can render duplicate overlapping walls initially, refine later).
- Produces a flat array of `{ x1, y1, x2, y2, type: "wall" }` plus door/window gap markers, consumed identically by both the 2D and 3D renderers.

### 4.4 Constraint Engine
Pure functions, each returns `{ pass: bool, message: string }`:
- `checkMinRoomSize(room)`
- `checkWithinPlotBounds(room, plot)`
- `checkNoOverlap(rooms)`
- `checkHasDoor(room)`
- `checkParkingPresent(rooms, requirements)`
- `checkHallwayWidth(rooms)` (simplified — v1 can approximate)

All run in a loop; results collected into an array shown as pass/warning badges.

### 4.5 Scoring Engine
```js
finalScore = (constraintPassRate * 0.6 + matcherScore * 0.4) * 100
```

### 4.6 2D Renderer
- HTML5 `<canvas>`, scale feet → pixels via a fixed `PIXELS_PER_FOOT` constant.
- Draw walls as lines, rooms as filled rects with labels, doors/windows as gaps or colored ticks.

### 4.7 3D Renderer
- Three.js `Scene`, `PerspectiveCamera`, `OrbitControls`.
- Walls: `BoxGeometry` extruded from 2D wall segments (height constant, e.g. 9 ft).
- Floor: single `PlaneGeometry` sized to plot.
- Doors/windows: subtract via gap in wall segment generation (simplest: just leave a visual gap, no true boolean CSG in v1).
- Basic `AmbientLight` + `DirectionalLight`.

## 5. File Structure (recommended, still "single file" in spirit)
```
/index.html          → UI + CSS + all engine logic + render calls
/templates.js         → OPTIONAL: 20+ template objects, only split out if index.html gets unwieldy (>~2000 lines). Loaded via <script src="templates.js"></script> — still zero build step, still fully static.
```
If you want strictly one file: templates can stay embedded directly in `index.html` as a `const TEMPLATES = [...]` array — fully valid, just a longer file. Recommendation: start with one file; split templates out only once it hurts readability.

## 6. State Management
No framework needed. A single global JS object holds current state:
```js
const state = { plot: null, requirements: null, candidates: [], selected: null, scaledRooms: null, checks: [], score: null, view: "2d" };
```
Each step in the flow (§4 of PRD) mutates `state` then calls a `render()` function that redraws whichever screen is active.

## 7. Save/Export Implementation
- **Export JSON:** `JSON.stringify(state)` → Blob → `<a download>` trigger.
- **Import JSON:** `<input type="file">` → `FileReader` → `JSON.parse` → repopulate `state` → `render()`.
- **Export PNG:** `canvas.toDataURL('image/png')` → same download trigger pattern.
- **No localStorage dependency required for core function** (keeps it portable), though local autosave via `localStorage` is a reasonable nice-to-have.

## 8. Build Order (recommended implementation sequence)
1. Static page shell: input form → requirements form → "results" placeholder screen.
2. Hardcode 1 template, render it in 2D canvas at fixed size (no scaling yet).
3. Add parametric scaling — confirm the same template resizes correctly for different plot inputs.
4. Add 3D renderer for that same one template.
5. Add constraint engine, show pass/warning badges.
6. Expand template library to 20+.
7. Add matcher + scoring, wire up the candidate-selection screen.
8. Add save/export.
9. Polish UI/UX per UI-UX.md.

## 9. Known Technical Risks
- **Non-uniform scaling distortion:** extreme plot aspect ratios will stretch rooms oddly. Mitigation: constraint engine flags rooms whose resulting aspect ratio deviates too far from a "sane" range (e.g. 1:3).
- **Wall-merging complexity:** true architectural wall-joining (shared walls, no double-thickness) is non-trivial geometry. v1 can tolerate visually-overlapping walls; treat clean merging as a v2 polish item.
- **Door/window cutouts in 3D:** true boolean subtraction (CSG) is expensive and fiddly in Three.js. v1 approximation (visual gap in wall segment, no real hole) is acceptable and much simpler.