/**
 * NEERMETRO Geographic and Navigation Fairway Datasets
 * Accurately traced along the true, natural flowing course of the Cooum River in Chennai.
 */

// 1. Stations & Major Passenger Terminals [lat, lng]
export const STATIONS_GEO = [
  {
    code: 'POON',
    nameEn: 'Poonamallee Terminal',
    nameTa: 'பூந்தமல்லி முனையம்',
    coords: [13.0492, 80.0985] as [number, number],
    type: 'TERMINAL' as const,
    pontoons: 3,
    description: 'Western gateway terminal connecting Kanchipuram highway corridor',
  },
  {
    code: 'SENN',
    nameEn: 'Senneerkuppam Quay',
    nameTa: 'செந்நீர்க்குப்பம் படித்துறை',
    coords: [13.0615, 80.1342] as [number, number],
    type: 'STATION' as const,
    pontoons: 2,
    description: 'Residential feeder quay with bicycle charging docks',
  },
  {
    code: 'MADU',
    nameEn: 'Maduravoyal Basin',
    nameTa: 'மதுரவாயல் படுகை',
    coords: [13.0685, 80.1654] as [number, number],
    type: 'STATION' as const,
    pontoons: 2,
    description: 'Elevated bypass junction with passenger feeder links',
  },
  {
    code: 'KOY',
    nameEn: 'Koyambedu Central Hub',
    nameTa: 'கோயம்பேடு மையம்',
    coords: [13.0734, 80.1938] as [number, number],
    type: 'TERMINAL' as const,
    pontoons: 4,
    description: 'Multimodal mega terminal connecting CMBT Bus & CMRL Metro Line 2',
  },
  {
    code: 'ARUM',
    nameEn: 'Arumbakkam Station',
    nameTa: 'அரும்பாக்கம் நிலையம்',
    coords: [13.0743, 80.2088] as [number, number],
    type: 'STATION' as const,
    pontoons: 2,
    description: 'Riverside stop adjacent to DG Vaishnav college precinct',
  },
  {
    code: 'AMIN',
    nameEn: 'Aminjikarai Pier',
    nameTa: 'அமைந்தகரை நடைபாதை',
    coords: [13.0759, 80.2226] as [number, number],
    type: 'STATION' as const,
    pontoons: 2,
    description: 'Urban shopping corridor and Shenoy Nagar bus transfer',
  },
  {
    code: 'CHET',
    nameEn: 'Chetpet Eco-Basin',
    nameTa: 'சேத்துப்பட்டு சூழல் படுகை',
    coords: [13.0728, 80.2421] as [number, number],
    type: 'TERMINAL' as const,
    pontoons: 3,
    description: 'Eco-Park boardwalk terminal & Chetpet Suburban railway link',
  },
  {
    code: 'EGM',
    nameEn: 'Egmore Station Quay',
    nameTa: 'எழும்பூர் படித்துறை',
    coords: [13.0818, 80.2608] as [number, number],
    type: 'TERMINAL' as const,
    pontoons: 4,
    description: 'Intercity railway junction & Southern Railway headquarters',
  },
  {
    code: 'CHIN',
    nameEn: 'Chintadripet Station',
    nameTa: 'சிந்தாதிரிப்பேட்டை நிலையம்',
    coords: [13.0784, 80.2736] as [number, number],
    type: 'STATION' as const,
    pontoons: 2,
    description: 'MRTS elevated railway interchange along riverbank',
  },
  {
    code: 'ISLD',
    nameEn: 'Island Grounds / Marina Terminal',
    nameTa: 'தீவுத்திடல் / மெரினா முனையம்',
    coords: [13.0708, 80.2862] as [number, number],
    type: 'TERMINAL' as const,
    pontoons: 4,
    description: 'Maritime visitor hub at Napier Bridge & Marina Beach coastal mouth',
  },
];

