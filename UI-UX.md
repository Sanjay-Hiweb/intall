# UI/UX — 3D Residential Design Generator (v1.0)

## 1. Design Principles
- **Wizard, not a dashboard.** One clear step at a time — plot → requirements → candidates → result. No overwhelming single-page form.
- **Instant visual feedback.** Every input change that can be cheaply re-rendered (e.g. plot size) should update a live preview where feasible.
- **Never a dead end.** Constraint warnings are informative badges, not blocking errors — user can always proceed and view their layout.

## 2. Screen-by-Screen

### Screen 1 — Plot Size Input
- Big centered card: two number inputs (Width, Length) + unit toggle (ft/m).
- Live-updating plot outline preview (simple rectangle, drawn to scale) below the inputs.
- Primary button: "Next: Requirements →" (disabled until valid range entered).

### Screen 2 — Requirements
- BHK count: horizontal stepper or button group (1–5).
- Parking: segmented control (None / 1 Car / 2 Car).
- Kitchen type: toggle (Closed / Open).
- Extra rooms: checkbox chips (Pooja Room, Study, Servant Room).
- Facing direction: compass-style 4-direction picker (N/S/E/W) — visually a small compass icon is nicer than a dropdown here.
- Buttons: "← Back" / "Find Layouts →"

### Screen 3 — Candidate Selection
- Grid of 3–5 cards, each showing:
  - Small 2D thumbnail of the template (pre-scaled preview).
  - Match score badge (e.g. "87% match") — color-coded (green ≥80, yellow 50–79, red <50).
  - Key tags: "3BHK · Parking · Open Kitchen".
- Click a card to select → highlights it → "Use This Layout →" button becomes active.
- Optional: "Auto-pick best match" button for users who don't want to compare.

### Screen 4 — Result View
- Main canvas area (2D floor plan by default), full width.
- Top-right toggle: `[ 2D | 3D ]` switch.
- In 3D mode: same canvas area becomes the Three.js viewport, with drag-to-rotate, scroll-to-zoom hint text on first load.
- Right sidebar (collapsible on mobile):
  - Room list with individual areas (sqft).
  - Constraint check list: ✓ green / ⚠ yellow items with short messages.
  - Overall score, large and prominent (e.g. "Design Score: 84/100").
- Bottom action bar: "⬇ Export JSON" / "⬇ Export PNG" / "↻ Try Another Layout" / "← Edit Requirements".

## 3. Visual Style
- Clean, architectural feel: plenty of white space, thin borders, muted palette (charcoal, off-white, one accent color e.g. teal or amber for CTAs and score badges).
- Monospace or grid-paper-style background texture behind the 2D canvas reinforces the "blueprint" feeling — subtle, not distracting.
- Room labels on the 2D plan: small caps, centered in each room, with sqft below the name in a lighter weight.

## 4. Layout & Responsiveness
- Desktop-first (this is a planning tool, most likely used on a laptop/desktop), but the wizard steps stack cleanly on mobile:
  - Sidebar in Screen 4 collapses to a bottom drawer / expandable panel on narrow screens.
  - Candidate grid (Screen 3) goes from 3-across to 1-across on mobile.

## 5. Key Interaction Details
- **Plot input:** inline validation message appears under the field the moment an out-of-range value is entered (e.g. "Minimum width is 15 ft") — never a popup alert.
- **3D controls:** show a small floating hint ("Drag to rotate · Scroll to zoom") on first entry to 3D view, auto-dismiss after 3s or on first interaction.
- **Constraint badges:** hovering/tapping a ⚠ warning highlights the specific room on the canvas it refers to (nice-to-have, not required for v1 launch).
- **Export buttons:** show a brief toast ("Downloaded plan.json") rather than a modal, to keep flow uninterrupted.

## 6. Accessibility Notes
- All interactive controls (steppers, toggles, compass picker) must be operable via keyboard and have visible focus states.
- Color-coded score badges (green/yellow/red) should also carry a text label or icon, not rely on color alone.
- Sufficient contrast between room fill colors and room label text on the 2D plan.

## 7. Component Inventory (for build reference)
- `PlotInputCard`
- `RequirementsForm` (stepper, segmented control, chip group, compass picker)
- `CandidateCard` (thumbnail + score badge + tags)
- `ResultCanvas` (shared container, swaps 2D canvas ↔ 3D Three.js viewport)
- `ConstraintList` (pass/warning badges)
- `ScoreBadge`
- `ActionBar` (export/back/retry buttons)
- `ToastNotification`

## 8. Empty / Edge States
- **No template matches requirements at all:** show a friendly message ("No exact matches — showing closest options") and fall back to best-available candidates rather than a dead end.
- **Extreme plot ratio (very long & narrow):** result screen shows an extra advisory banner: "This plot shape may cause some rooms to look stretched — adjust requirements or proceed anyway."