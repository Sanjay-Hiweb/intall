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
