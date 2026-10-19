import React, { useState } from 'react';
import { Calculator, ArrowRight, Clock, GraduationCap, UserRound } from 'lucide-react';
import { BoardingPassIcon, FerryDockIcon } from './icons';
import { Language } from '../types';
import { STATIONS } from '../data/mockData';
import { DEPARTURES } from '../data/schedules';
import { computeRiverKm, computeStandardFare } from '../services/journeyPlanner';
import { stationName } from '../lib/stationName';

interface TimetableFaresViewProps {
  language: Language;
  onBookStations: (origin: string, dest: string) => void;
}

export const TimetableFaresView: React.FC<TimetableFaresViewProps> = ({
  language,
  onBookStations,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const [calcOrigin, setCalcOrigin] = useState('KOY');
  const [calcDest, setCalcDest] = useState('EGM');

  const originStn = STATIONS.find((s) => s.code === calcOrigin) || STATIONS[3];
  const destStn = STATIONS.find((s) => s.code === calcDest) || STATIONS[7];

  const riverKm = computeRiverKm(
    originStn.coordinates[0],
    originStn.coordinates[1],
    destStn.coordinates[0],
    destStn.coordinates[1]
  );
  const standard = computeStandardFare(riverKm);
  const student = Math.round(standard * 0.5);
  const senior = Math.round(standard * 0.7);

  return (
    <div className="bg-surface text-content min-h-[calc(100vh-4rem)] py-10 sm:py-14 px-[6%]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-5 border-b border-line">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
            {t('Fares & Schedules', 'கட்டணம் & கால அட்டவணை')}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl">
            {t(
              'Distance-based fares and departure timings across all Cooum waterway lines.',
              'அனைத்து தடங்களுக்குமான தூரம் சார்ந்த கட்டணங்கள் மற்றும் புறப்பாடு நேரங்கள்.'
            )}
          </p>
        </div>

        {/* Fare Calculator Card */}
        <div className="p-5 sm:p-7 rounded-2xl bg-surface border border-line mb-8 shadow-xs">
          <div className="flex items-center space-x-2 text-sm font-bold text-brand-text mb-4">
            <Calculator className="w-4 h-4" />
            <span>{t('Fare Calculator', 'கட்டணக் கணிப்பான்')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-surface-2 border border-line rounded-xl">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                {t('From Terminal', 'புறப்படும் இடம்')}
              </label>
              <div className="flex items-center space-x-2">
                <FerryDockIcon className="w-4 h-4 text-brand-text shrink-0" />
                <select
                  value={calcOrigin}
                  onChange={(e) => setCalcOrigin(e.target.value)}
                  className="w-full bg-transparent text-content font-bold text-sm focus:outline-none cursor-pointer"
                >
                  {STATIONS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {stationName(s.code, language)} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-surface-2 border border-line rounded-xl">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1">
                {t('To Terminal', 'சேரும் இடம்')}
              </label>
              <div className="flex items-center space-x-2">
                <FerryDockIcon className="w-4 h-4 text-muted shrink-0" />
                <select
                  value={calcDest}
                  onChange={(e) => setCalcDest(e.target.value)}
                  className="w-full bg-transparent text-content font-bold text-sm focus:outline-none cursor-pointer"
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

          {/* Pricing Result Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-surface-2 border border-line rounded-2xl">
            <div className="flex flex-col justify-center">
              <div className="text-[11px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                <FerryDockIcon className="w-3.5 h-3.5 text-brand-text" />
                {t('Waterway Distance', 'நீர்வழி தூரம்')}
              </div>
              <div className="text-2xl font-bold text-content font-mono mt-0.5">{riverKm} km</div>
            </div>

            <div className="p-3 bg-surface border border-line rounded-xl">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                <BoardingPassIcon className="w-3.5 h-3.5 text-brand-text" />
                {t('Standard Pass', 'பொதுக் கட்டணம்')}
              </div>
              <div className="text-2xl font-bold text-content font-mono mt-0.5">₹{standard}</div>
              <span className="text-[10px] text-muted">RFID / QR Pass</span>
            </div>

            <div className="p-3 bg-surface border border-line rounded-xl">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-brand-text" />
                {t('Student (50% Off)', 'மாணவர் (50% தள்ளுபடி)')}
              </div>
              <div className="text-2xl font-bold text-brand-text font-mono mt-0.5">₹{student}</div>
              <span className="text-[10px] text-muted">Govt ID Card</span>
            </div>

            <div className="p-3 bg-surface border border-line rounded-xl">
              <div className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                <UserRound className="w-3.5 h-3.5 text-brand-text" />
                {t('Senior (30% Off)', 'மூத்தோர் (30% தள்ளுபடி)')}
              </div>
              <div className="text-2xl font-bold text-brand-text font-mono mt-0.5">₹{senior}</div>
              <span className="text-[10px] text-muted">Age 60+ · Valid ID</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onBookStations(calcOrigin, calcDest)}
            className="mt-4 w-full primary-button !py-3 text-xs"
          >
            <span>{t('Book This Crossing', 'இப்பயணத்தை பதிவு செய்')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Master Daily Departures Schedule */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-line">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-brand-text" />
              <h3 className="text-base font-bold text-content">
                {t('Morning High-Frequency Departures', 'காலை புறப்பாடு அட்டவணை')}
              </h3>
            </div>
            <span className="text-xs text-brand-text font-bold">{t('8-12 Min Headway', '8-12 நிமிட இடைவெளி')}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-xs text-left">
              <thead>
                <tr className="border-b border-line text-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5">{t('Time', 'நேரம்')}</th>
                  <th className="py-2.5">{t('Line', 'தடம்')}</th>
                  <th className="py-2.5">{t('Hull', 'படகு')}</th>
                  <th className="py-2.5">{t('Destination', 'சேருமிடம்')}</th>
                  <th className="py-2.5 text-right">{t('Status', 'நிலை')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {DEPARTURES.map((dep, idx) => (
                  <tr key={idx} className="hover:bg-surface-2 transition-colors">
                    <td className="py-3 font-bold text-content">{dep.time}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-brand-tint border border-brand-line text-brand-text font-bold">
                        {dep.line}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{dep.hull}</td>
                    <td className="py-3 font-sans font-bold text-content">
                      {stationName(dep.to, language)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-[#10b981] font-bold bg-brand-tint px-2 py-0.5 rounded-md">
                        {dep.status === 'Boarding'
                          ? t('Boarding', 'ஏற்றம்')
                          : t('On Time', 'நேரத்தில்')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
