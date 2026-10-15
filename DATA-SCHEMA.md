# DATA-SCHEMA.md — House Template Data Format

This is the exact structure every one of your 20+ templates must follow. Treat this as the source of truth — if a template doesn't match this shape, the engines will silently misbehave (wrong scaling, missing walls, bad scores) rather than obviously crash.

## Template Object

```js
{
  id: "t01",                 // unique string, sequential (t01, t02, ...)
  name: "Compact 2BHK - North Facing",  // human-readable, shown on candidate cards
  bhk: 2,                    // integer, bedroom count (hall+kitchen implied)
  hasParking: true,          // boolean
  facing: "N",               // one of "N" | "S" | "E" | "W"
  referencePlot: {
    width: 30,                // ft, the X dimension this template was designed for
    length: 40                // ft, the Y dimension
  },
  rooms: [ /* array of Room objects, see below */ ]
}
```

## Room Object

```js
{
  id: "bed1",                 // unique within this template
  name: "Bedroom 1",           // shown as label on 2D plan
  type: "bedroom",             // one of the enum values below — used by constraint engine
  x: 0,                        // ft, distance from plot's left edge to room's left edge
  y: 0,                        // ft, distance from plot's bottom edge to room's bottom edge
  w: 12,                       // ft, room width
  h: 10,                       // ft, room height
  doors: [
    { wall: "south", offset: 4, width: 3 }
  ],
  windows: [
    { wall: "north", offset: 4, width: 3 }
  ]
}
```

### `type` enum (used by constraint engine for minimum-size rules)
`bedroom | kitchen | bathroom | hall | dining | parking | pooja | study | servant | balcony | passage`

### `wall` enum (for doors/windows — which edge of the room's rectangle)
`north | south | east | west`
- `offset`: distance in ft from that wall's starting corner to the door/window's start.
- `width`: door/window opening width in ft.

## Rules Every Template Must Follow
1. **Origin convention:** (0,0) is always the bottom-left corner of the plot. All room `x`/`y` are positive, measured from there.
2. **No room may exceed `referencePlot` bounds:** `room.x + room.w <= referencePlot.width` and `room.y + room.h <= referencePlot.length`.
3. **No two rooms may overlap** (their rectangles must not intersect) — this is what `checkNoOverlap` validates, but templates should already satisfy it by construction.
4. **Every room must have at least one door** — either to another room or to the exterior.
5. **`parking` is stored as a room** (type: `parking`), even though it's technically outdoor space — this lets it flow through the same geometry/scoring pipeline as everything else.
6. **Minimum size guidance when authoring templates** (matches constraint engine defaults):
   - `bedroom` ≥ 90 sqft
   - `bathroom` ≥ 25 sqft
   - `kitchen` ≥ 60 sqft
   - `hall` ≥ 120 sqft
7. **`id` values must be unique within the template**, but can repeat across different templates (e.g. every template can have a room with `id: "bed1"`).

## Minimal Valid Example (for testing the pipeline before writing all 20)

```js
{
  id: "t00",
  name: "Test Template",
  bhk: 1,
  hasParking: false,
  facing: "N",
  referencePlot: { width: 20, length: 20 },
  rooms: [
    { id: "hall1", name: "Hall", type: "hall", x: 0, y: 0, w: 20, h: 12,
      doors: [{ wall: "south", offset: 8, width: 3 }], windows: [] },
    { id: "bed1", name: "Bedroom 1", type: "bedroom", x: 0, y: 12, w: 10, h: 8,
      doors: [{ wall: "south", offset: 3, width: 3 }], windows: [{ wall: "north", offset: 2, width: 3 }] },
    { id: "bath1", name: "Bathroom", type: "bathroom", x: 10, y: 12, w: 5, h: 5,
      doors: [{ wall: "south", offset: 1, width: 2.5 }], windows: [] },
    { id: "kitchen1", name: "Kitchen", type: "kitchen", x: 10, y: 17, w: 10, h: 3,
      doors: [{ wall: "west", offset: 0, width: 3 }], windows: [{ wall: "north", offset: 3, width: 3 }] }
  ]
}
```
Use this exact object as your Phase 3 "one hardcoded template" test case from TASKS.md — it's already valid against every rule above.

## Batch-Authoring the Remaining 19+ Templates
When generating more templates (by hand or via AI assistance), always:
1. Pick a `referencePlot` size and a BHK count first.
2. Lay out rooms on paper/grid first, checking rule #2 and #3 by eye.
3. Convert to the object format.
4. Validate programmatically (write one small `validateTemplate(t)` helper function that checks rules 1–7 automatically) — cheaper than debugging visually per template.