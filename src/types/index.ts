export type Language = 'en' | 'ta';

export interface Station {
  id: string;
  code: string;
  nameEn: string;
  nameTa: string;
  coordinates: [number, number]; // [lat, lng]
  pontoons: number;
  interchanges: string[]; // e.g. ['Metro Line 2', 'CMBT Bus Terminal']
  isAccessible: boolean;
  facilities: string[]; // e.g. ['WiFi', 'Restrooms', 'Ticket Kiosk', 'EV Charger']
  addressEn: string;
  addressTa: string;
  feederConnectivity: string;
}

export interface Route {
  id: string;
  routeCode: string; // 'C1' | 'C2' | 'C3'
  nameEn: string;
  nameTa: string;
  colorHex: string;
  stationCodes: string[];
  totalDistanceKm: number;
  averageDurationMin: number;
  frequencyMinutes: number;
  firstDeparture: string;
  lastDeparture: string;
  speedLimitKmh: number;
  status: 'OPERATIONAL' | 'REDUCED_SERVICE' | 'SUSPENDED';
}

export type FerryStatus = 'IN_TRANSIT' | 'DOCKED' | 'BOARDING' | 'MAINTENANCE';

export interface Ferry {
  id: string;
  hullNumber: string; // e.g. 'F-102'
  name: string;
  capacity: number;
  occupancy: number;
  speedKmh: number;
  headingDeg: number;
  routeId: string;
  tripId: string;
  status: FerryStatus;
  currentStationId?: string;
  nextStationId: string;
  etaNextMin: number;
  batteryPct: number;
  lat: number;
  lng: number;
  captainName: string;
  lastUpdated: string;
}

export type PlanType = 'FASTEST' | 'CHEAPEST' | 'NEXT_DEPARTURE';

export interface JourneyLeg {
  mode: 'WALK' | 'WATER_METRO';
  from: string;
  to: string;
  durationMin: number;
  distanceMeters?: number;
  routeCode?: string;
  routeName?: string;
  vesselHull?: string;
  departureTime?: string;
  arrivalTime?: string;
  intermediateStops?: string[];
}

export interface JourneyPlan {
  id: string;
  planType: PlanType;
  titleEn: string;
  titleTa: string;
  summaryEn: string;
  summaryTa: string;
  totalDurationMin: number;
  totalFareInr: number;
  transfers: number;
  carbonSavedGrams: number;
  departureTime: string;
  arrivalTime: string;
  legs: JourneyLeg[];
}

export type TicketStatus = 'ACTIVE' | 'BOARDED' | 'COMPLETED' | 'CANCELLED';

export interface Ticket {
  id: string;
  bookingRef: string; // e.g. 'CM48291'
  originCode: string;
  destinationCode: string;
  originName: string;
  destinationName: string;
  passengerCount: number;
  fareInr: number;
  journeyDate: string;
  departureTime: string;
  routeCode: string;
  status: TicketStatus;
  qrSignature: string;
  createdAt: string;
  scannedAt?: string;
  cancelledAt?: string;
  refundRef?: string;
  refundAmountInr?: number;
  refundStatus?: 'PROCESSED' | 'PENDING' | 'FAILED';
}

export interface ServiceAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  affectedRouteCode?: string;
  timestamp: string;
  active: boolean;
}

export type VoiceIntent =
  | 'PLAN_JOURNEY'
  | 'NEXT_FERRY'
  | 'NEAREST_STATION'
  | 'FARE_INQUIRY'
  | 'TRACK_FERRY'
  | 'SHOW_TICKET'
  | 'SERVICE_ALERTS'
  | 'TRIP_DURATION'
  | 'CANCEL_BOOKING'
  | 'CUSTOMER_CARE'
  | 'KNOWLEDGE_SEARCH'
  | 'GREETING'
  | 'THANKS'
  | 'ABOUT'
  | 'UNKNOWN';

export interface ParsedVoiceCommand {
  intent: VoiceIntent;
  origin?: string;
  destination?: string;
  ferryId?: string;
  stationName?: string;
  rawQuery: string;
  confidence: number;
  spokenReplyEn: string;
  spokenReplyTa: string;
  knowledgeDocId?: string;
}