// 2. High-precision Fairway River Waypoints (Faithfully following the natural winding course of the Cooum River)
export const COOUM_RIVER_CHANNEL: [number, number][] = [
  // 1. Poonamallee Gateway & Paruthipattu Lake Bypass
  [13.0478, 80.0935],
  [13.0485, 80.0955],
  [13.0492, 80.0985], // POON: Poonamallee Terminal
  [13.0502, 80.1022],
  [13.0515, 80.1065],
  [13.0530, 80.1118],
  [13.0545, 80.1165],
  [13.0565, 80.1225],
  [13.0588, 80.1285],
  [13.0615, 80.1342], // SENN: Senneerkuppam Quay
  // 2. Meandering through Adayalampattu & Maduravoyal
  [13.0628, 80.1398],
  [13.0640, 80.1455],
  [13.0652, 80.1518],
  [13.0668, 80.1585],
  [13.0685, 80.1654], // MADU: Maduravoyal Basin
  // 3. Koyambedu Loop (Nerkundram, CMBT bypass)
  [13.0694, 80.1712],
  [13.0705, 80.1775],
  [13.0718, 80.1840],
  [13.0728, 80.1895],
  [13.0734, 80.1938], // KOY: Koyambedu Central Hub Terminal
  // 4. Arumbakkam & Aminjikarai Riverside Corridor
  [13.0738, 80.1992],
  [13.0740, 80.2045],
  [13.0743, 80.2088], // ARUM: Arumbakkam Station
  [13.0748, 80.2138],
  [13.0754, 80.2185],
  [13.0759, 80.2226], // AMIN: Aminjikarai Pier
  // 5. Chetpet Eco-Basin loop & Wetland Sanctuary
  [13.0758, 80.2278],
  [13.0752, 80.2325],
  [13.0742, 80.2370],
  [13.0732, 80.2400],
  [13.0728, 80.2421], // CHET: Chetpet Eco-Basin Terminal
  // 6. Spur Tank Road curve towards Egmore
  [13.0732, 80.2465],
  [13.0745, 80.2510],
  [13.0768, 80.2555],
  [13.0792, 80.2588],
  [13.0818, 80.2608], // EGM: Egmore Station Quay Terminal
  // 7. Chintadripet loop around MRTS
  [13.0824, 80.2650],
  [13.0818, 80.2685],
  [13.0805, 80.2712],
  [13.0784, 80.2736], // CHIN: Chintadripet Station
  // 8. Island Grounds oxbow & Fort St. George bend
  [13.0765, 80.2768],
  [13.0745, 80.2798],
  [13.0728, 80.2828],
  [13.0715, 80.2848],
  [13.0708, 80.2862], // ISLD: Island Grounds / Marina Terminal
  // 9. Napier Bridge & Marina Estuary Mouth into Bay of Bengal
  [13.0695, 80.2882],
  [13.0685, 80.2895], // Napier Bridge Outflow
  [13.0675, 80.2918], // Marina Beach Coastal Bay
];

// 3. Restricted Navigation Safety Zones
export const RESTRICTED_ZONES = [
  {
    id: 'ZONE_ECO_CHETPET',
    name: 'Chetpet Ecological Wetland Sanctuary',
    polygon: [
      [13.0715, 80.2395],
      [13.0740, 80.2395],
      [13.0740, 80.2435],
      [13.0715, 80.2435],
    ] as [number, number][],
    reason: 'Wildlife & migratory bird protection (Max speed 8 km/h)',
    maxSpeedKmh: 8,
  },
  {
    id: 'ZONE_ESTUARY_BAR',
    name: 'Napier Estuary Sandbar',
    polygon: [
      [13.0675, 80.2875],
      [13.0700, 80.2875],
      [13.0700, 80.2910],
      [13.0675, 80.2910],
    ] as [number, number][],
    reason: 'Shallow sand accumulation during low tide (Maintain fairway centerline)',
    maxSpeedKmh: 10,
  },
];

// 4. Exact Ferry Route Paths along the Cooum Fairway (Connecting Terminals & Stops directly)
export const ROUTE_PATHS: Record<string, [number, number][]> = {
  // C1 Western Trunk: Poonamallee Gateway Terminal (idx 2) to Island Grounds Marina Terminal (idx 43)
  C1: COOUM_RIVER_CHANNEL.slice(2, 44),
  // C2 Central Express: Koyambedu Central Hub Terminal (idx 19) to Egmore Station Quay Terminal (idx 35)
  C2: COOUM_RIVER_CHANNEL.slice(19, 36),
  // C3 Estuary Heritage: Chetpet Eco-Basin Terminal (idx 30) to Island Grounds Marina Terminal (idx 43)
  C3: COOUM_RIVER_CHANNEL.slice(30, 44),
};

// 5. Geographic Bounds for smooth river-focused camera zooming
export const ROUTE_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  ALL: [[13.044, 80.090], [13.088, 80.296]], // Tightly frames the 18.5 km river course
  C1: [[13.044, 80.090], [13.088, 80.296]],
  C2: [[13.070, 80.190], [13.084, 80.265]],
  C3: [[13.067, 80.238], [13.083, 80.295]],
};

// 6. Max Pan Bounds (Restricts the map area strictly to the Cooum river corridor and riverside)
export const COOUM_CORRIDOR_MAX_BOUNDS: [[number, number], [number, number]] = [
  [13.020, 80.070],
  [13.110, 80.320],
];
