# 3D Residential Design Generator (Intall)

A single-page architectural web application that generates parametric floor plans based on plot dimensions and user requirements. Viewable in both responsive 2D blueprint and interactive 3D perspective, featuring municipal building code compliance auditing, bill of materials (BOM) cost estimation, and local SQLite plan persistence.

## Features
- **Parametric Plot & Requirements Input**: Custom width, length, BHK count, architectural styles, and directional facing.
- **Interactive 2D Blueprint & 3D Orbit View**: Rendered using Three.js with real-time room and wall geometry scaling.
- **BOM Cost Takeoff Engine**: Automated calculation of built-up area, masonry, concrete, flooring, fixtures, and estimated cost per sqft.
- **Municipal Building Code Compliance**: Real-time auditing for setbacks, ground coverage, room dimension minimums, and ventilation.
- **Plan Revision & Persistence**: Persistent storage with revision history using Node 22 built-in SQLite or JSON fallback.
- **Export & Import**: Export blueprints as PNG snapshots, download JSON specifications, or import existing designs.

## Quick Start
No complex build steps or dependencies required!

### Option 1: Standalone Client
Open `index.html` or `home.html` directly in any modern browser.

### Option 2: Full Architecture Server (with SQLite & API endpoints)
Run with Node.js (v22+ recommended):
```bash
node server.js
```
Then visit: `http://localhost:8000`

## Project Structure
- `index.html` — Main interactive 2D/3D design application.
- `home.html` — Landing page and showcase viewer.
- `server.js` — High-performance zero-dependency backend server.
- `src/auditEngine.js` — Municipal bylaws compliance audit engine.
- `src/bomEngine.js` — Bill of materials and cost estimation engine.
- `src/planStorage.js` — SQLite and JSON plan storage and revision manager.
- `data/building-codes.json` — Municipal building regulations dataset.
- `data/materials.json` — Material specifications and unit cost rate cards.
- `templates.js` — Parametric floor plan template library.
- `MASTER-SPEC.md` / `PRD.md` / `TRD.md` — Product and technical architecture documentation.

## Walkthrough Module

The first-person architectural walkthrough module lets clients and architects navigate generated 3D homes with physical presence, realistic scale, and fluid movement.

### Architecture & Components
- **Room Graph (`src/walkthrough/graph.ts` / `.js`)**:
  - Builds an adjacency graph memoized by project revision.
  - Generates nodes for each room (with polygon/AABB bounds, floor elevations, and focal viewpoints) and door edges with 0.6 m pre/post-doorway waypoints to prevent corner clipping.
  - Automatically identifies unreachable rooms (no door path from entrance) and marks them with an interactive warning badge.
- **Character Controller (`src/walkthrough/controller.ts` / `.js`)**:
  - First-person camera with 1.6 m eye height above floor level, Pointer Lock mouse look (with click-and-drag fallback), and frame-rate independent movement.
  - Smooth acceleration/deceleration at ~1.4 m/s walk speed and 1.8x sprint.
- **Collision & Sliding (`src/walkthrough/collision.ts` / `.js`)**:
  - Capsule collider ($r = 0.25\text{ m}$, $h = 1.7\text{ m}$) evaluated across 3 sub-steps.
  - Slides cleanly along walls, closed doors, furniture bounding boxes, and plot boundaries without tunneling.
- **Walkable Stairs (`src/walkthrough/stairs.ts` / `.js`)**:
  - Smooth elevation interpolation (150 ms per step profile with subtle camera dip) matching standard architectural risers.
  - Automatic floor elevation updates ('ground' $\leftrightarrow$ 'first'), level switch toasts, and minimap synchronisation.
- **Auto-Walk & Guided Tour (`src/walkthrough/autowalk.ts` & `tour.ts`)**:
  - Shortest pathfinding via BFS/A* across room graph door waypoints.
  - Guided architectural tour following natural sequences (Entrance $\to$ Living $\to$ Dining $\to$ Kitchen $\to$ Bedrooms $\to$ Stairs $\to$ Upper Terrace) with 4 s hold times and focal viewpoint orientation. Any key press or mouse move instantly yields control back to the user.
- **Room Awareness, HUD & Minimap (`src/walkthrough/hud.js`, `minimap.js`, `settings.js`)**:
  - Point-in-polygon room detection with 0.3 m doorway hysteresis.
  - Bottom-center room badge displaying formatted dimensions in user unit (`ft` or `m`).
  - Top-left HUD status pill with current level and room name.
  - 210 px vector minimap with player heading indicator, room labels, and click-to-walk.

### Desktop Controls
| Key / Input | Action |
| :--- | :--- |
| **W, A, S, D** / Arrows | Move forward, left, backward, right |
| **Mouse Look** | Look around (Pointer Lock on click; Esc to release; drag fallback) |
| **Shift** | Sprint (1.8x speed boost) |
| **E** | Open / Close door within 1.5 m (animates smoothly over 450 ms) |
| **Q / Z** | Climb / Descend stairs manually |
| **L** | Toggle Room List drawer (click any room to auto-walk) |
| **M** | Toggle vector Minimap |
| **T** | Start / Stop Guided Architectural Tour |
| **[ / ]** | Previous / Next room in tour sequence |
| **Tab** | Toggle HUD overlays |
| **H / ?** | Open / Close Controls & Help card |
| **P / Esc** | Exit Walkthrough and restore OrbitControls camera |

### Settings Popover
- **Mouse Sensitivity**: Slider from 0.0005 to 0.006 (default 0.002).
- **Invert Y-Axis**: Toggleable mouse pitch inversion.
- **Field of View (FOV)**: Slider from 60° to 90° (default 70°).
- **Instant Jump**: Option to jump with a 150 ms black fade instead of auto-walking.
- **Tour Hold Duration**: Configurable inspection time per room (2 to 10 seconds).

