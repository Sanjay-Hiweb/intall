# PRD — 3D Residential Design Generator (v1.0)

## 1. Overview
A single-page web app where a user enters a plot size and house requirements, and the app auto-generates a matching house layout — shown in both 2D floor plan and 3D view — pulled and adapted from a library of 20+ pre-designed templates.

**Target user:** Someone planning to build a house who wants a quick visual layout idea (not a licensed architect's final drawing).

**Platform:** Single `index.html` file. Runs entirely in-browser, no backend, no build step.

---

## 2. Problem Statement
People planning a home construction have a plot size and a rough wishlist (3BHK, parking, one bathroom per floor, etc.) but no easy way to see a real, believable layout without hiring a draftsman. This tool gives an instant, adjustable starting point.

---

## 3. Goals (v1)
- User can input plot dimensions and pick requirements.
- App finds the best-matching template(s) from a library of 20+ designs.
- App scales the chosen template to fit the user's exact plot.
- App shows the result as a 2D floor plan and a 3D model.
- App flags basic problems (room too small, doesn't fit plot, etc.).
- User can save/export their result.

## Out of Scope (v1)
- Structural/engineering validation (load-bearing calculations, foundation design).
- Multi-story buildings (v1 = single floor only; multi-floor is v2).
- Real Vastu/feng-shui expert validation — only basic directional preference tagging.
- User-drawn custom rooms (v1 is template-based only, not freeform drafting).
- Login/accounts/cloud save (v1 = local save only).

---

## 4. User Flow
1. **Landing / Input Screen** — user enters plot size (width × length, ft or m).
2. **Requirements Screen** — user picks BHK count, parking (yes/no), floors (v1 = 1), kitchen type, preferences (Vastu-facing, open kitchen, etc.) via simple selectors.
3. **Matching** — app filters/scores the template library, shows top 3–5 candidate layouts as thumbnails with match scores.
4. **Selection** — user picks one candidate (or the app auto-picks the top score).
5. **Adjustment** — app scales the chosen template's rooms to the user's exact plot size.
6. **Validation** — app runs constraint checks, shows pass/warn indicators.
7. **Result View** — 2D floor plan (default) with a toggle to 3D view.
8. **Save/Export** — download as JSON (re-loadable) and/or PNG snapshot of the plan.

---

## 5. Functional Requirements

### 5.1 Plot Input
- Width and length in feet (toggle to meters).
- Minimum/maximum bounds (e.g. 15×20 ft to 100×100 ft) with inline validation.

### 5.2 Requirements Input
- BHK count: 1–5 (bedrooms + hall + kitchen shorthand).
- Parking: none / 1 car / 2 car.
- Kitchen: closed / open.
- Extra rooms: pooja room, study, servant room (checkboxes).
- Facing direction: N / S / E / W (for basic Vastu tagging).

### 5.3 Template Library
- Minimum 20 templates.
- Each template tagged with: BHK count, has-parking, plot aspect ratio range it suits, facing direction it's optimized for.
- Each template stores room list: name, x, y, width, height, and door/window positions, all defined against a reference plot size.

### 5.4 Template Matcher
- Filters templates by hard requirements (BHK count, parking).
- Scores remaining templates by aspect-ratio closeness and facing-direction match.
- Returns ranked top 3–5.

### 5.5 Parametric Engine
- Scales every room's coordinates from the template's reference plot size to the user's actual plot size (independent X and Y scale factors).

### 5.6 Geometry Engine
- Converts scaled room data into drawable wall segments, door gaps, and window gaps for both the 2D canvas and the 3D scene.

### 5.7 Constraint / Rule Engine
Checks and flags (pass / warning, not hard blocks in v1):
- Minimum room sizes (e.g. bedroom ≥ 90 sqft, bathroom ≥ 25 sqft).
- All rooms within plot boundary.
- No overlapping rooms.
- Every room has at least one door.
- Parking area present if requested.
- Basic accessibility (main door not blocked, hallway width minimum).
- Facing-direction preference match (informational, not a hard rule).

### 5.8 Scoring Engine
- Weighted score combining: constraint pass rate, requirement match, facing-direction match.
- Displayed as a single 0–100 score per candidate.

### 5.9 2D View
- Top-down canvas/SVG drawing: walls, room labels, room area (sqft), doors, windows.

### 5.10 3D View
- Three.js scene: extruded walls, floor, simple door/window cutouts, orbit camera control.
- Toggle button between 2D and 3D.

### 5.11 Save / Export
- Export current layout as downloadable JSON.
- Load a previously exported JSON back into the app.
- Export 2D plan as PNG.

---

## 6. Success Criteria (v1)
- 20+ templates loaded and selectable.
- A user can go from plot input to a rendered 2D + 3D layout in under 60 seconds, no page reload.
- Constraint engine correctly flags at least: undersized room, room outside plot boundary, missing parking when requested.
- Works fully offline after first load (except CDN library fetch).

---

## 7. Assumptions & Constraints
- Single floor only in v1.
- Rectangular plots only in v1 (irregular plot shapes = later version).
- No real-time collaboration or multi-user features.
- Templates are static, hand-authored data — no AI generation of new templates in v1.