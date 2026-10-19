import { STATIONS } from './mockData';
import { computeRiverKm, computeStandardFare } from '../services/journeyPlanner';

export interface Departure {
  time: string;
  line: 'C1' | 'C2' | 'C3';
  hull: string;
  from: string;
  to: string;
  status: 'On Time' | 'Boarding';
}

// Single master departures list — shared by HomeHero (last 4) and
// TimetableFaresView (full schedule). Hulls match fleet route
// assignments in mockData (F-101/102 → C1, F-104/105 → C2, F-103/106 → C3),
// and every from/to pair is a valid stop on its line.
export const DEPARTURES: Departure[] = [
  { time: '06:00 AM', line: 'C1', hull: 'F-101', from: 'POON', to: 'ISLD', status: 'On Time' },
  { time: '06:12 AM', line: 'C1', hull: 'F-102', from: 'KOY', to: 'ISLD', status: 'On Time' },
  { time: '06:20 AM', line: 'C2', hull: 'F-104', from: 'CHET', to: 'EGM', status: 'On Time' },
  { time: '06:24 AM', line: 'C1', hull: 'F-101', from: 'EGM', to: 'POON', status: 'On Time' },
  { time: '06:28 AM', line: 'C2', hull: 'F-105', from: 'EGM', to: 'KOY', status: 'On Time' },
  { time: '06:36 AM', line: 'C1', hull: 'F-102', from: 'CHET', to: 'ISLD', status: 'On Time' },
  { time: '06:45 AM', line: 'C3', hull: 'F-103', from: 'EGM', to: 'ISLD', status: 'On Time' },
  { time: '07:00 AM', line: 'C1', hull: 'F-101', from: 'KOY', to: 'ISLD', status: 'On Time' },
  { time: '10:30 AM', line: 'C1', hull: 'F-101', from: 'KOY', to: 'EGM', status: 'On Time' },
  { time: '10:38 AM', line: 'C3', hull: 'F-103', from: 'CHET', to: 'CHIN', status: 'Boarding' },
  { time: '10:45 AM', line: 'C1', hull: 'F-102', from: 'POON', to: 'ISLD', status: 'On Time' },
  { time: '10:52 AM', line: 'C3', hull: 'F-106', from: 'EGM', to: 'ISLD', status: 'On Time' },
];

// Fares are derived from the same planner math as booking, so the
// schedule never disagrees with the journey planner or fare calculator.
export function fareBetween(from: string, to: string): number {
  const a = STATIONS.find((s) => s.code === from);
  const b = STATIONS.find((s) => s.code === to);
  if (!a || !b) return 0;
  return computeStandardFare(
    computeRiverKm(
      a.coordinates[0],
      a.coordinates[1],
      b.coordinates[0],
      b.coordinates[1]
    )
  );
}

export function departureFare(dep: Departure): number {
  return fareBetween(dep.from, dep.to);
}
