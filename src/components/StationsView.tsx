import React, { useState } from 'react';
import {
  Search,
  TrainFront,
  Bus,
  Zap,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { FerryDockIcon } from './icons';
import { Language } from '../types';
import { STATIONS } from '../data/mockData';

interface StationsViewProps {
  language: Language;
  onPlanFromStation: (code: string) => void;
  onViewOnMap: () => void;
}

export const StationsView: React.FC<StationsViewProps> = ({
  language,
  onPlanFromStation,
  onViewOnMap,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const [query, setQuery] = useState('');

  const filtered = STATIONS.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.nameEn.toLowerCase().includes(q) ||
      s.nameTa.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-surface text-content min-h-[calc(100vh-4rem)] py-10 sm:py-14 px-[6%]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-5 border-b border-line">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
              {t('Ferry Terminals', 'மிதக்கும் முனையங்கள்')}
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl">
              {t(
                '10 floating terminals with connections to Metro, suburban rail, and bus transit.',
                'மெட்ரோ, புறநகர் ரயில் மற்றும் பேருந்து இணைப்பு கொண்ட 10 நதி முனையங்கள்.'
              )}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search by terminal name or code…', 'முனையத்தின் பெயரைத் தேடுக…')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-line text-content text-xs placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        {/* Terminal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((stn) => (
            <div
              key={stn.id}
              className="p-6 rounded-2xl bg-surface border border-line hover:border-brand transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-11 h-11 rounded-xl bg-brand-tint border border-brand-line text-brand-text flex items-center justify-center shrink-0">
                    <FerryDockIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-0.5">
                      <span className="px-2 py-0.5 rounded-md bg-brand-tint border border-brand-line text-brand-text font-mono font-bold text-xs">
                        {stn.code}
                      </span>
                      <span className="text-xs text-muted font-mono">
                        {stn.pontoons} {t('Pontoons', 'மிதவைப் பந்தைகள்')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-content truncate">
                      {language === 'en' ? stn.nameEn : stn.nameTa}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-muted mt-1">
                  {language === 'en' ? stn.addressEn : stn.addressTa} · <span className="text-brand-text font-semibold">{stn.feederConnectivity}</span>
                </p>

                {/* Multimodal Interchanges */}
                <div className="mt-4 pt-3 border-t border-line">
                  <span className="text-[10px] uppercase font-bold text-muted block mb-1.5 tracking-wider">
                    {t('Interchanges & Connections', 'இணைப்புகள்')}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stn.interchanges.map((ic, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-[11px] font-medium text-content flex items-center space-x-1"
                      >
                        {ic.includes('Metro') ? (
                          <TrainFront className="w-3 h-3 text-brand-text" />
                        ) : ic.includes('Bus') ? (
                          <Bus className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Zap className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{ic}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onViewOnMap}
                  className="text-xs font-bold text-brand-text hover:text-brand-text flex items-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{t('View on map', 'வரைபடத்தில் காண்க')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPlanFromStation(stn.code)}
                  className="primary-button !py-2 !px-3 text-xs"
                >
                  <span>{t('Plan From Here', 'இங்கிருந்து பயணிக்க')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
