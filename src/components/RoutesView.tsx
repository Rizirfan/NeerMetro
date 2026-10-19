import React from 'react';
import {
  Clock,
  Navigation,
  Gauge,
  ArrowRight,
  Compass,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { FerryIcon } from './icons';
import { Language, Ferry } from '../types';
import { ROUTES, ROUTE_COLOR, STATIONS } from '../data/mockData';

interface RoutesViewProps {
  language: Language;
  onSelectRouteStations: (origin: string, dest: string) => void;
  ferries?: Ferry[];
  onOpenLiveMap?: () => void;
}

export const RoutesView: React.FC<RoutesViewProps> = ({
  language,
  onSelectRouteStations,
  ferries = [],
  onOpenLiveMap,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);

  return (
    <div className="bg-surface text-content min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 sm:px-[6%]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-tint border border-brand-line text-brand-text text-xs font-bold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>{t('Cooum River Navigation Network', 'கூவம் நீர்வழிப் போக்குவரத்து வலையமைப்பு')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-content tracking-tight leading-tight">
              {t('Transit Lines & Fleet Routes', 'நீர்வழித் தடங்கள் & படகுப் பாதைகள்')}
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-2xl leading-relaxed">
              {t(
                'Station sequences, schedules, headways, and live vessel counts for all three Cooum lines.',
                'கூவம் மூன்று தடங்களின் நிறுத்த வரிசை, அட்டவணை, இடைவெளி மற்றும் நேரலை படகு விவரங்கள்.'
              )}
            </p>
          </div>

          {onOpenLiveMap && (
            <button
              type="button"
              onClick={onOpenLiveMap}
              className="secondary-button !py-2.5 !px-4 text-brand-text text-xs font-bold flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-xs"
            >
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>{t('Open Full Live Map', 'நேரலை வரைபடத்தைத் திற')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* TRANSIT LINE CARDS WITH SEQUENCE & TIMETABLES                */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-content tracking-tight">
              {t('Line Operational Schedules', 'தடங்களின் இயக்க விவரங்கள்')}
            </h2>
            <span className="text-xs text-muted font-mono">
              3 Lines • IRS Marine Certified
            </span>
          </div>

          {ROUTES.map((route) => {
            const first = STATIONS.find((s) => s.code === route.stationCodes[0]);
            const last = STATIONS.find(
              (s) => s.code === route.stationCodes[route.stationCodes.length - 1]
            );
            const routeColor = ROUTE_COLOR[route.routeCode] || '#0b647a';
            const deployedFerries = ferries.filter((f) => f.routeId === route.routeCode);

            return (
              <div
                key={route.id}
                className="p-6 sm:p-8 rounded-3xl bg-surface border border-line hover:border-brand-line transition-colors shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 mb-5 border-b border-line gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base font-mono shadow-sm"
                      style={{ backgroundColor: routeColor }}
                    >
                      {route.routeCode}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-content">
                          {language === 'en' ? route.nameEn : route.nameTa}
                        </h3>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {route.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 font-medium">
                        {first && last
                          ? `${language === 'en' ? first.nameEn : first.nameTa} ⇄ ${
                              language === 'en' ? last.nameEn : last.nameTa
                            }`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Route Quick Metrics */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted">
                    <div className="flex items-center space-x-1.5 bg-surface-2 px-3 py-1.5 rounded-xl border border-line">
                      <Navigation className="w-3.5 h-3.5 text-brand-text" />
                      <span className="font-bold text-content">{route.totalDistanceKm} km</span>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-surface-2 px-3 py-1.5 rounded-xl border border-line">
                      <Gauge className="w-3.5 h-3.5 text-brand-text" />
                      <span className="font-bold text-content">{route.speedLimitKmh} km/h</span>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-surface-2 px-3 py-1.5 rounded-xl border border-line">
                      <Clock className="w-3.5 h-3.5 text-brand-text" />
                      <span className="font-bold text-content">
                        {route.frequencyMinutes} {t('min headway', 'நிமி இடைவெளி')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-brand-tint px-3 py-1.5 rounded-xl border border-brand-line text-brand-text">
                      <FerryIcon className="w-3.5 h-3.5" />
                      <span className="font-bold">
                        {deployedFerries.length} {t('Vessels', 'படகுகள்')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stop Sequence Strip */}
                <div className="mb-6">
                  <span className="text-[10px] uppercase font-bold text-muted block mb-2 tracking-wider">
                    {t('Route Station Sequence & Interchanges', 'நிறுத்தங்களின் வரிசை & இணைப்புகள்')}:
                  </span>
                  <div className="overflow-x-auto pb-2 -mx-1 px-1">
                    <div className="flex items-center space-x-2 min-w-max py-1">
                      {route.stationCodes.map((stnCode, idx) => {
                        const stn = STATIONS.find((s) => s.code === stnCode);
                        return (
                          <React.Fragment key={stnCode}>
                            <button
                              type="button"
                              onClick={() =>
                                onSelectRouteStations(
                                  stnCode,
                                  route.stationCodes[route.stationCodes.length - 1]
                                )
                              }
                              className="p-3 rounded-2xl bg-surface-2 hover:bg-brand-tint border border-line hover:border-brand text-left transition-colors cursor-pointer group shadow-2xs"
                            >
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <span
                                  className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md text-white"
                                  style={{ backgroundColor: routeColor }}
                                >
                                  {stnCode}
                                </span>
                                {stn?.pontoons && (
                                  <span className="text-[10px] font-mono text-muted">
                                    {stn.pontoons}P
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-content group-hover:text-brand-text">
                                {stn ? (language === 'en' ? stn.nameEn : stn.nameTa) : stnCode}
                              </div>
                              {stn?.interchanges && stn.interchanges.length > 0 && (
                                <div className="text-[9px] text-muted mt-1 max-w-[130px] truncate">
                                  {stn.interchanges[0]}
                                </div>
                              )}
                            </button>

                            {idx < route.stationCodes.length - 1 && (
                              <div className="text-muted px-1 font-bold">→</div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Action CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-line gap-3">
                  <div className="text-xs text-muted flex items-center gap-3 w-full sm:w-auto">
                    <span>
                      {t('First Boat', 'முதல் படகு')}: <strong className="text-content font-mono">{route.firstDeparture}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {t('Last Boat', 'கடைசி படகு')}: <strong className="text-content font-mono">{route.lastDeparture}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {onOpenLiveMap && (
                      <button
                        type="button"
                        onClick={onOpenLiveMap}
                        className="flex-1 sm:flex-initial secondary-button !py-2.5 !px-3.5 text-xs text-brand-text font-bold"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>{t('View on Live Map', 'நேரலை வரைபடத்தில் காண்க')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onSelectRouteStations(
                          route.stationCodes[0],
                          route.stationCodes[route.stationCodes.length - 1]
                        )
                      }
                      className="flex-1 sm:flex-initial primary-button !py-2.5 !px-4 text-xs font-bold !justify-center"
                    >
                      <span>{t('Book this Route', 'இந்த வழித்தடத்தில் பதிவு')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
