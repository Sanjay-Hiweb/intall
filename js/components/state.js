    /* ==========================================================================
       STATE MANAGEMENT (TRD §6 & MASTER-SPEC)
       ========================================================================== */
    const state = {
      screen: 1,
      plot: {
        width: 35,
        length: 45,
        unit: "ft" // "ft" | "m"
      },
      plotShape: "standard", // "standard" | "narrow" | "wide" | "corner"
      requirements: {
        bhk: 3,
        baths: 2, // 1 | 2 | 3 | 4
        parking: "1car", // "none" | "1car" | "2car"
        kitchen: "closed", // "closed" | "open"
        archStyle: "minimalist", // "minimalist" | "scandinavian" | "craftsman" | "mediterranean"
        extras: [], // "pooja", "study", "servant"
        facing: "N", // "N", "S", "E", "W"
        houseType: "normal" // "normal" | "duplex"
      },
      houseType: "normal", // "normal" | "duplex"
      activeFloor: "ground", // "ground" | "first"
      view3DFloor: "both", // "both" (stacked 3D) | "ground" | "first"
      exploded3D: false, // 3D exploded view toggle
      candidateFilter: "all", // "all" | "normal" | "duplex"
      candidates: [],
      selectedCandidate: null,
      scaledRooms: null,
      originalRooms: null,
      roomAdjustments: {}, // { [roomId]: { dw: 0, dh: 0, doorWall: null } }
      selectedRoomId: null,
      checks: [],
      score: 85,
      view: "2d-schematic", // "2d-schematic" | "2d-furnished" | "3d"
      hoveredRoomId: null
    };

    // Color Palette for 2D room fills (Architectural Drafting Table Paper)
    const ROOM_COLORS = {
      hall: "rgba(240, 234, 222, 0.85)",
      dining: "rgba(244, 240, 230, 0.85)",
      bedroom: "rgba(226, 236, 233, 0.85)",
      kitchen: "rgba(248, 234, 225, 0.85)",
      bathroom: "rgba(222, 238, 244, 0.85)",
      parking: "rgba(235, 233, 228, 0.8)",
      pooja: "rgba(252, 243, 220, 0.9)",
      study: "rgba(238, 235, 225, 0.85)",
      servant: "rgba(232, 230, 224, 0.85)",
      balcony: "rgba(228, 242, 232, 0.85)",
      passage: "rgba(245, 242, 234, 0.8)",
      stairs: "rgba(232, 230, 225, 0.9)",
      void: "rgba(220, 218, 210, 0.6)"
    };
