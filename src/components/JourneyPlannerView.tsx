import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  MapPin,
  Footprints,
  ChevronDown,
  Route,
  Zap,
  Coins,
} from 'lucide-react';
import { FerryIcon, FerryDockIcon } from './icons';
import { JourneyPlan, Language } from '../types';
import { STATIONS } from '../data/mockData';
import { stationName } from '../lib/stationName';
import { planJourneys } from '../services/journeyPlanner';

interface JourneyPlannerViewProps {
  initialOrigin: string;
  initialDestination: string;
  onOriginChange?: (origin: string) => void;
  onDestinationChange?: (destination: string) => void;
  language: Language;
  onBookPlan: (plan: JourneyPlan) => void;
  onOpenLiveMap: () => void;
}

export const JourneyPlannerView: React.FC<JourneyPlannerViewProps> = ({
  initialOrigin,
  initialDestination,
  onOriginChange,
  onDestinationChange,
  language,
  onBookPlan,
  onOpenLiveMap,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const [origin, setOrigin] = useState(initialOrigin || 'KOY');
  const [destination, setDestination] = useState(initialDestination || 'EGM');
  const [filterType, setFilterType] = useState<'ALL' | 'FASTEST' | 'CHEAPEST'>('ALL');
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  // Synchronize origin and destination when props change (e.g., from voice assistant commands)
  useEffect(() => {
    if (initialOrigin) {
      setOrigin(initialOrigin);
    }
  }, [initialOrigin]);

  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
    }
  }, [initialDestination]);

  const plans = planJourneys(origin, destination);
  const filteredPlans = plans.filter((p) => {
    if (filterType === 'FASTEST') return p.planType === 'FASTEST';
    if (filterType === 'CHEAPEST') return p.planType === 'CHEAPEST';
    return true;
  });

  const handleSwap = () => {
    const tempOrigin = destination;
    const tempDest = origin;
    setOrigin(tempOrigin);
    setDestination(tempDest);
    onOriginChange?.(tempOrigin);
    onDestinationChange?.(tempDest);
  };

  const togglePlanExpanded = (id: string) => {
    setExpandedPlans((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-surface text-content min-h-[calc(100vh-4rem)] py-6 sm:py-14 px-4 sm:px-[6%]">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-5 sm:mb-8 pb-4 sm:pb-5 border-b border-line">
          <h1 className="text-[26px] sm:text-3xl font-extrabold text-content tracking-tight leading-none">
            {t('Plan Journey', 'பயணத் திட்டம்')}
          </h1>
          <p className="text-[13px] sm:text-sm text-muted mt-1.5 max-w-xl leading-snug">
            {t(
              'Find optimal routes, transfers, and departure schedules across the waterway.',
              'வேகமான படகு வழிகள், இணைப்புகள் மற்றும் புறப்பாடு நேரங்களைக் காண்க.'
            )}
          </p>
        </div>

        {/* Search Console Card */}
        <div className="p-4 sm:p-7 rounded-2xl bg-surface border border-line shadow-xs mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3 relative">

            {/* Origin Terminal */}
            <div className="p-3 bg-surface-2 border border-line rounded-xl">
              <label htmlFor="jp-origin" className="block text-[11px] font-bold text-muted">
                {t('From', 'புறப்படும் இடம்')}
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <FerryDockIcon className="w-4 h-4 text-brand-text shrink-0" />
                <select
                  id="jp-origin"
                  value={origin}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOrigin(val);
                    onOriginChange?.(val);
                  }}
                  aria-label={t('Departure terminal', 'புறப்படும் முனையம்')}
                  className="w-full min-w-0 bg-transparent text-content font-bold text-base sm:text-sm py-1.5 focus:outline-none cursor-pointer touch-manipulation truncate"
                >
                  {STATIONS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {stationName(s.code, language)} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Central Swap Terminals Button — Unified on all viewports */}
            <button
              type="button"
              onClick={handleSwap}
              aria-label={t('Swap Terminals', 'முனையங்களை மாற்று')}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-brand to-brand-strong text-white border-2 border-white shadow-md flex items-center justify-center transition-all z-20 active:scale-90 cursor-pointer ring-2 ring-brand/20 touch-manipulation group"
              title={t('Swap Terminals', 'முனையங்களை மாற்று')}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:rotate-180 group-active:rotate-180" />
            </button>

            {/* Destination Terminal */}
            <div className="p-3 bg-surface-2 border border-line rounded-xl">
              <label htmlFor="jp-dest" className="block text-[11px] font-bold text-muted">
                {t('To', 'சேரும் இடம்')}
              </label>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="w-4 h-4 text-brand-text shrink-0" />
                <select
                  id="jp-dest"
                  value={destination}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDestination(val);
                    onDestinationChange?.(val);
                  }}
                  aria-label={t('Arrival terminal', 'சேரும் முனையம்')}
                  className="w-full min-w-0 bg-transparent text-content font-bold text-base sm:text-sm py-1.5 focus:outline-none cursor-pointer touch-manipulation truncate"
                >
                  {STATIONS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {stationName(s.code, language)} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filter Pills — horizontally scrollable on mobile */}
          <div className="mt-4 pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 pb-0.5 sm:mx-0 sm:px-0 sm:pb-0">
              <span className="text-xs font-bold text-muted shrink-0 hidden sm:inline">
                {t('Filter:', 'வடிகட்டி:')}
              </span>
              {(['ALL', 'FASTEST', 'CHEAPEST'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterType(f)}
                  className={`px-3.5 py-2 sm:py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[38px] sm:min-h-0 touch-manipulation inline-flex items-center gap-1.5 ${
                    filterType === f
                      ? 'active-card'
                      : 'bg-surface-2 text-content hover:bg-line border border-line'
                  }`}
                >
                  {f === 'ALL' && t('All Options', 'அனைத்தும்')}
                  {f === 'FASTEST' && (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      {t('Fastest', 'வேகமானது')}
                    </>
                  )}
                  {f === 'CHEAPEST' && (
                    <>
                      <Coins className="w-3.5 h-3.5" />
                      {t('Cheapest', 'குறைந்த கட்டணம்')}
                    </>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenLiveMap}
              className="shrink-0 flex items-center justify-center gap-1.5 text-xs font-bold text-brand-text hover:text-brand-text transition-colors cursor-pointer py-1 touch-manipulation"
            >
              <Route className="w-3.5 h-3.5" />
              {t('Live Map', 'நேரலை வரைபடம்')}
            </button>
          </div>
        </div>

        {/* Results Count */}
        {filteredPlans.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted font-mono">
              {filteredPlans.length} {t('journey options', 'பயண விருப்பங்கள்')}
            </span>
          </div>
        )}

        {/* Empty State */}
        {filteredPlans.length === 0 && (
          <div className="p-8 sm:p-10 rounded-2xl bg-surface border border-line shadow-xs text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-tint border border-brand-line flex items-center justify-center">
              <FerryIcon className="w-5 h-5 text-brand-text" />
            </div>
            <h3 className="mt-3.5 text-[17px] font-bold text-content">
              {origin === destination
                ? t('Origin and destination are the same', 'புறப்படும் இடமும் சேரும் இடமும் ஒன்று')
                : t('No options match this filter', 'இந்த வடிகட்டிக்கு பொருந்தும் விருப்பங்கள் இல்லை')}
            </h3>
            <p className="mt-1.5 text-[13px] text-muted max-w-sm mx-auto leading-snug">
              {origin === destination
                ? t(
                    'Pick two different terminals to see ferry options.',
                    'படகு விருப்பங்களைக் காண வேறு முனையங்களைத் தேர்ந்தெடுக்கவும்.'
                  )
                : t('Try showing all available journey options.', 'அனைத்து விருப்பங்களையும் காண முயற்சிக்கவும்.')}
            </p>
            <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2">
              {origin === destination ? (
                <button
                  type="button"
                  onClick={handleSwap}
                  className="secondary-button !py-3.5 min-h-[48px] touch-manipulation"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {t('Swap terminals', 'முனையங்களை மாற்று')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className="secondary-button !py-3.5 min-h-[48px] touch-manipulation"
                >
                  {t('Show all options', 'அனைத்து விருப்பங்களையும் காட்டு')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Journey Option Cards */}
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const isExpanded = !!expandedPlans[plan.id];
            return (
              <div
                key={plan.id}
                className="p-4 sm:p-7 rounded-2xl bg-surface border border-line sm:hover:border-brand transition-colors shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-6 pb-4 mb-4 border-b border-line">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-brand-tint border border-brand-line text-brand-text text-[10px] font-bold uppercase tracking-wider font-mono">
                        {language === 'en' ? plan.titleEn : plan.titleTa}
                      </span>
                      <span className="text-xs text-muted">
                        {plan.transfers === 0
                          ? t('Direct crossing', 'நேரடி பயணம்')
                          : `${plan.transfers} ${t('transfer', 'இணைப்பு')}`}
                      </span>
                    </div>
                    <div className="mt-2 text-[26px] sm:text-2xl font-bold text-content tracking-tight leading-none">
                      {plan.totalDurationMin}{' '}
                      <span className="text-sm font-normal text-muted">{t('min', 'நிமி')}</span>
                      <span className="ml-2 text-[11px] font-mono font-normal text-muted align-middle">
                        ({plan.departureTime} → {plan.arrivalTime})
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1.5 truncate">
                      {language === 'en' ? plan.summaryEn : plan.summaryTa}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-2.5 shrink-0">
                    <div className="sm:text-right">
                      <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">
                        {t('Fare', 'கட்டணம்')}
                      </span>
                      <span className="text-[26px] sm:text-2xl font-bold text-content font-mono leading-none">
                        ₹{plan.totalFareInr}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBookPlan(plan)}
                      className="primary-button flex-1 sm:flex-none !py-3.5 sm:!py-2.5 !px-5 text-[13px] min-h-[48px] sm:min-h-0 touch-manipulation"
                    >
                      <span>{t('Book Ticket', 'சீட்டு பதிவு')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Itinerary Steps — collapsed by default on mobile, always open on desktop */}
                <button
                  type="button"
                  onClick={() => togglePlanExpanded(plan.id)}
                  aria-expanded={isExpanded}
                  className="lg:hidden w-full flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-line text-xs font-bold text-content cursor-pointer touch-manipulation active:scale-[0.99] transition-transform"
                >
                  <span>
                    {t('Itinerary steps', 'பயண வழிகள்')} · {plan.legs.length}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`${
                    isExpanded ? 'block' : 'hidden'
                  } lg:block mt-3 lg:mt-0 space-y-2`}
                >
                  <span className="hidden lg:block text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                    {t('Itinerary Steps', 'பயண வழிகள்')}
                  </span>
                  {plan.legs.map((leg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-surface-2 border border-line flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            leg.mode === 'WATER_METRO'
                              ? 'bg-brand-tint text-brand-text'
                              : 'bg-line text-content'
                          }`}
                        >
                          {leg.mode === 'WATER_METRO' ? (
                            <FerryIcon className="w-4 h-4" />
                          ) : (
                            <Footprints className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-content truncate">
                            {leg.mode === 'WATER_METRO' ? (
                              <span>
                                {leg.routeCode} • {stationName(leg.from, language)} → {stationName(leg.to, language)}
                              </span>
                            ) : (
                              <span>
                                {t('Walk connection', 'நடந்து செல்லவும்')} • {leg.from} → {leg.to}
                              </span>
                            )}
                          </div>
                          {leg.intermediateStops && leg.intermediateStops.length > 0 && (
                            <div className="text-[11px] text-muted mt-0.5 truncate">
                              {t('via', 'வழியாக')} {leg.intermediateStops.join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right font-mono text-content font-bold shrink-0">
                        {leg.durationMin} min
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
