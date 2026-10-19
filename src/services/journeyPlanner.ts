import { JourneyPlan, JourneyLeg } from '../types';
import { STATIONS, ROUTES } from '../data/mockData';

// Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// River distance (straight-line * 1.35 meander factor, min 2.5 km)
export function computeRiverKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const straight = calculateDistanceKm(lat1, lon1, lat2, lon2);
  return Math.max(2.5, Math.round(straight * 1.35 * 10) / 10);
}

// Base fare: ₹15 for first 3 km, + ₹3/km thereafter
export function computeStandardFare(riverKm: number): number {
  return Math.round(15 + Math.max(0, riverKm - 3) * 3);
}

export function planJourneys(
  originCode: string,
  destinationCode: string
): JourneyPlan[] {
  const origin = STATIONS.find(s => s.code === originCode) || STATIONS[3]; // default Koyambedu
  const destination = STATIONS.find(s => s.code === destinationCode) || STATIONS[7]; // default Egmore

  if (origin.code === destination.code) {
    return [];
  }

  // Calculate approximate river distance
  const riverDistanceKm = computeRiverKm(
    origin.coordinates[0],
    origin.coordinates[1],
    destination.coordinates[0],
    destination.coordinates[1]
  );

  // Check if direct C1 or C2 route serves both
  const c2HasBoth = ROUTES[1].stationCodes.includes(origin.code) && ROUTES[1].stationCodes.includes(destination.code);

  const bestRoute = c2HasBoth ? ROUTES[1] : ROUTES[0];
  const transitTimeMin = Math.round((riverDistanceKm / (bestRoute.speedLimitKmh * 0.75)) * 60);

  const baseFare = computeStandardFare(riverDistanceKm);

  // Helper to format intermediate stops
  const intermediateStops: string[] = [];
  const routeStops = bestRoute.stationCodes;
  const oIdx = routeStops.indexOf(origin.code);
  const dIdx = routeStops.indexOf(destination.code);
  if (oIdx !== -1 && dIdx !== -1) {
    const start = Math.min(oIdx, dIdx) + 1;
    const end = Math.max(oIdx, dIdx);
    for (let i = start; i < end; i++) {
      const st = STATIONS.find(s => s.code === routeStops[i]);
      if (st) intermediateStops.push(st.nameEn);
    }
  }

  // Option 1: FASTEST (Direct Express)
  const fastestLegs: JourneyLeg[] = [
    {
      mode: 'WALK',
      from: `${origin.nameEn} Entrance Plaza`,
      to: `${origin.nameEn} Pontoon Gate 1`,
      durationMin: 3,
      distanceMeters: 180,
    },
    {
      mode: 'WATER_METRO',
      from: origin.nameEn,
      to: destination.nameEn,
      durationMin: transitTimeMin,
      distanceMeters: Math.round(riverDistanceKm * 1000),
      routeCode: bestRoute.routeCode,
      routeName: bestRoute.nameEn,
      vesselHull: 'F-102',
      departureTime: '10:20 AM',
      arrivalTime: '10:44 AM',
      intermediateStops,
    },
    {
      mode: 'WALK',
      from: `${destination.nameEn} Pontoon`,
      to: `${destination.nameEn} Main Concourse`,
      durationMin: 2,
      distanceMeters: 120,
    },
  ];

  const fastestPlan: JourneyPlan = {
    id: 'plan_fastest',
    planType: 'FASTEST',
    titleEn: 'Fastest Direct Route',
    titleTa: 'வேகமான நேரடி வழித்தடம்',
    summaryEn: `${origin.nameEn} → ${destination.nameEn} (Direct)`,
    summaryTa: `${origin.nameTa} → ${destination.nameTa} (நேரடி)`,
    totalDurationMin: transitTimeMin + 5,
    totalFareInr: baseFare,
    transfers: 0,
    carbonSavedGrams: Math.round(riverDistanceKm * 48),
    departureTime: '10:20 AM',
    arrivalTime: '10:49 AM',
    legs: fastestLegs,
  };

  // Option 2: CHEAPEST (Standard local service)
  const cheapestPlan: JourneyPlan = {
    id: 'plan_cheapest',
    planType: 'CHEAPEST',
    titleEn: 'Economic Local Service',
    titleTa: 'சிக்கன உள்ளூர் சேவை',
    summaryEn: `${origin.nameEn} → ${intermediateStops[0] || 'Chetpet'} → ${destination.nameEn}`,
    summaryTa: `${origin.nameTa} → ${intermediateStops[0] || 'சேத்துப்பட்டு'} → ${destination.nameTa}`,
    totalDurationMin: transitTimeMin + 11,
    totalFareInr: Math.max(15, baseFare - 10),
    transfers: 1,
    carbonSavedGrams: Math.round(riverDistanceKm * 44),
    departureTime: '10:25 AM',
    arrivalTime: '10:59 AM',
    legs: [
      {
        mode: 'WALK',
        from: `${origin.nameEn} Promenade`,
        to: `${origin.nameEn} Gate 2`,
        durationMin: 4,
        distanceMeters: 220,
      },
      {
        mode: 'WATER_METRO',
        from: origin.nameEn,
        to: intermediateStops[0] || 'Chetpet Eco-Basin',
        durationMin: Math.round(transitTimeMin * 0.6),
        routeCode: 'C1',
        routeName: 'Western Trunk Line',
        vesselHull: 'F-101',
        departureTime: '10:25 AM',
        arrivalTime: '10:42 AM',
      },
      {
        mode: 'WALK',
        from: 'Pontoon Transfer Pier',
        to: 'Interchange Pontoon 3',
        durationMin: 3,
        distanceMeters: 60,
      },
      {
        mode: 'WATER_METRO',
        from: intermediateStops[0] || 'Chetpet Eco-Basin',
        to: destination.nameEn,
        durationMin: Math.round(transitTimeMin * 0.4),
        routeCode: 'C2',
        routeName: 'Central Express Line',
        vesselHull: 'F-104',
        departureTime: '10:45 AM',
        arrivalTime: '10:59 AM',
      },
    ],
  };

  // Option 3: NEXT DEPARTURE (Immediate Boat boarding in 3 mins)
  const nextDeparturePlan: JourneyPlan = {
    id: 'plan_next_dep',
    planType: 'NEXT_DEPARTURE',
    titleEn: 'Next Immediate Departure',
    titleTa: 'அடுத்த உடனடியாக புறப்படும் படகு',
    summaryEn: `Departs in 4 mins (${bestRoute.routeCode} Line)`,
    summaryTa: `4 நிமிடங்களில் புறப்படுகிறது (${bestRoute.routeCode} தடம்)`,
    totalDurationMin: transitTimeMin + 4,
    totalFareInr: baseFare,
    transfers: 0,
    carbonSavedGrams: Math.round(riverDistanceKm * 48),
    departureTime: '10:19 AM',
    arrivalTime: '10:45 AM',
    legs: fastestLegs,
  };

  return [fastestPlan, cheapestPlan, nextDeparturePlan];
}
