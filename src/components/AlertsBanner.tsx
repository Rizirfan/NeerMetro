import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { ServiceAlert, Language } from '../types';

interface AlertsBannerProps {
  alerts: ServiceAlert[];
  language: Language;
  onOpenAlertsView: () => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  alerts,
  language,
  onOpenAlertsView,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  const topAlert = alerts[0];

  return (
    <div className="anim-drop bg-amber-50 border-b border-amber-200 text-amber-900 px-4 sm:px-6 py-2 text-xs flex items-center justify-between z-50">
      <div className="flex items-center space-x-2.5 min-w-0 mr-2">
        <span className="p-1 rounded-md bg-amber-100 text-amber-700 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5" />
        </span>
        <span className="font-bold text-amber-800 uppercase tracking-wider text-[11px] shrink-0 hidden sm:inline">
          {language === 'en' ? 'Service Advisory:' : 'அறிவிப்பு:'}
        </span>
        <span className="truncate font-semibold text-amber-950">
          {language === 'en' ? topAlert.titleEn : topAlert.titleTa}
        </span>
        <span className="text-amber-700 text-[11px] font-mono shrink-0 hidden md:inline">
          {topAlert.timestamp}
        </span>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        <button
          onClick={onOpenAlertsView}
          className="flex items-center space-x-1 font-bold text-amber-800 hover:text-amber-950 underline decoration-amber-400 hover:decoration-amber-950 transition-colors cursor-pointer"
        >
          <span>{language === 'en' ? 'View Details' : 'விவரங்கள்'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-600 hover:text-amber-950 transition-colors cursor-pointer"
          aria-label={language === 'en' ? 'Dismiss advisory' : 'அறிவிப்பை நீக்கு'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
