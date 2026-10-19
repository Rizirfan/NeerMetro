import { Ferry } from '../types';
import { INITIAL_FERRIES } from '../data/mockData';
import { COOUM_RIVER_CHANNEL } from '../data/geoData';

type FleetListener = (ferries: Ferry[]) => void;

class GPSSimulator {
  private ferries: Ferry[] = [...INITIAL_FERRIES];
  private listeners: Set<FleetListener> = new Set();
  private intervalId: number | null = null;
  // Progress tracker along COOUM_RIVER_CHANNEL indices for each ferry (0.0 to 1.0)
  private ferryProgress: Record<string, { index: number; forward: boolean }> = {
    ferry_101: { index: 11, forward: true },
    ferry_102: { index: 21, forward: true },
    ferry_103: { index: 26, forward: true },
    ferry_104: { index: 19, forward: false },
    ferry_105: { index: 12, forward: true },
    ferry_106: { index: 27, forward: false },
  };

  constructor() {
    this.startSimulation();
  }

  public subscribe(listener: FleetListener): () => void {
    this.listeners.add(listener);
    listener([...this.ferries]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getFerries(): Ferry[] {
    return [...this.ferries];
  }

  public getFerryById(id: string): Ferry | undefined {
    return this.ferries.find(f => f.id === id || f.hullNumber === id);
  }

  private startSimulation() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 1500); // 1.5 second tick for smooth real-time simulation
  }

  private tick() {
    const totalWaypoints = COOUM_RIVER_CHANNEL.length;

    this.ferries = this.ferries.map(ferry => {
      if (ferry.status === 'DOCKED' || ferry.status === 'MAINTENANCE') {
        return ferry;
      }

      const prog = this.ferryProgress[ferry.id] || { index: 10, forward: true };
      let nextIndex = prog.forward ? prog.index + 1 : prog.index - 1;

      // Reverse direction if reaching terminus
      if (nextIndex >= totalWaypoints - 1) {
        prog.forward = false;
        nextIndex = totalWaypoints - 2;
      } else if (nextIndex <= 1) {
        prog.forward = true;
        nextIndex = 2;
      }
      prog.index = nextIndex;
      this.ferryProgress[ferry.id] = prog;

      const currentCoord = COOUM_RIVER_CHANNEL[prog.index];
      const prevCoord = COOUM_RIVER_CHANNEL[prog.forward ? prog.index - 1 : prog.index + 1] || currentCoord;

      // Calculate bearing angle
      const dLat = currentCoord[0] - prevCoord[0];
      const dLng = currentCoord[1] - prevCoord[1];
      let heading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI);
      if (heading < 0) heading += 360;

      // Realistic speed fluctuation (16 to 21 km/h)
      const speedKmh = Math.round((16.5 + Math.random() * 3.5) * 10) / 10;
      const etaNextMin = Math.max(1, Math.round(ferry.etaNextMin - 0.2 < 1 ? 4 + Math.random() * 3 : ferry.etaNextMin - 0.2));

      return {
        ...ferry,
        lat: currentCoord[0],
        lng: currentCoord[1],
        headingDeg: heading,
        speedKmh,
        etaNextMin,
        lastUpdated: 'Just now',
      };
    });

    this.notify();
  }

  private notify() {
    const copy = [...this.ferries];
    this.listeners.forEach(cb => cb(copy));
  }
}

export const gpsSimulator = new GPSSimulator();
