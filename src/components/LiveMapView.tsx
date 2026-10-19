import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Gauge,
  Battery,
  Users,
  Clock,
  X,
  Layers,
  ArrowRight,
  Waves,
} from 'lucide-react';
import { FerryIcon, FerryDockIcon } from './icons';
import { ferryMarkerHtml, terminalMarkerHtml, stopMarkerHtml } from '../lib/mapMarkers';
import { Ferry, Language } from '../types';
import { STATIONS, ROUTE_COLOR } from '../data/mockData';
import {
  COOUM_RIVER_CHANNEL,
  STATIONS_GEO,
  RESTRICTED_ZONES,
  ROUTE_PATHS,
  ROUTE_BOUNDS,
  COOUM_CORRIDOR_MAX_BOUNDS,
} from '../data/geoData';
import { OPENCITY_WATERBODIES } from '../data/waterbodiesData';

interface LiveMapViewProps {
  ferries: Ferry[];
  language: Language;
  onBookStation?: (code: string) => void;
  initialRouteFilter?: 'ALL' | 'C1' | 'C2' | 'C3';
}

export type MapStyle = 'landscape' | 'satellite';

const MAP_TILES: Record<MapStyle, { nameEn: string; nameTa: string; url: string; subdomains: string[]; attribution: string }> = {
  landscape: {
    nameEn: 'Google Landscape',
    nameTa: 'நிலப்பரப்பு (Google)',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps (Physical Landscape & Terrain)',
  },
  satellite: {
    nameEn: 'Google Satellite',
    nameTa: 'செயற்கைக்கோள்',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    attribution: '&copy; Google Maps (Satellite)',
  },
};

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  ferries,
  language,
  onBookStation,
  initialRouteFilter = 'ALL',
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const ferryMarkersRef = useRef<Record<string, L.Marker>>({});
  const routePolylinesRef = useRef<Record<string, { casing: L.Polyline; line: L.Polyline; core: L.Polyline }>>({});
  
  const [mapStyle, setMapStyle] = useState<MapStyle>('landscape');
  const [selectedFerry, setSelectedFerry] = useState<Ferry | null>(ferries[0] || null);
  const [activeRouteFilter, setActiveRouteFilter] = useState<'ALL' | 'C1' | 'C2' | 'C3'>(initialRouteFilter);
  const [selectedStation, setSelectedStation] = useState<typeof STATIONS_GEO[0] | null>(null);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);

  // Initialize Leaflet Map focused strictly on the Cooum River & Riverside Corridor
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on central Chennai / Cooum riverway with bounded constraints
    const map = L.map(mapContainerRef.current, {
      center: [13.0725, 80.2150],
      zoom: 13,
      minZoom: 12, // Keeps user from zooming out into space; stays focused on river corridor
      maxZoom: 19,
      maxBounds: COOUM_CORRIDOR_MAX_BOUNDS, // Confines map pan strictly to the river & riverside
      maxBoundsViscosity: 0.9,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer: Google Landscape / Terrain
    const initialConfig = MAP_TILES[mapStyle];
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      subdomains: initialConfig.subdomains,
      maxZoom: 20,
    }).addTo(map);
    currentTileLayerRef.current = tileLayer;

    // Authentic OpenCity / GCC Cooum River Water Body Polygon
    L.polygon(
      [
        OPENCITY_WATERBODIES.coovum.outer,
        ...(OPENCITY_WATERBODIES.coovum.inner ? [OPENCITY_WATERBODIES.coovum.inner] : []),
      ],
      {
        color: '#0284c7',
        weight: 1.5,
        fillColor: '#38bdf8',
        fillOpacity: 0.45,
        lineJoin: 'round',
      }
    )
      .bindTooltip(
        '<b>🌊 Cooum River (OpenCity / GCC Waterbody)</b><br/><span style="color:#0b647a;">கூவம் ஆறு நீர்ப்பரப்பு</span>',
        { direction: 'top', sticky: true }
      )
      .addTo(map);

    // Upstream River Channel Connection (Poonamallee - Senneerkuppam - Maduravoyal)
    L.polyline(COOUM_RIVER_CHANNEL.slice(0, 16), {
      color: '#0284c7',
      weight: 10,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    L.polyline(COOUM_RIVER_CHANNEL.slice(0, 16), {
      color: '#38bdf8',
      weight: 6,
      opacity: 0.55,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Dedicated Ferry Route Paths (Only showing the ferry path alone)
    (['C1', 'C2', 'C3'] as const).forEach((code) => {
      const path = ROUTE_PATHS[code];
      const color = ROUTE_COLOR[code];

      // 1. Subtle dark casing for crisp definition against terrain
      const casing = L.polyline(path, {
        color: '#071822',
        weight: 7,
        opacity: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // 2. Primary vibrant ferry path
      const line = L.polyline(path, {
        color: color,
        weight: 4.5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // 3. Navigation fairway track centerline
      const core = L.polyline(path, {
        color: '#ffffff',
        weight: 1.5,
        opacity: 0.85,
        dashArray: '5, 7',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylinesRef.current[code] = { casing, line, core };
    });

    // 5. Restricted Navigation Safety Zones
    RESTRICTED_ZONES.forEach((zone) => {
      const isWetland = zone.id === 'ZONE_ECO_CHETPET';
      L.polygon(zone.polygon, {
        color: isWetland ? '#10b981' : '#f59e0b',
        fillColor: isWetland ? '#10b981' : '#f59e0b',
        fillOpacity: 0.16,
        weight: 1.5,
        dashArray: '4, 4',
      })
        .bindTooltip(`<b>⚠️ ${zone.name}</b><br/>${zone.reason}`, {
          direction: 'top',
        })
        .addTo(map);
    });

    // 6. Terminals & Intermediate Station Stops (Distinct markers along the river)
    STATIONS_GEO.forEach((stn) => {
      const isTerminal = stn.type === 'TERMINAL';
      const color = isTerminal ? '#0b647a' : '#0284c7';
      const icon = L.divIcon({
        html: isTerminal
          ? terminalMarkerHtml(color, stn.code, stn.nameEn)
          : stopMarkerHtml(color, stn.code),
        className: '',
        iconSize: isTerminal ? [36, 48] : [24, 34],
        iconAnchor: isTerminal ? [18, 20] : [12, 12],
      });

      const fullStation = STATIONS.find((s) => s.code === stn.code);
      const marker = L.marker(stn.coords, { icon })
        .on('click', () => {
          setSelectedStation(stn);
          map.flyTo(stn.coords, 15, { duration: 0.8 });
        })
        .bindTooltip(
          `<b>${isTerminal ? '⭐ TERMINAL: ' : '📍 '}${stn.nameEn}</b> (${stn.code})<br/><span style="color:#0b647a;font-weight:600;">${stn.nameTa}</span>${
            fullStation?.interchanges ? `<br/><span style="color:#667078;font-size:10px;">${fullStation.interchanges.join(' • ')}</span>` : ''
          }`,
          { direction: 'top', offset: [0, isTerminal ? -22 : -14] }
        )
        .addTo(map);

      if (isTerminal) {
        marker.setZIndexOffset(200);
      }
    });

    // Initial River Corridor Fit
    map.fitBounds(ROUTE_BOUNDS.ALL, { padding: [30, 30] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      routePolylinesRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Map Style Switcher (Landscape / Satellite)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const config = MAP_TILES[mapStyle];
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      subdomains: config.subdomains,
      maxZoom: 20,
    }).addTo(map);

    currentTileLayerRef.current = newTileLayer;
    newTileLayer.bringToBack();
  }, [mapStyle]);

  // Update Route Polylines visual emphasis based on active filter (shows only ferry path alone)
  useEffect(() => {
    const polylines = routePolylinesRef.current;
    if (!polylines) return;

    Object.entries(polylines).forEach(([code, group]) => {
      if (activeRouteFilter === 'ALL') {
        group.casing.setStyle({ opacity: 0.5, weight: 7 });
        group.line.setStyle({ opacity: 0.95, weight: 4.5, color: ROUTE_COLOR[code] || '#0284c7' });
        group.core.setStyle({ opacity: 0.85, weight: 1.5 });
      } else if (activeRouteFilter === code) {
        group.casing.setStyle({ opacity: 0.75, weight: 9 });
        group.line.setStyle({ opacity: 1, weight: 6, color: ROUTE_COLOR[code] || '#0284c7' });
        group.core.setStyle({ opacity: 0.95, weight: 2 });
        group.casing.bringToFront();
        group.line.bringToFront();
        group.core.bringToFront();
      } else {
        // Hide other routes completely: only the selected ferry path is shown
        group.casing.setStyle({ opacity: 0 });
        group.line.setStyle({ opacity: 0 });
        group.core.setStyle({ opacity: 0 });
      }
    });
  }, [activeRouteFilter]);

  // Update Ferry Fleet Markers with Real-Time Telemetry
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    ferries.forEach((ferry) => {
      if (activeRouteFilter !== 'ALL' && ferry.routeId !== activeRouteFilter) {
        if (ferryMarkersRef.current[ferry.id]) {
          ferryMarkersRef.current[ferry.id].remove();
          delete ferryMarkersRef.current[ferry.id];
        }
        return;
      }

      const color = ROUTE_COLOR[ferry.routeId] || '#0b647a';
      const isSelected = selectedFerry?.id === ferry.id;
      const icon = L.divIcon({
        html: ferryMarkerHtml(color, ferry.headingDeg, ferry.hullNumber, isSelected),
        className: '',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      if (ferryMarkersRef.current[ferry.id]) {
        ferryMarkersRef.current[ferry.id].setLatLng([ferry.lat, ferry.lng]);
        ferryMarkersRef.current[ferry.id].setIcon(icon);
      } else {
        const marker = L.marker([ferry.lat, ferry.lng], { icon })
          .on('click', () => {
            setSelectedFerry(ferry);
            setSelectedStation(null);
            map.flyTo([ferry.lat, ferry.lng], 15, { duration: 0.8 });
          })
          .bindTooltip(
            `<b>${ferry.name}</b> (${ferry.hullNumber})<br/><b>Line ${ferry.routeId}</b> • ${ferry.speedKmh} km/h • Next: ${ferry.nextStationId}`,
            { direction: 'top', offset: [0, -18] }
          )
          .addTo(map);

        ferryMarkersRef.current[ferry.id] = marker;
      }
    });
  }, [ferries, activeRouteFilter, selectedFerry]);

  // Smooth Focus Functions
  const focusRoute = (routeCode: 'ALL' | 'C1' | 'C2' | 'C3') => {
    setActiveRouteFilter(routeCode);
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = ROUTE_BOUNDS[routeCode];
    if (bounds) {
      map.flyToBounds(bounds, {
        padding: [45, 45],
        duration: 1.2,
      });
    }
  };

  const focusFerry = (f: Ferry) => {
    setSelectedFerry(f);
    setSelectedStation(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([f.lat, f.lng], 15, { duration: 1 });
    }
  };

  const resetRiverFocus = () => {
    setActiveRouteFilter('ALL');
    setSelectedFerry(null);
    setSelectedStation(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyToBounds(ROUTE_BOUNDS.ALL, {
        padding: [30, 30],
        duration: 1.2,
      });
    }
  };

  const nextStn = STATIONS.find((s) => s.code === selectedFerry?.nextStationId);
  const activeFleetCount = ferries.filter(
    (f) => activeRouteFilter === 'ALL' || f.routeId === activeRouteFilter
  ).length;

  return (
    <div className="relative w-full h-[calc(100dvh-4.5rem-4rem)] lg:h-[calc(100dvh-4.5rem)] bg-surface-2 overflow-hidden text-content">
      {/* Underlying Geographic Google Maps & Leaflet Layer */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating River Control Bar */}
      <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        
        {/* Left: Route Focus Filter Pills */}
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-md border border-line rounded-2xl p-1 shadow-md flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar">
          {(['ALL', 'C1', 'C2', 'C3'] as const).map((r) => {
            const isActive = activeRouteFilter === r;
            const color = r === 'ALL' ? '#111315' : ROUTE_COLOR[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => focusRoute(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-inverse text-white shadow-xs'
                    : 'text-muted hover:text-content hover:bg-surface-2'
                }`}
              >
                {r !== 'ALL' && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span>
                  {r === 'ALL'
                    ? t('Cooum River Fairway', 'கூவம் நீர்வழிப் பாதை')
                    : `Line ${r}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Map View Style Switcher + River Center Reset */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Layer Style Switcher Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStyleMenuOpen(!isStyleMenuOpen)}
              className="bg-surface/95 backdrop-blur-md border border-line hover:border-brand rounded-xl px-3 py-1.5 shadow-md text-xs font-bold text-content flex items-center gap-1.5 cursor-pointer touch-manipulation transition-all"
              title="Change Map Style"
            >
              <Layers className="w-3.5 h-3.5 text-brand-text" />
              <span className="hidden sm:inline">
                {language === 'en' ? MAP_TILES[mapStyle].nameEn : MAP_TILES[mapStyle].nameTa}
              </span>
            </button>

            {isStyleMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-line rounded-2xl p-1.5 shadow-xl z-30 space-y-1">
                {(['landscape', 'satellite'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setMapStyle(style);
                      setIsStyleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      mapStyle === style
                        ? 'bg-brand-tint text-brand-text'
                        : 'text-content hover:bg-surface-2'
                    }`}
                  >
                    <span>{language === 'en' ? MAP_TILES[style].nameEn : MAP_TILES[style].nameTa}</span>
                    {mapStyle === style && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Re-center strictly to River Corridor */}
          <button
            type="button"
            onClick={resetRiverFocus}
            className="bg-surface/95 backdrop-blur-md border border-line hover:border-brand rounded-xl px-3 py-1.5 shadow-md text-brand-text text-xs font-bold flex items-center gap-1.5 cursor-pointer touch-manipulation transition-all"
            title={t('Focus River Flow', 'ஆற்றங்கரை பாதையை மையப்படுத்து')}
            aria-label="Focus River Flow"
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('River Corridor', 'ஆற்றுப் பாதை')}</span>
          </button>
        </div>
      </div>

      {/* Floating Network Legend (Terminals ⭐ vs Stops 📍) */}
      <div className="absolute top-16 left-3.5 z-10 hidden sm:flex items-center gap-2 pointer-events-none">
        <div className="bg-surface/95 backdrop-blur-md border border-line rounded-full px-3.5 py-1.5 shadow-sm text-[11px] font-medium flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-brand flex items-center justify-center text-[7px] text-white font-bold">T</span>
            <span className="font-bold text-content">5 Terminals</span>
          </div>
          <span className="text-muted">•</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#0284c7] bg-surface"></span>
            <span className="text-muted">5 Stops</span>
          </div>
          <span className="text-muted">•</span>
          <div className="flex items-center gap-1.5 font-mono text-brand-text font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeFleetCount} Catamarans</span>
          </div>
        </div>
      </div>

      {/* Selected Station Detail Card (When user clicks a terminal or stop marker) */}
      {selectedStation && (
        <aside
          className="absolute bottom-24 lg:bottom-6 left-3.5 z-20 w-[min(92vw,360px)] bg-surface border border-line rounded-3xl p-4 sm:p-5 shadow-2xl animate-in fade-in duration-200"
          aria-label="Selected Station Details"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-tint border border-brand-line text-brand-text flex items-center justify-center font-bold text-xs font-mono">
                {selectedStation.code}
              </div>
              <div>
                <h3 className="font-bold text-content text-sm leading-tight">
                  {language === 'en' ? selectedStation.nameEn : selectedStation.nameTa}
                </h3>
                <span className="text-[11px] text-muted font-medium">
                  {selectedStation.type === 'TERMINAL' ? (
                    <strong className="text-brand-text font-bold">⭐ {t('Major Multimodal Terminal', 'முதன்மை முனையம்')}</strong>
                  ) : (
                    <span>📍 {t('Riverside Station Stop', 'ஆற்றங்கரை நிறுத்தம்')}</span>
                  )}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStation(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-content hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-2 border border-line flex items-center justify-between">
              <span className="text-muted font-medium">{t('Pontoons & Berthing', 'படகு நிறுத்தும் தளங்கள்')}</span>
              <span className="font-mono font-bold text-brand-text">{selectedStation.pontoons} Pontoons</span>
            </div>

            <p className="text-[11px] text-muted leading-snug px-1">
              {selectedStation.description}
            </p>

            {onBookStation && (
              <button
                type="button"
                onClick={() => onBookStation(selectedStation.code)}
                className="mt-3 w-full primary-button !py-2.5 text-xs !justify-center"
              >
                <span>{t('Plan Trip from this Location', 'இங்கிருந்து பயணத்தைத் தொடங்கு')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Selected Ferry HUD Bottom Card */}
      {selectedFerry && !selectedStation && (
        <aside
          className="absolute bottom-24 lg:bottom-6 left-3.5 z-20 w-[min(92vw,360px)] bg-surface border border-line rounded-3xl p-4 sm:p-5 shadow-2xl"
          aria-label="Selected Boat Details"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs"
                style={{ backgroundColor: ROUTE_COLOR[selectedFerry.routeId] || '#0b647a' }}
              >
                {selectedFerry.routeId}
              </div>
              <div>
                <h3 className="font-bold text-content text-sm leading-tight">
                  {selectedFerry.name}
                </h3>
                <span className="text-xs font-mono text-muted">
                  {selectedFerry.hullNumber} • Capt. {selectedFerry.captainName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-md bg-brand-tint text-brand-text border border-brand-line text-[10px] font-bold inline-flex items-center gap-1">
                <FerryIcon className="w-3 h-3" />
                UNDERWAY
              </span>
              <button
                type="button"
                onClick={() => setSelectedFerry(null)}
                aria-label={t('Hide boat details', 'படகு விவரங்களை மறை')}
                title={t('Hide', 'மறை')}
                className="w-7 h-7 -mr-1 rounded-lg flex items-center justify-center text-muted hover:text-content hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1 text-center text-xs">
            <div className="p-2 rounded-xl bg-surface-2 border border-line">
              <span className="text-[9px] uppercase font-bold text-muted flex items-center justify-center gap-1">
                <Gauge className="w-3 h-3 text-brand-text" />
                {t('Speed', 'வேகம்')}
              </span>
              <span className="text-sm font-bold text-content font-mono mt-0.5 block">
                {selectedFerry.speedKmh} km/h
              </span>
            </div>
            <div className="p-2 rounded-xl bg-surface-2 border border-line">
              <span className="text-[9px] uppercase font-bold text-muted flex items-center justify-center gap-1">
                <Battery className="w-3 h-3 text-brand-text" />
                {t('Battery', 'மின்கலம்')}
              </span>
              <span className="text-sm font-bold text-brand-text font-mono mt-0.5 block">
                {selectedFerry.batteryPct}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-surface-2 border border-line">
              <span className="text-[9px] uppercase font-bold text-muted flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-brand-text" />
                {t('Pax', 'பயணிகள்')}
              </span>
              <span className="text-sm font-bold text-content font-mono mt-0.5 block">
                {selectedFerry.occupancy}/{selectedFerry.capacity}
              </span>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-xl bg-surface-2 border border-line flex items-center justify-between text-xs">
            <div>
              <span className="text-muted block text-[9px] uppercase font-bold flex items-center gap-1">
                <FerryDockIcon className="w-3 h-3 text-brand-text" />
                {t('Next Stop', 'அடுத்த நிறுத்தம்')}
              </span>
              <span className="font-bold text-content">
                {nextStn ? (language === 'en' ? nextStn.nameEn : nextStn.nameTa) : selectedFerry.nextStationId}
              </span>
            </div>
            <div className="text-right">
              <span className="text-muted block text-[9px] uppercase font-bold flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-brand-text" />
                {t('ETA', 'வருகை')}
              </span>
              <span className="text-sm font-bold text-brand-text font-mono">
                {selectedFerry.etaNextMin} min
              </span>
            </div>
          </div>

          {onBookStation && (
            <button
              type="button"
              onClick={() => onBookStation(selectedFerry.nextStationId)}
              className="mt-3 w-full primary-button !py-2.5 text-xs !justify-center"
            >
              {t('Book Trip to this Stop', 'இந்த நிறுத்தத்திற்கு பதிவு')}
            </button>
          )}
        </aside>
      )}

      {/* Fleet Live Quick Selector Drawer (Right Side on Desktop) */}
      <div className="hidden lg:block absolute top-16 right-3.5 z-20 w-64 bg-surface/95 backdrop-blur-md border border-line rounded-2xl p-3 shadow-lg">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted px-1 py-1 mb-1 border-b border-line pb-2">
          <span>{t('Active Fleet', 'இயங்கும் படகுகள்')}</span>
          <span className="font-mono text-brand-text bg-brand-tint px-1.5 py-0.2 rounded-md">
            {activeFleetCount} Live
          </span>
        </div>
        <div className="space-y-1.5 max-h-[290px] overflow-y-auto pt-1">
          {ferries
            .filter((f) => activeRouteFilter === 'ALL' || f.routeId === activeRouteFilter)
            .map((f) => {
              const isSelected = selectedFerry?.id === f.id;
              const routeColor = ROUTE_COLOR[f.routeId] || '#0b647a';
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => focusFerry(f)}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-inverse text-white font-bold shadow-xs'
                      : 'hover:bg-surface-2 text-content border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[9px] text-white shrink-0"
                      style={{ backgroundColor: routeColor }}
                    >
                      {f.routeId}
                    </span>
                    <span className="font-mono text-xs truncate">{f.hullNumber}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-brand-text'}`}>
                      {f.speedKmh} km/h
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
};
