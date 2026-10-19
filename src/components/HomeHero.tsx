import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeftRight,
  MapPin,
  ArrowRight,
  Clock,
  Radar,
  Calendar,
  Mic,
} from 'lucide-react';
import { FerryDockIcon } from './icons';
import { STATIONS, ROUTES, ROUTE_COLOR } from '../data/mockData';
import { DEPARTURES, departureFare, fareBetween } from '../data/schedules';
import { stationName } from '../lib/stationName';
import { Language, Ferry } from '../types';
import { planJourneys } from '../services/journeyPlanner';

interface HomeHeroProps {
  onSearch: (origin: string, destination: string) => void;
  openVoiceAssistant: () => void;
  onOpenLiveMap: () => void;
  language: Language;
  liveFerries: Ferry[];
  onOpenTab?: (tab: string) => void;
  initialOrigin?: string;
  initialDestination?: string;
  onOriginChange?: (origin: string) => void;
  onDestinationChange?: (destination: string) => void;
}

const UPCOMING_DEPARTURES = DEPARTURES.slice(-4);

export const HomeHero: React.FC<HomeHeroProps> = ({
  onSearch,
  openVoiceAssistant,
  onOpenLiveMap,
  language,
  liveFerries,
  onOpenTab,
  initialOrigin,
  initialDestination,
  onOriginChange,
  onDestinationChange,
}) => {
  const [origin, setOrigin] = useState(initialOrigin || 'KOY');
  const [destination, setDestination] = useState(initialDestination || 'EGM');

  useEffect(() => {
    if (initialOrigin) setOrigin(initialOrigin);
  }, [initialOrigin]);

  useEffect(() => {
    if (initialDestination) setDestination(initialDestination);
  }, [initialDestination]);

  const t = (en: string, ta: string) => (language === 'en' ? en : ta);

  // Live estimate derived from the same planner the Plan tab uses
  const previewPlan = origin === destination ? null : planJourneys(origin, destination)[0];
  const estimatedFare = previewPlan ? previewPlan.totalFareInr : 0;
  const estimatedTime = previewPlan ? previewPlan.totalDurationMin : 0;
  const estimatedLine =
    previewPlan?.legs.find((l) => l.mode === 'WATER_METRO')?.routeCode || '—';

  // Popular route chips with live fare/time from the planner
  const popularRoutes = useMemo(
    () =>
      [
        { from: 'KOY', to: 'EGM', label: 'Koyambedu → Egmore' },
        { from: 'CHET', to: 'ISLD', label: 'Chetpet → Marina' },
        { from: 'POON', to: 'KOY', label: 'Poonamallee → Koyambedu' },
      ].map((r) => {
        const p = planJourneys(r.from, r.to)[0];
        return {
          ...r,
          meta: p ? `${p.totalDurationMin}m • ₹${p.totalFareInr}` : '',
        };
      }),
    []
  );

  const handleSwap = () => {
    const tempOrigin = destination;
    const tempDest = origin;
    setOrigin(tempOrigin);
    setDestination(tempDest);
    onOriginChange?.(tempOrigin);
    onDestinationChange?.(tempDest);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination && origin !== destination) {
      onSearch(origin, destination);
    }
  };

  const handleQuickRoute = (fromCode: string, toCode: string) => {
    setOrigin(fromCode);
    setDestination(toCode);
    onOriginChange?.(fromCode);
    onDestinationChange?.(toCode);
    onSearch(fromCode, toCode);
  };

  return (
    <div className="bg-surface text-content">
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. HERO BOOKING — stacked on mobile, split on desktop        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="relative border-b border-line overflow-hidden bg-surface">
        {/* Mobile-only atmospheric background (hidden on desktop) */}
        <div className="lg:hidden absolute inset-0 z-0 pointer-events-none">
          <img
            src="/assets/coumetro-hero.jpg"
            alt="NEERMETRO Chennai Waterway"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-inverse/80 via-inverse/60 to-inverse/85" />
        </div>

        {/* Content Grid */}
        <div className="relative z-10 lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center lg:py-16 lg:px-[6%]">
          {/* Desktop left: image card (full quality, no blur) */}
          <div className="hidden lg:block relative rounded-2xl overflow-hidden border border-line shadow-xl h-[520px]">
            <img
              src="/assets/coumetro-hero.jpg"
              alt="NEERMETRO water metro on the Cooum"
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-inverse/50 via-transparent to-transparent" />
          </div>

          {/* Right / centered: heading + booking card */}
          <div className="py-14 sm:py-20 px-4 sm:px-[6%] lg:px-0 lg:py-0 flex flex-col justify-center">
            <div className="max-w-xl mx-auto lg:mx-0 lg:max-w-lg text-center lg:text-left mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/90 lg:bg-brand-tint border border-white/60 lg:border-brand-line shadow-xs mb-3 text-xs font-bold text-brand-text">
                <span>{language === 'en' ? 'Official Water Transit Network' : 'அதிகாரப்பூர்வ நீர்வழிப் போக்குவரத்து'}</span>
              </div>
              <h1 className="text-[34px] sm:text-[40px] lg:text-[44px] font-extrabold text-white lg:text-content tracking-tight leading-tight drop-shadow-md lg:drop-shadow-none">
                {t('Book a Ferry', 'படகு முன்பதிவு')}
              </h1>
              <p className="text-white/80 lg:text-muted text-[13px] sm:text-[15px] mt-2 max-w-md mx-auto lg:mx-0 font-medium drop-shadow-sm">
                {t(
                  'Instant QR boarding passes for Chennai waterway transit.',
                  'சென்னையின் நீர்வழிப் பயணத்திற்கான உடனடி QR சீட்டுகள்.'
                )}
              </p>
            </div>

            {/* Booking Box — card on both mobile and desktop */}
            <div className="w-full max-w-xl mx-auto lg:mx-0 lg:max-w-xl bg-surface/96 backdrop-blur-xl border border-white/50 lg:bg-surface lg:backdrop-blur-none lg:border-line lg:shadow-xl rounded-2xl p-5 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-line">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span className="text-[13px] font-bold text-content">
                  {t('Quick Booking', 'உடனடி பதிவு')}
                </span>
              </div>
              <span className="text-xs font-mono text-brand-text font-bold">
                {liveFerries.length} {t('ferries active', 'படகுகள் இயக்கத்தில்')}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-3 relative">
                
                {/* Origin Terminal */}
                <div className="p-3.5 bg-surface-2 border border-line rounded-xl">
                  <label className="block text-xs font-bold text-muted mb-1">
                    {t('From', 'புறப்படும் இடம்')}
                  </label>
                  <div className="flex items-center space-x-2">
                    <FerryDockIcon className="w-[18px] h-[18px] text-brand-text shrink-0" />
                    <select
                      value={origin}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOrigin(val);
                        onOriginChange?.(val);
                      }}
                      className="w-full bg-transparent text-content font-bold text-[13px] sm:text-[15px] py-0.5 focus:outline-none cursor-pointer truncate"
                      aria-label="Departure Terminal"
                    >
                      {STATIONS.map((stn) => (
                        <option key={stn.code} value={stn.code}>
                          {language === 'en' ? stn.nameEn : stn.nameTa} ({stn.code})
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
                <div className="p-3.5 bg-surface-2 border border-line rounded-xl">
                  <label className="block text-xs font-bold text-muted mb-1">
                    {t('To', 'சேரும் இடம்')}
                  </label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-[18px] h-[18px] text-brand-text shrink-0" />
                    <select
                      value={destination}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDestination(val);
                        onDestinationChange?.(val);
                      }}
                      className="w-full bg-transparent text-content font-bold text-[13px] sm:text-[15px] py-0.5 focus:outline-none cursor-pointer truncate"
                      aria-label="Arrival Terminal"
                    >
                      {STATIONS.map((stn) => (
                        <option key={stn.code} value={stn.code}>
                          {language === 'en' ? stn.nameEn : stn.nameTa} ({stn.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Real-Time Estimate */}
              {origin !== destination && (
                <div className="flex items-center justify-between p-3 bg-surface-2 border border-line rounded-xl text-[13px] font-mono font-bold text-content">
                  <span className="text-muted font-normal flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-brand-text" />
                    ~{estimatedTime}m
                  </span>
                  <span className="text-line">•</span>
                  <span className="text-brand-text">₹{estimatedFare}</span>
                  <span className="text-line">•</span>
                  <span className="text-muted font-normal">Line {estimatedLine}</span>
                </div>
              )}

              {/* Main Submit & Voice Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 primary-button !py-3 !justify-between text-[13px]"
                >
                  <span>{t('Find Ferries', 'படகுகளைத் தேடுக')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={openVoiceAssistant}
                  className="secondary-button !py-2.5 !px-3 text-brand-text flex items-center justify-center group hover:border-brand hover:bg-brand-tint transition-all"
                  title={t('Voice Assistant', 'குரல் உதவியாளர்')}
                  aria-label={t('Voice Assistant', 'குரல் உதவியாளர்')}
                >
                  <Mic className="w-4 h-4 text-brand-text transition-transform group-hover:scale-110" />
                </button>
              </div>
            </form>

            {/* Quick Route Suggestions */}
            <div className="mt-4 pt-3.5 border-t border-line flex items-center gap-2 text-xs">
              <span className="text-muted font-bold text-xs shrink-0 hidden sm:inline">
                {t('Quick:', 'விரைவு:')}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar w-full">
                {popularRoutes.map((route) => {
                  const isActive = origin === route.from && destination === route.to;
                  return (
                    <button
                      key={`${route.from}-${route.to}`}
                      type="button"
                      onClick={() => handleQuickRoute(route.from, route.to)}
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'active-card font-bold'
                          : 'bg-surface-2 hover:bg-line text-content border-line'
                      }`}
                    >
                      <span>{route.label}</span>
                      <span className="font-mono text-[10px] ml-1 text-brand-text font-bold">{route.meta}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. LIVE SERVICE STATUS RIBBON                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="bg-surface border-b border-line py-3.5 px-4 sm:px-[6%]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted font-mono text-[11px] hidden sm:inline">
              • {liveFerries.length} {t('boats underway', 'படகுகள்')}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0">
            <button
              onClick={onOpenLiveMap}
              className="text-brand-text font-bold hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Radar className="w-3.5 h-3.5" />
              <span>{t('Live Radar', 'நேரலை வரைபடம்')}</span>
            </button>
            <span className="text-line">|</span>
            <button
              onClick={() => onOpenTab ? onOpenTab('timetable') : null}
              className="text-muted font-bold hover:text-content flex items-center space-x-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('Schedule', 'அட்டவணை')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. TRANSIT CORRIDORS                                         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 px-4 sm:px-[6%] border-b border-line bg-surface-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-content">
                {t('Transit Lines', 'நீர்வழித் தடங்கள்')}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {t('Corridors connecting East and West Chennai across the Cooum River.', 'கூவம் நதி வழியிலான விரைவுத் தடங்கள்.')}
              </p>
            </div>
            <button
              onClick={() => onOpenTab ? onOpenTab('routes') : null}
              className="text-xs font-bold text-brand-text hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>{t('View All Lines', 'அனைத்து தடங்கள்')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROUTES.map((route) => {
              const codes = route.stationCodes;
              let minFare = Infinity;
              let maxFare = 0;
              for (let i = 0; i < codes.length; i++) {
                for (let j = i + 1; j < codes.length; j++) {
                  const f = fareBetween(codes[i], codes[j]);
                  if (f < minFare) minFare = f;
                  if (f > maxFare) maxFare = f;
                }
              }
              return (
                <div
                  key={route.id}
                  className="bg-surface border border-line rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className="px-2.5 py-0.5 rounded-md text-white font-mono font-bold text-[11px]"
                        style={{ backgroundColor: route.colorHex }}
                      >
                        LINE {route.routeCode}
                      </span>
                      <span className="text-[11px] font-mono text-muted">
                        {route.frequencyMinutes}m {t('headway', 'இடைவெளி')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-content">
                      {language === 'en' ? route.nameEn : route.nameTa}
                    </h3>
                    <p className="text-xs text-muted mt-1 mb-4">
                      {codes.map((c) => stationName(c, language)).join(' → ')}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-line flex items-center justify-between">
                    <span className="text-xs font-bold text-content font-mono">
                      ₹{minFare} - ₹{maxFare}
                    </span>
                    <button
                      onClick={() => handleQuickRoute(codes[0], codes[codes.length - 1])}
                      className="secondary-button !py-1.5 !px-3 text-xs"
                    >
                      {t(`Book ${route.routeCode}`, `பதிவு ${route.routeCode}`)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 4. UPCOMING DEPARTURES TIMETABLE                             */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 px-4 sm:px-[6%] border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-content">
                {t('Live Departures', 'நேரலை புறப்பாடுகள்')}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {t('Next catamarans departing from major terminals.', 'முக்கிய முனையங்களிலிருந்து அடுத்த படகுப் புறப்பாடுகள்.')}
              </p>
            </div>
            <button
              onClick={() => onOpenTab ? onOpenTab('timetable') : null}
              className="text-xs font-bold text-brand-text hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>{t('Full Schedule', 'முழு அட்டவணை')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="sm:hidden space-y-2.5">
            {UPCOMING_DEPARTURES.map((dep, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-surface border border-line rounded-xl shadow-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-md text-white font-mono font-bold text-[10px]"
                      style={{ backgroundColor: ROUTE_COLOR[dep.line] || '#0b647a' }}
                    >
                      {dep.line}
                    </span>
                    <span className="font-mono font-bold text-sm text-content">{dep.time}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-brand-tint text-brand-text">
                      {dep.status === 'Boarding' ? t('Boarding', 'ஏற்றம்') : t('On Time', 'நேரத்தில்')}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-content">
                    {stationName(dep.from, language)} → {stationName(dep.to, language)}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 font-mono">
                    {dep.hull} • <span className="font-bold text-brand-text">₹{departureFare(dep)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickRoute(dep.from, dep.to)}
                  className="primary-button !py-2 !px-3 text-xs"
                >
                  {t('Book', 'பதிவு')}
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= sm) */}
          <div className="hidden sm:block border border-line rounded-2xl overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted border-b border-line">
                <tr>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{t('Time', 'நேரம்')}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{t('Line', 'தடம்')}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{t('Vessel', 'படகு')}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{t('Route', 'பாதை')}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{t('Fare', 'கட்டணம்')}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">{t('Status', 'நிலை')}</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-right">{t('Action', 'செயல்')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {UPCOMING_DEPARTURES.map((dep, idx) => (
                  <tr key={idx} className="hover:bg-surface-2 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-content">{dep.time}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded-md text-white font-mono font-bold text-[10px]"
                        style={{ backgroundColor: ROUTE_COLOR[dep.line] || '#0b647a' }}
                      >
                        {dep.line}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted">{dep.hull}</td>
                    <td className="py-3 px-4 font-medium text-content">
                      {stationName(dep.from, language)} → {stationName(dep.to, language)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-text">₹{departureFare(dep)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-tint text-brand-text border border-brand-line">
                        {dep.status === 'Boarding' ? t('Boarding', 'ஏற்றம்') : t('On Time', 'நேரத்தில்')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleQuickRoute(dep.from, dep.to)}
                        className="secondary-button !py-1 !px-2.5 text-[11px]"
                      >
                        {t('Book', 'பதிவு')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. INTERCHANGE TERMINALS QUICK PICKER                        */}
      {/* ──────────────────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 px-4 sm:px-[6%] bg-surface-2">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-content">
                {t('Interchange Terminals', 'இணைப்பு முனையங்கள்')}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {t('Floating stations with seamless connections to Metro, Rail, and Bus.', 'மெட்ரோ, ரயில் மற்றும் பேருந்து இணைப்பு கொண்ட முனையங்கள்.')}
              </p>
            </div>
            <button
              onClick={() => onOpenTab ? onOpenTab('stations') : null}
              className="text-xs font-bold text-brand-text hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>{t('All 10 Terminals', 'அனைத்து முனையங்கள்')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Terminal Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {['POON', 'KOY', 'CHET', 'EGM', 'CHIN', 'ISLD'].map((code) => {
              const stn = STATIONS.find((s) => s.code === code);
              const lines = ROUTES.filter((r) => r.stationCodes.includes(code))
                .map((r) => r.routeCode)
                .join(', ');
              const name = stationName(code, language);
              return (
                <div
                  key={code}
                  onClick={() => handleQuickRoute(code, 'EGM')}
                  className="p-3 bg-surface border border-line hover:border-brand rounded-xl transition-all cursor-pointer shadow-xs group"
                  title={t(`Book route from ${name}`, `${name} லிருந்து பதிவு`)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[9px] font-bold text-brand-text bg-brand-tint px-1.5 py-0.5 rounded">
                      {lines}
                    </span>
                    <span className="font-mono text-[9px] text-muted">{code}</span>
                  </div>
                  <div className="font-bold text-xs text-content group-hover:text-brand-text transition-colors truncate">
                    {name}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5 truncate">
                    {stn?.interchanges[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
