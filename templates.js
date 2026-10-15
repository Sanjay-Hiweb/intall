/**
 * 3D Residential Design Generator — Templates Library
 * 20+ Curated Architectural Floor Plan Templates
 * Conforming strictly to DATA-SCHEMA.md
 */

const TEMPLATES = [
  // 1. Compact 1BHK Studio - North Facing
  {
    id: "t01",
    name: "1BHK Compact Studio",
    bhk: 1,
    hasParking: false,
    facing: "N",
    referencePlot: { width: 22, length: 26 }, // 572 sqft
    rooms: [
      {
        id: "hall", name: "Living / Hall", type: "hall",
        x: 0, y: 0, w: 14, h: 14,
        doors: [{ wall: "north", offset: 5, width: 3.5 }],
        windows: [{ wall: "south", offset: 3, width: 4 }, { wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "kitchen", name: "Kitchen", type: "kitchen",
        x: 14, y: 0, w: 8, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 3 }]
      },
      {
        id: "bath1", name: "Bathroom", type: "bathroom",
        x: 14, y: 10, w: 8, h: 5,
        doors: [{ wall: "west", offset: 2, width: 2.5 }],
        windows: [{ wall: "east", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Master Bedroom", type: "bedroom",
        x: 0, y: 14, w: 14, h: 12,
        doors: [{ wall: "south", offset: 2, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "balcony", name: "Balcony", type: "balcony",
        x: 14, y: 15, w: 8, h: 11,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 2, width: 4 }]
      }
    ]
  },

  // 2. 1BHK with Parking - East Facing
  {
    id: "t02",
    name: "1BHK Garden Suite with Parking",
    bhk: 1,
    hasParking: true,
    facing: "E",
    referencePlot: { width: 24, length: 32 }, // 768 sqft
    rooms: [
      {
        id: "parking", name: "Parking Port", type: "parking",
        x: 0, y: 0, w: 11, h: 16,
        doors: [{ wall: "south", offset: 1, width: 9 }],
        windows: []
      },
      {
        id: "hall", name: "Living Room", type: "hall",
        x: 11, y: 0, w: 13, h: 16,
        doors: [{ wall: "east", offset: 5, width: 3.5 }, { wall: "west", offset: 6, width: 3 }],
        windows: [{ wall: "east", offset: 10, width: 4 }]
      },
      {
        id: "kitchen", name: "Kitchen", type: "kitchen",
        x: 13, y: 16, w: 11, h: 9,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 3 }]
      },
      {
        id: "bath1", name: "Bathroom", type: "bathroom",
        x: 7, y: 16, w: 6, h: 7,
        doors: [{ wall: "north", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bed1", name: "Bedroom", type: "bedroom",
        x: 0, y: 23, w: 13, h: 9,
        doors: [{ wall: "south", offset: 8, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "west", offset: 3, width: 3 }]
      },
      {
        id: "dining", name: "Dining Space", type: "dining",
        x: 0, y: 16, w: 7, h: 7,
        doors: [{ wall: "south", offset: 2, width: 3 }],
        windows: [{ wall: "west", offset: 2, width: 3 }]
      },
      {
        id: "balcony", name: "Utility / Balcony", type: "balcony",
        x: 13, y: 25, w: 11, h: 7,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }]
      }
    ]
  },

  // 3. 2BHK Budget - North Facing (No Parking)
  {
    id: "t03",
    name: "2BHK Budget Starter",
    bhk: 2,
    hasParking: false,
    facing: "N",
    referencePlot: { width: 26, length: 36 }, // 936 sqft
    rooms: [
      {
        id: "hall", name: "Living Hall", type: "hall",
        x: 0, y: 0, w: 15, h: 16,
        doors: [{ wall: "north", offset: 5, width: 3.5 }],
        windows: [{ wall: "south", offset: 4, width: 5 }, { wall: "west", offset: 4, width: 4 }]
      },
      {
        id: "kitchen", name: "Kitchen", type: "kitchen",
        x: 15, y: 0, w: 11, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "south", offset: 3, width: 4 }, { wall: "east", offset: 3, width: 3 }]
      },
      {
        id: "dining", name: "Dining Area", type: "dining",
        x: 15, y: 10, w: 11, h: 8,
        doors: [{ wall: "west", offset: 2, width: 3 }],
        windows: [{ wall: "east", offset: 2, width: 3 }]
      },
      {
        id: "bath1", name: "Common Bath", type: "bathroom",
        x: 9, y: 16, w: 6, h: 6,
        doors: [{ wall: "south", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bath2", name: "Attached Bath", type: "bathroom",
        x: 16, y: 18, w: 6, h: 6,
        doors: [{ wall: "west", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bed1", name: "Master Bedroom", type: "bedroom",
        x: 0, y: 22, w: 14, h: 14,
        doors: [{ wall: "south", offset: 5, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bed2", name: "Second Bedroom", type: "bedroom",
        x: 14, y: 24, w: 12, h: 12,
        doors: [{ wall: "south", offset: 3, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "east", offset: 3, width: 4 }]
      }
    ]
  },

  // 4. 2BHK Standard with Parking - North Facing
  {
    id: "t04",
    name: "2BHK Standard Comfort",
    bhk: 2,
    hasParking: true,
    facing: "N",
    referencePlot: { width: 30, length: 40 }, // 1200 sqft
    rooms: [
      {
        id: "parking", name: "Covered Parking", type: "parking",
        x: 0, y: 0, w: 12, h: 16,
        doors: [{ wall: "south", offset: 1.5, width: 9 }],
        windows: []
      },
      {
        id: "hall", name: "Main Living Room", type: "hall",
        x: 12, y: 0, w: 18, h: 18,
        doors: [{ wall: "south", offset: 5, width: 3.5 }, { wall: "west", offset: 8, width: 3 }],
        windows: [{ wall: "south", offset: 10, width: 5 }, { wall: "east", offset: 6, width: 4 }]
      },
      {
        id: "kitchen", name: "Modular Kitchen", type: "kitchen",
        x: 19, y: 18, w: 11, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "dining", name: "Dining Hall", type: "dining",
        x: 9, y: 18, w: 10, h: 10,
        doors: [{ wall: "south", offset: 3, width: 3 }],
        windows: []
      },
      {
        id: "bath1", name: "Common Bathroom", type: "bathroom",
        x: 0, y: 16, w: 9, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bath2", name: "Attached Bathroom", type: "bathroom",
        x: 0, y: 22, w: 9, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Master Bedroom", type: "bedroom",
        x: 0, y: 28, w: 15, h: 12,
        doors: [{ wall: "east", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "west", offset: 4, width: 4 }]
      },
      {
        id: "bed2", name: "Bedroom 2", type: "bedroom",
        x: 15, y: 28, w: 15, h: 12,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 4, width: 4 }]
      }
    ]
  },

  // 5. 2BHK South-Facing with Parking
  {
    id: "t05",
    name: "2BHK South Sun Villa",
    bhk: 2,
    hasParking: true,
    facing: "S",
    referencePlot: { width: 30, length: 40 }, // 1200 sqft
    rooms: [
      {
        id: "parking", name: "Car Porch", type: "parking",
        x: 18, y: 0, w: 12, h: 16,
        doors: [{ wall: "south", offset: 1.5, width: 9 }],
        windows: []
      },
      {
        id: "hall", name: "Living / Family Lounge", type: "hall",
        x: 0, y: 0, w: 18, h: 18,
        doors: [{ wall: "south", offset: 6, width: 3.5 }],
        windows: [{ wall: "south", offset: 2, width: 4 }, { wall: "west", offset: 5, width: 4 }]
      },
      {
        id: "kitchen", name: "Agni Kitchen", type: "kitchen",
        x: 18, y: 16, w: 12, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "dining", name: "Dining Space", type: "dining",
        x: 6, y: 18, w: 12, h: 8,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: []
      },
      {
        id: "bath1", name: "Guest Bathroom", type: "bathroom",
        x: 0, y: 18, w: 6, h: 7,
        doors: [{ wall: "east", offset: 2, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bath2", name: "Master Bath", type: "bathroom",
        x: 0, y: 25, w: 6, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Master Bedroom", type: "bedroom",
        x: 0, y: 31, w: 15, h: 9,
        doors: [{ wall: "south", offset: 6, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "west", offset: 2, width: 3 }]
      },
      {
        id: "bed2", name: "Guest Bedroom", type: "bedroom",
        x: 15, y: 26, w: 15, h: 14,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 4, width: 4 }]
      }
    ]
  },

  // 6. 2BHK East-Facing with Open Kitchen
  {
    id: "t06",
    name: "2BHK Open-Concept Sunrise",
    bhk: 2,
    hasParking: true,
    facing: "E",
    referencePlot: { width: 28, length: 42 }, // 1176 sqft
    rooms: [
      {
        id: "parking", name: "Driveway Parking", type: "parking",
        x: 0, y: 0, w: 12, h: 17,
        doors: [{ wall: "south", offset: 1.5, width: 9 }],
        windows: []
      },
      {
        id: "hall", name: "Great Living Room", type: "hall",
        x: 12, y: 0, w: 16, h: 20,
        doors: [{ wall: "east", offset: 7, width: 3.5 }, { wall: "west", offset: 8, width: 3 }],
        windows: [{ wall: "east", offset: 12, width: 4 }]
      },
      {
        id: "kitchen", name: "Modern Open Kitchen", type: "kitchen",
        x: 14, y: 20, w: 14, h: 10,
        doors: [{ wall: "south", offset: 4, width: 4 }], // Open layout
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Powder / Bath", type: "bathroom",
        x: 0, y: 17, w: 6, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bath2", name: "En-suite Bath", type: "bathroom",
        x: 6, y: 17, w: 6, h: 6,
        doors: [{ wall: "north", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed1", name: "Primary Bedroom", type: "bedroom",
        x: 0, y: 23, w: 14, h: 14,
        doors: [{ wall: "east", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "west", offset: 4, width: 4 }]
      },
      {
        id: "bed2", name: "Kid's Bedroom", type: "bedroom",
        x: 14, y: 30, w: 14, h: 12,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "balcony", name: "Garden Balcony", type: "balcony",
        x: 0, y: 37, w: 14, h: 5,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 5 }]
      }
    ]
  },

  // 7. 2BHK Narrow Plot - West Facing
  {
    id: "t07",
    name: "2BHK Linear Narrow-Lot",
    bhk: 2,
    hasParking: false,
    facing: "W",
    referencePlot: { width: 20, length: 50 }, // 1000 sqft
    rooms: [
      {
        id: "hall", name: "Front Parlour & Living", type: "hall",
        x: 0, y: 0, w: 20, h: 16,
        doors: [{ wall: "west", offset: 6, width: 3.5 }, { wall: "south", offset: 8, width: 3 }],
        windows: [{ wall: "west", offset: 11, width: 4 }, { wall: "east", offset: 6, width: 4 }]
      },
      {
        id: "passage", name: "Central Hallway", type: "passage",
        x: 7, y: 16, w: 6, h: 14,
        doors: [{ wall: "south", offset: 1.5, width: 3 }],
        windows: []
      },
      {
        id: "kitchen", name: "Galley Kitchen", type: "kitchen",
        x: 0, y: 16, w: 7, h: 10,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 3 }]
      },
      {
        id: "bath1", name: "Central Bath", type: "bathroom",
        x: 0, y: 26, w: 7, h: 5,
        doors: [{ wall: "east", offset: 1, width: 2.5 }],
        windows: [{ wall: "west", offset: 1, width: 2 }]
      },
      {
        id: "bed1", name: "Middle Bedroom", type: "bedroom",
        x: 13, y: 16, w: 7, h: 15,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 5, width: 4 }]
      },
      {
        id: "bath2", name: "Rear Bath", type: "bathroom",
        x: 13, y: 31, w: 7, h: 5,
        doors: [{ wall: "west", offset: 1, width: 2.5 }],
        windows: [{ wall: "east", offset: 1, width: 2 }]
      },
      {
        id: "bed2", name: "Master Suite", type: "bedroom",
        x: 0, y: 36, w: 20, h: 14,
        doors: [{ wall: "south", offset: 8, width: 3 }],
        windows: [{ wall: "north", offset: 6, width: 5 }, { wall: "west", offset: 4, width: 4 }]
      }
    ]
  },

  // 8. 3BHK Standard with Parking - North Facing (FLAGSHIP TEMPLATE)
  {
    id: "t08",
    name: "3BHK Standard Grand Family",
    bhk: 3,
    hasParking: true,
    facing: "N",
    referencePlot: { width: 35, length: 45 }, // 1575 sqft
    rooms: [
      {
        id: "parking", name: "Car Port", type: "parking",
        x: 0, y: 0, w: 14, h: 16,
        doors: [{ wall: "south", offset: 2, width: 10 }],
        windows: []
      },
      {
        id: "hall", name: "Grand Living Hall", type: "hall",
        x: 14, y: 0, w: 21, h: 19,
        doors: [{ wall: "south", offset: 8, width: 4 }, { wall: "west", offset: 7, width: 3 }],
        windows: [{ wall: "south", offset: 14, width: 5 }, { wall: "east", offset: 6, width: 4 }]
      },
      {
        id: "dining", name: "Formal Dining", type: "dining",
        x: 12, y: 19, w: 12, h: 11,
        doors: [{ wall: "south", offset: 4, width: 4 }],
        windows: []
      },
      {
        id: "kitchen", name: "Chef's Kitchen", type: "kitchen",
        x: 24, y: 19, w: 11, h: 11,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Powder Room", type: "bathroom",
        x: 0, y: 16, w: 6, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bath2", name: "Bath 2", type: "bathroom",
        x: 6, y: 16, w: 6, h: 6,
        doors: [{ wall: "north", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bed1", name: "Guest Bedroom", type: "bedroom",
        x: 0, y: 22, w: 12, h: 11,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bed2", name: "Children's Bedroom", type: "bedroom",
        x: 23, y: 30, w: 12, h: 15,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bath3", name: "Master En-suite", type: "bathroom",
        x: 15, y: 30, w: 8, h: 5,
        doors: [{ wall: "west", offset: 1, width: 2.5 }],
        windows: []
      },
      {
        id: "bed3", name: "Master Suite", type: "bedroom",
        x: 0, y: 33, w: 15, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "balcony", name: "Master Balcony", type: "balcony",
        x: 15, y: 38, w: 8, h: 7,
        doors: [{ wall: "west", offset: 2, width: 3 }],
        windows: [{ wall: "north", offset: 2, width: 4 }]
      }
    ]
  },

  // 9. 3BHK South-Facing with Parking
  {
    id: "t09",
    name: "3BHK Southern Haven",
    bhk: 3,
    hasParking: true,
    facing: "S",
    referencePlot: { width: 35, length: 45 }, // 1575 sqft
    rooms: [
      {
        id: "parking", name: "Covered Carport", type: "parking",
        x: 21, y: 0, w: 14, h: 16,
        doors: [{ wall: "south", offset: 2, width: 10 }],
        windows: []
      },
      {
        id: "hall", name: "Family Lounge & Hall", type: "hall",
        x: 0, y: 0, w: 21, h: 18,
        doors: [{ wall: "south", offset: 8, width: 4 }],
        windows: [{ wall: "south", offset: 2, width: 4 }, { wall: "west", offset: 6, width: 5 }]
      },
      {
        id: "kitchen", name: "Kitchen", type: "kitchen",
        x: 23, y: 16, w: 12, h: 12,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "dining", name: "Central Dining", type: "dining",
        x: 11, y: 18, w: 12, h: 10,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: []
      },
      {
        id: "bath1", name: "Common Bathroom", type: "bathroom",
        x: 0, y: 18, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Ground Suite / Bed 1", type: "bedroom",
        x: 0, y: 24, w: 11, h: 11,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Attached Bath", type: "bathroom",
        x: 11, y: 28, w: 8, h: 6,
        doors: [{ wall: "south", offset: 1, width: 2.5 }],
        windows: []
      },
      {
        id: "bed2", name: "Bedroom 2", type: "bedroom",
        x: 19, y: 28, w: 16, h: 12,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bed3", name: "Master Suite", type: "bedroom",
        x: 0, y: 35, w: 15, h: 10,
        doors: [{ wall: "south", offset: 5, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "balcony", name: "Verandah Balcony", type: "balcony",
        x: 15, y: 40, w: 20, h: 5,
        doors: [{ wall: "south", offset: 6, width: 3 }],
        windows: [{ wall: "north", offset: 6, width: 8 }]
      }
    ]
  },

  // 10. 3BHK East-Facing with Pooja Room
  {
    id: "t10",
    name: "3BHK Vastu Sanctum with Pooja",
    bhk: 3,
    hasParking: true,
    facing: "E",
    referencePlot: { width: 36, length: 48 }, // 1728 sqft
    rooms: [
      {
        id: "parking", name: "Porch Parking", type: "parking",
        x: 0, y: 0, w: 14, h: 16,
        doors: [{ wall: "south", offset: 2, width: 10 }],
        windows: []
      },
      {
        id: "hall", name: "Majestic Living Hall", type: "hall",
        x: 14, y: 0, w: 22, h: 18,
        doors: [{ wall: "east", offset: 6, width: 4 }],
        windows: [{ wall: "east", offset: 12, width: 5 }, { wall: "south", offset: 4, width: 4 }]
      },
      {
        id: "pooja", name: "Pooja Sanctum", type: "pooja",
        x: 29, y: 18, w: 7, h: 6,
        doors: [{ wall: "west", offset: 1.5, width: 3 }],
        windows: [{ wall: "east", offset: 2, width: 2 }]
      },
      {
        id: "kitchen", name: "Vastu Kitchen", type: "kitchen",
        x: 22, y: 24, w: 14, h: 11,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "dining", name: "Dining Room", type: "dining",
        x: 11, y: 18, w: 11, h: 11,
        doors: [{ wall: "south", offset: 3, width: 3 }],
        windows: []
      },
      {
        id: "bath1", name: "Common Restroom", type: "bathroom",
        x: 0, y: 16, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Parents Room", type: "bedroom",
        x: 0, y: 22, w: 11, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Bath 2", type: "bathroom",
        x: 0, y: 34, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed2", name: "Children's Suite", type: "bedroom",
        x: 21, y: 35, w: 15, h: 13,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bed3", name: "Master Suite", type: "bedroom",
        x: 7, y: 35, w: 14, h: 13,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }]
      }
    ]
  },

  // 11. 3BHK West-Facing (No Parking variant)
  {
    id: "t11",
    name: "3BHK Compact Spacious - No Parking",
    bhk: 3,
    hasParking: false,
    facing: "W",
    referencePlot: { width: 32, length: 44 }, // 1408 sqft
    rooms: [
      {
        id: "hall", name: "Spacious Living Room", type: "hall",
        x: 0, y: 0, w: 19, h: 18,
        doors: [{ wall: "west", offset: 6, width: 4 }],
        windows: [{ wall: "south", offset: 5, width: 4 }, { wall: "west", offset: 12, width: 4 }]
      },
      {
        id: "dining", name: "Family Dining", type: "dining",
        x: 19, y: 0, w: 13, h: 14,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }, { wall: "south", offset: 3, width: 4 }]
      },
      {
        id: "kitchen", name: "Enclosed Kitchen", type: "kitchen",
        x: 19, y: 14, w: 13, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Common Washroom", type: "bathroom",
        x: 11, y: 18, w: 8, h: 6,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed1", name: "Bedroom 1", type: "bedroom",
        x: 0, y: 18, w: 11, h: 13,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Master Bathroom", type: "bathroom",
        x: 13, y: 24, w: 6, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bed2", name: "Master Suite", type: "bedroom",
        x: 19, y: 24, w: 13, h: 14,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 4, width: 4 }, { wall: "north", offset: 3, width: 4 }]
      },
      {
        id: "bed3", name: "Bedroom 3", type: "bedroom",
        x: 0, y: 31, w: 14, h: 13,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "balcony", name: "North Terrace", type: "balcony",
        x: 14, y: 38, w: 18, h: 6,
        doors: [{ wall: "south", offset: 6, width: 3 }],
        windows: [{ wall: "north", offset: 6, width: 6 }]
      }
    ]
  },

  // 12. 3BHK North-Facing with Dedicated Study
  {
    id: "t12",
    name: "3BHK Executive Home with Study",
    bhk: 3,
    hasParking: true,
    facing: "N",
    referencePlot: { width: 36, length: 50 }, // 1800 sqft
    rooms: [
      {
        id: "parking", name: "Double Width Parking", type: "parking",
        x: 0, y: 0, w: 15, h: 18,
        doors: [{ wall: "south", offset: 2, width: 11 }],
        windows: []
      },
      {
        id: "hall", name: "Lounge & Reception", type: "hall",
        x: 15, y: 0, w: 21, h: 20,
        doors: [{ wall: "south", offset: 6, width: 4 }, { wall: "west", offset: 8, width: 3 }],
        windows: [{ wall: "east", offset: 6, width: 5 }, { wall: "south", offset: 14, width: 4 }]
      },
      {
        id: "study", name: "Executive Home Office", type: "study",
        x: 0, y: 18, w: 11, h: 9,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 2, width: 4 }]
      },
      {
        id: "dining", name: "Dining Hall", type: "dining",
        x: 15, y: 20, w: 11, h: 10,
        doors: [{ wall: "south", offset: 3, width: 3 }],
        windows: []
      },
      {
        id: "kitchen", name: "Chef's Kitchen", type: "kitchen",
        x: 26, y: 20, w: 10, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Common Bathroom", type: "bathroom",
        x: 0, y: 27, w: 8, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Guest Bedroom", type: "bedroom",
        x: 0, y: 33, w: 13, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Attached Bath", type: "bathroom",
        x: 13, y: 30, w: 8, h: 5,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed2", name: "Junior Suite", type: "bedroom",
        x: 23, y: 30, w: 13, h: 14,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 4, width: 4 }, { wall: "north", offset: 3, width: 4 }]
      },
      {
        id: "bed3", name: "Master Suite", type: "bedroom",
        x: 0, y: 45, w: 18, h: 5, // merged wide suite
        doors: [{ wall: "south", offset: 5, width: 3 }],
        windows: [{ wall: "north", offset: 5, width: 6 }]
      },
      {
        id: "balcony", name: "Sky Balcony", type: "balcony",
        x: 18, y: 44, w: 18, h: 6,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 5 }]
      }
    ]
  },

  // 13. 3BHK Wide Plot - South Facing
  {
    id: "t13",
    name: "3BHK Wide-Frontage Villa",
    bhk: 3,
    hasParking: true,
    facing: "S",
    referencePlot: { width: 50, length: 35 }, // 1750 sqft
    rooms: [
      {
        id: "parking", name: "Car Port", type: "parking",
        x: 0, y: 0, w: 15, h: 16,
        doors: [{ wall: "south", offset: 2, width: 11 }],
        windows: []
      },
      {
        id: "hall", name: "Panoramic Living Room", type: "hall",
        x: 15, y: 0, w: 22, h: 18,
        doors: [{ wall: "south", offset: 8, width: 4 }],
        windows: [{ wall: "south", offset: 3, width: 4 }, { wall: "south", offset: 15, width: 4 }]
      },
      {
        id: "kitchen", name: "East Wing Kitchen", type: "kitchen",
        x: 37, y: 0, w: 13, h: 14,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 4, width: 4 }, { wall: "south", offset: 3, width: 4 }]
      },
      {
        id: "dining", name: "Formal Dining Room", type: "dining",
        x: 37, y: 14, w: 13, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 2, width: 4 }]
      },
      {
        id: "bath1", name: "Powder Bath", type: "bathroom",
        x: 0, y: 16, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Guest Bedroom", type: "bedroom",
        x: 0, y: 22, w: 15, h: 13,
        doors: [{ wall: "east", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "En-suite Bath", type: "bathroom",
        x: 15, y: 25, w: 6, h: 6,
        doors: [{ wall: "west", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bed2", name: "Children's Room", type: "bedroom",
        x: 21, y: 20, w: 14, h: 15,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }]
      },
      {
        id: "bed3", name: "Master Suite", type: "bedroom",
        x: 35, y: 24, w: 15, h: 11,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "east", offset: 3, width: 4 }]
      }
    ]
  },

  // 14. 3BHK Narrow Long Plot - East Facing
  {
    id: "t14",
    name: "3BHK Courtyard Narrow",
    bhk: 3,
    hasParking: true,
    facing: "E",
    referencePlot: { width: 25, length: 60 }, // 1500 sqft
    rooms: [
      {
        id: "parking", name: "Front Parking Area", type: "parking",
        x: 0, y: 0, w: 14, h: 16,
        doors: [{ wall: "south", offset: 2, width: 10 }],
        windows: []
      },
      {
        id: "hall", name: "Living Lounge", type: "hall",
        x: 0, y: 16, w: 25, h: 16,
        doors: [{ wall: "east", offset: 6, width: 3.5 }, { wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 11, width: 4 }, { wall: "west", offset: 5, width: 4 }]
      },
      {
        id: "kitchen", name: "Kitchenette", type: "kitchen",
        x: 14, y: 0, w: 11, h: 12,
        doors: [{ wall: "north", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 3 }]
      },
      {
        id: "dining", name: "Dining Corridor", type: "dining",
        x: 14, y: 12, w: 11, h: 4,
        doors: [{ wall: "north", offset: 3, width: 3 }],
        windows: []
      },
      {
        id: "bath1", name: "Common Restroom", type: "bathroom",
        x: 0, y: 32, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Center Bedroom", type: "bedroom",
        x: 11, y: 32, w: 14, h: 12,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bath2", name: "Master Bath", type: "bathroom",
        x: 0, y: 38, w: 7, h: 6,
        doors: [{ wall: "north", offset: 2, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed2", name: "Twin Bedroom", type: "bedroom",
        x: 12, y: 44, w: 13, h: 16,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bed3", name: "Master Suite", type: "bedroom",
        x: 0, y: 44, w: 12, h: 16,
        doors: [{ wall: "east", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "west", offset: 4, width: 4 }]
      }
    ]
  },

  // 15. 4BHK Standard with Parking - North Facing
  {
    id: "t15",
    name: "4BHK Standard Luxury Estate",
    bhk: 4,
    hasParking: true,
    facing: "N",
    referencePlot: { width: 40, length: 55 }, // 2200 sqft
    rooms: [
      {
        id: "parking", name: "Dual Car Garage / Porch", type: "parking",
        x: 0, y: 0, w: 18, h: 18,
        doors: [{ wall: "south", offset: 2, width: 14 }],
        windows: []
      },
      {
        id: "hall", name: "Grand Formal Living Room", type: "hall",
        x: 18, y: 0, w: 22, h: 22,
        doors: [{ wall: "south", offset: 8, width: 4 }, { wall: "west", offset: 8, width: 3.5 }],
        windows: [{ wall: "east", offset: 6, width: 5 }, { wall: "south", offset: 15, width: 5 }]
      },
      {
        id: "dining", name: "Formal Banquet Dining", type: "dining",
        x: 16, y: 22, w: 12, h: 11,
        doors: [{ wall: "south", offset: 3, width: 4 }],
        windows: []
      },
      {
        id: "kitchen", name: "Gourmet Kitchen", type: "kitchen",
        x: 28, y: 22, w: 12, h: 11,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Powder Room", type: "bathroom",
        x: 0, y: 18, w: 8, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed1", name: "Guest Suite (Ground)", type: "bedroom",
        x: 0, y: 24, w: 14, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Guest En-suite", type: "bathroom",
        x: 0, y: 36, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 2, width: 2 }]
      },
      {
        id: "bed2", name: "Bedroom 2", type: "bedroom",
        x: 26, y: 33, w: 14, h: 12,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath3", name: "Family Bath", type: "bathroom",
        x: 18, y: 33, w: 8, h: 6,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed3", name: "Bedroom 3", type: "bedroom",
        x: 24, y: 45, w: 16, h: 10,
        doors: [{ wall: "south", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 2, width: 4 }]
      },
      {
        id: "bed4", name: "Grand Master Suite", type: "bedroom",
        x: 0, y: 42, w: 18, h: 13,
        doors: [{ wall: "east", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 5 }, { wall: "west", offset: 4, width: 4 }]
      },
      {
        id: "bath4", name: "Master Spa Bath", type: "bathroom",
        x: 18, y: 41, w: 6, h: 8,
        doors: [{ wall: "west", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "balcony", name: "Terrace Deck", type: "balcony",
        x: 18, y: 49, w: 6, h: 6,
        doors: [{ wall: "west", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "north", offset: 1, width: 4 }]
      }
    ]
  },

  // 16. 4BHK South-Facing with Servant Room
  {
    id: "t16",
    name: "4BHK Manor with Servant Quarters",
    bhk: 4,
    hasParking: true,
    facing: "S",
    referencePlot: { width: 42, length: 55 }, // 2310 sqft
    rooms: [
      {
        id: "parking", name: "Double Port", type: "parking",
        x: 24, y: 0, w: 18, h: 18,
        doors: [{ wall: "south", offset: 2, width: 14 }],
        windows: []
      },
      {
        id: "servant", name: "Servant Quarter & Bath", type: "servant",
        x: 32, y: 18, w: 10, h: 8,
        doors: [{ wall: "west", offset: 2, width: 2.5 }],
        windows: [{ wall: "east", offset: 2, width: 3 }]
      },
      {
        id: "hall", name: "Stately Living Salon", type: "hall",
        x: 0, y: 0, w: 24, h: 20,
        doors: [{ wall: "south", offset: 8, width: 4 }],
        windows: [{ wall: "south", offset: 2, width: 4 }, { wall: "west", offset: 6, width: 5 }]
      },
      {
        id: "dining", name: "Formal Dining", type: "dining",
        x: 12, y: 20, w: 12, h: 11,
        doors: [{ wall: "south", offset: 3, width: 3 }],
        windows: []
      },
      {
        id: "kitchen", name: "Island Kitchen", type: "kitchen",
        x: 24, y: 26, w: 14, h: 10,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Powder Bath", type: "bathroom",
        x: 0, y: 20, w: 6, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 1.5, width: 2 }]
      },
      {
        id: "bed1", name: "Guest Bedroom", type: "bedroom",
        x: 0, y: 26, w: 12, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Guest Bath", type: "bathroom",
        x: 6, y: 20, w: 6, h: 6,
        doors: [{ wall: "north", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bed2", name: "Bedroom 2", type: "bedroom",
        x: 26, y: 36, w: 16, h: 12,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bed3", name: "Bedroom 3", type: "bedroom",
        x: 0, y: 38, w: 14, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath3", name: "Bath 3", type: "bathroom",
        x: 14, y: 38, w: 8, h: 5,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed4", name: "Presidential Master Suite", type: "bedroom",
        x: 16, y: 48, w: 26, h: 7,
        doors: [{ wall: "south", offset: 6, width: 3.5 }],
        windows: [{ wall: "north", offset: 6, width: 6 }]
      },
      {
        id: "bath4", name: "Master Luxury Bath", type: "bathroom",
        x: 0, y: 50, w: 16, h: 5,
        doors: [{ wall: "east", offset: 1, width: 2.5 }],
        windows: [{ wall: "north", offset: 3, width: 3 }]
      }
    ]
  },

  // 17. 4BHK East-Facing with Study + Pooja Room
  {
    id: "t17",
    name: "4BHK Sovereign with Study & Pooja",
    bhk: 4,
    hasParking: true,
    facing: "E",
    referencePlot: { width: 45, length: 55 }, // 2475 sqft
    rooms: [
      {
        id: "parking", name: "Front Car Port", type: "parking",
        x: 0, y: 0, w: 18, h: 18,
        doors: [{ wall: "south", offset: 2, width: 14 }],
        windows: []
      },
      {
        id: "hall", name: "Grand Foyer & Living", type: "hall",
        x: 18, y: 0, w: 27, h: 22,
        doors: [{ wall: "east", offset: 8, width: 4 }],
        windows: [{ wall: "east", offset: 16, width: 5 }, { wall: "south", offset: 6, width: 4 }]
      },
      {
        id: "pooja", name: "Sacred Pooja Mandir", type: "pooja",
        x: 37, y: 22, w: 8, h: 7,
        doors: [{ wall: "west", offset: 2, width: 3 }],
        windows: [{ wall: "east", offset: 2, width: 2 }]
      },
      {
        id: "study", name: "Library & Study", type: "study",
        x: 0, y: 18, w: 12, h: 10,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 2, width: 4 }]
      },
      {
        id: "dining", name: "Banquet Dining Hall", type: "dining",
        x: 18, y: 22, w: 14, h: 11,
        doors: [{ wall: "south", offset: 4, width: 4 }],
        windows: []
      },
      {
        id: "kitchen", name: "Vastu Chef Kitchen", type: "kitchen",
        x: 32, y: 29, w: 13, h: 11,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Powder Bath", type: "bathroom",
        x: 0, y: 28, w: 6, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 1.5, width: 2 }]
      },
      {
        id: "bed1", name: "Suite 1 (Ground)", type: "bedroom",
        x: 0, y: 34, w: 14, h: 11,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bed2", name: "Suite 2", type: "bedroom",
        x: 30, y: 40, w: 15, h: 15,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bath2", name: "Bath 2", type: "bathroom",
        x: 22, y: 36, w: 8, h: 6,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed3", name: "Suite 3", type: "bedroom",
        x: 0, y: 45, w: 14, h: 10,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "west", offset: 2, width: 3 }]
      },
      {
        id: "bed4", name: "Master Royal Chamber", type: "bedroom",
        x: 14, y: 45, w: 16, h: 10,
        doors: [{ wall: "south", offset: 4, width: 3.5 }],
        windows: [{ wall: "north", offset: 4, width: 5 }]
      },
      {
        id: "bath3", name: "Master En-suite", type: "bathroom",
        x: 14, y: 36, w: 8, h: 6,
        doors: [{ wall: "north", offset: 2, width: 2.5 }],
        windows: []
      }
    ]
  },

  // 18. 4BHK Wide Plot - West Facing
  {
    id: "t18",
    name: "4BHK Horizon Wide-Villa",
    bhk: 4,
    hasParking: true,
    facing: "W",
    referencePlot: { width: 55, length: 40 }, // 2200 sqft
    rooms: [
      {
        id: "parking", name: "Porte-Cochère Parking", type: "parking",
        x: 0, y: 0, w: 18, h: 16,
        doors: [{ wall: "south", offset: 2, width: 14 }],
        windows: []
      },
      {
        id: "hall", name: "Sprawling Grand Hall", type: "hall",
        x: 18, y: 0, w: 24, h: 18,
        doors: [{ wall: "west", offset: 6, width: 4 }, { wall: "south", offset: 6, width: 4 }],
        windows: [{ wall: "south", offset: 14, width: 5 }]
      },
      {
        id: "kitchen", name: "Luxury Kitchen", type: "kitchen",
        x: 42, y: 0, w: 13, h: 15,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 4, width: 4 }, { wall: "south", offset: 3, width: 4 }]
      },
      {
        id: "dining", name: "Al-Fresco Dining Room", type: "dining",
        x: 42, y: 15, w: 13, h: 11,
        doors: [{ wall: "west", offset: 3, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Common Restroom", type: "bathroom",
        x: 0, y: 16, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 1.5, width: 2 }]
      },
      {
        id: "bed1", name: "Suite 1", type: "bedroom",
        x: 0, y: 22, w: 14, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "En-suite Bath", type: "bathroom",
        x: 0, y: 34, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 1.5, width: 2 }]
      },
      {
        id: "bed2", name: "Suite 2", type: "bedroom",
        x: 14, y: 24, w: 14, h: 16,
        doors: [{ wall: "east", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }]
      },
      {
        id: "bed3", name: "Suite 3", type: "bedroom",
        x: 28, y: 24, w: 13, h: 16,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }]
      },
      {
        id: "bath3", name: "Bath 3", type: "bathroom",
        x: 41, y: 26, w: 6, h: 6,
        doors: [{ wall: "west", offset: 1.5, width: 2.5 }],
        windows: []
      },
      {
        id: "bed4", name: "Master Suite", type: "bedroom",
        x: 41, y: 32, w: 14, h: 8,
        doors: [{ wall: "west", offset: 2, width: 3 }],
        windows: [{ wall: "north", offset: 3, width: 4 }, { wall: "east", offset: 2, width: 3 }]
      },
      {
        id: "balcony", name: "West Sunset Verandah", type: "balcony",
        x: 7, y: 34, w: 7, h: 6,
        doors: [{ wall: "south", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "north", offset: 1.5, width: 4 }]
      }
    ]
  },

  // 19. 5BHK Large Family Estate - North Facing
  {
    id: "t19",
    name: "5BHK Dynasty Palatial Estate",
    bhk: 5,
    hasParking: true,
    facing: "N",
    referencePlot: { width: 50, length: 60 }, // 3000 sqft
    rooms: [
      {
        id: "parking", name: "Grand Carriage Garage", type: "parking",
        x: 0, y: 0, w: 20, h: 18,
        doors: [{ wall: "south", offset: 2, width: 16 }],
        windows: []
      },
      {
        id: "hall", name: "Imperial Great Room", type: "hall",
        x: 20, y: 0, w: 30, h: 22,
        doors: [{ wall: "south", offset: 10, width: 4.5 }, { wall: "west", offset: 8, width: 4 }],
        windows: [{ wall: "east", offset: 8, width: 6 }, { wall: "south", offset: 20, width: 5 }]
      },
      {
        id: "dining", name: "Grand Dining Banquet", type: "dining",
        x: 18, y: 22, w: 16, h: 12,
        doors: [{ wall: "south", offset: 5, width: 4 }],
        windows: []
      },
      {
        id: "kitchen", name: "Dual-Zone Chef Kitchen", type: "kitchen",
        x: 34, y: 22, w: 16, h: 12,
        doors: [{ wall: "west", offset: 4, width: 3.5 }],
        windows: [{ wall: "east", offset: 4, width: 5 }]
      },
      {
        id: "bath1", name: "Foyer Bath", type: "bathroom",
        x: 0, y: 18, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 1.5, width: 2 }]
      },
      {
        id: "bed1", name: "Elder Suite 1", type: "bedroom",
        x: 0, y: 24, w: 14, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Bath 2", type: "bathroom",
        x: 0, y: 36, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 1.5, width: 2 }]
      },
      {
        id: "bed2", name: "Junior Suite 2", type: "bedroom",
        x: 0, y: 42, w: 14, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bed3", name: "Guest Chamber 3", type: "bedroom",
        x: 35, y: 34, w: 15, h: 13,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bath3", name: "Bath 3", type: "bathroom",
        x: 27, y: 34, w: 8, h: 6,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed4", name: "Bedroom 4", type: "bedroom",
        x: 32, y: 47, w: 18, h: 13,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 5 }, { wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bed5", name: "Emperor Master Suite", type: "bedroom",
        x: 14, y: 44, w: 18, h: 16,
        doors: [{ wall: "south", offset: 4, width: 3.5 }],
        windows: [{ wall: "north", offset: 5, width: 5 }]
      },
      {
        id: "bath4", name: "Master Spa", type: "bathroom",
        x: 0, y: 54, w: 14, h: 6,
        doors: [{ wall: "east", offset: 2, width: 2.5 }],
        windows: [{ wall: "north", offset: 3, width: 3 }]
      },
      {
        id: "balcony", name: "Dynasty Terrace", type: "balcony",
        x: 18, y: 36, w: 9, h: 8,
        doors: [{ wall: "south", offset: 2, width: 3 }],
        windows: []
      }
    ]
  },

  // 20. 5BHK Luxury with Servant + Study - South Facing
  {
    id: "t20",
    name: "5BHK Sovereign Villa with Servant & Study",
    bhk: 5,
    hasParking: true,
    facing: "S",
    referencePlot: { width: 52, length: 65 }, // 3380 sqft
    rooms: [
      {
        id: "parking", name: "Executive Triple Carport", type: "parking",
        x: 28, y: 0, w: 24, h: 20,
        doors: [{ wall: "south", offset: 3, width: 18 }],
        windows: []
      },
      {
        id: "servant", name: "Servant Quarters & Bath", type: "servant",
        x: 40, y: 20, w: 12, h: 9,
        doors: [{ wall: "west", offset: 2, width: 2.5 }],
        windows: [{ wall: "east", offset: 2, width: 3 }]
      },
      {
        id: "hall", name: "Palatial Living Hall", type: "hall",
        x: 0, y: 0, w: 28, h: 22,
        doors: [{ wall: "south", offset: 10, width: 4.5 }],
        windows: [{ wall: "south", offset: 3, width: 5 }, { wall: "west", offset: 8, width: 6 }]
      },
      {
        id: "study", name: "Governor's Study / Office", type: "study",
        x: 0, y: 22, w: 14, h: 10,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "pooja", name: "Devotional Pooja Mandir", type: "pooja",
        x: 44, y: 29, w: 8, h: 7,
        doors: [{ wall: "west", offset: 2, width: 3 }],
        windows: [{ wall: "east", offset: 2, width: 2 }]
      },
      {
        id: "dining", name: "Banquet Room", type: "dining",
        x: 14, y: 22, w: 16, h: 12,
        doors: [{ wall: "south", offset: 5, width: 4 }],
        windows: []
      },
      {
        id: "kitchen", name: "Royal Master Kitchen", type: "kitchen",
        x: 30, y: 29, w: 14, h: 12,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath1", name: "Powder Bath", type: "bathroom",
        x: 0, y: 32, w: 7, h: 6,
        doors: [{ wall: "east", offset: 1.5, width: 2.5 }],
        windows: [{ wall: "west", offset: 1.5, width: 2 }]
      },
      {
        id: "bed1", name: "Guest Suite 1", type: "bedroom",
        x: 0, y: 38, w: 14, h: 12,
        doors: [{ wall: "east", offset: 3, width: 3 }],
        windows: [{ wall: "west", offset: 3, width: 4 }]
      },
      {
        id: "bath2", name: "Guest Bath", type: "bathroom",
        x: 14, y: 36, w: 8, h: 6,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed2", name: "Junior Suite 2", type: "bedroom",
        x: 34, y: 41, w: 18, h: 12,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "east", offset: 4, width: 4 }]
      },
      {
        id: "bed3", name: "Chamber 3", type: "bedroom",
        x: 0, y: 50, w: 15, h: 15,
        doors: [{ wall: "east", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "west", offset: 4, width: 4 }]
      },
      {
        id: "bed4", name: "Chamber 4", type: "bedroom",
        x: 34, y: 53, w: 18, h: 12,
        doors: [{ wall: "west", offset: 4, width: 3 }],
        windows: [{ wall: "north", offset: 4, width: 4 }, { wall: "east", offset: 3, width: 4 }]
      },
      {
        id: "bath3", name: "Chamber Bath", type: "bathroom",
        x: 24, y: 44, w: 8, h: 6,
        doors: [{ wall: "south", offset: 2, width: 2.5 }],
        windows: []
      },
      {
        id: "bed5", name: "Imperial Master Suite", type: "bedroom",
        x: 15, y: 52, w: 19, h: 13,
        doors: [{ wall: "south", offset: 4, width: 3.5 }],
        windows: [{ wall: "north", offset: 5, width: 6 }]
      },
      {
        id: "bath4", name: "Master Spa Bath", type: "bathroom",
        x: 15, y: 44, w: 9, h: 8,
        doors: [{ wall: "north", offset: 2, width: 2.5 }],
        windows: []
      }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEMPLATES };
}
