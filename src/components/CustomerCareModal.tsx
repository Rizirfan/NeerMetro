import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  ShieldCheck,
  Building2,
  Mail,
  MapPin,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Language, Ticket } from '../types';
import { HELPLINE, WHATSAPP_DISPLAY, WHATSAPP_LINK_APPOINTMENT } from '../constants/support';

interface CustomerCareModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  tickets?: Ticket[];
  onOpenCancelForTicket?: (ticketId: string) => void;
}

export const CustomerCareModal: React.FC<CustomerCareModalProps> = ({
  isOpen,
  onClose,
  language,
  tickets = [],
  onOpenCancelForTicket,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<Ticket | null | 'NOT_FOUND'>(null);

  if (!isOpen) return null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const q = lookupQuery.trim().toUpperCase();
    if (!q) return;

    const matched = tickets.find(
      (tkt) =>
        tkt.bookingRef.toUpperCase() === q ||
        tkt.id.toUpperCase() === q ||
        (tkt.refundRef && tkt.refundRef.toUpperCase() === q)
    );

    if (matched) {
      setLookupResult(matched);
    } else {
      setLookupResult('NOT_FOUND');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="animate-sheet-in relative w-full sm:max-w-2xl bg-surface sm:rounded-3xl rounded-t-3xl shadow-2xl border-t sm:border border-line overflow-hidden max-h-[94vh] sm:max-h-[92vh] h-[92vh] sm:h-auto flex flex-col">
        {/* Mobile drag handle */}
        <div className="sm:hidden shrink-0 pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-6 bg-surface-2 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-surface border border-brand-line p-1 flex items-center justify-center shadow-sm shrink-0">
              <img src="/logo/neermetro-3d-mark.png" alt="NEERMETRO Care" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-extrabold text-content tracking-tight leading-tight truncate">
                {t('Customer Care & Support', 'வாடிக்கையாளர் சேவை')}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface hover:bg-line text-content border border-line flex items-center justify-center transition-colors cursor-pointer shrink-0 touch-manipulation"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-5 sm:space-y-6 flex-1 text-content pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
          {/* Quick Contact Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              {t('Direct Helplines & Live Channels', 'நேரடி உதவி எண்கள்')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Toll Free Call */}
              <a
                href={`tel:${HELPLINE.replace(/-/g, '')}`}
                className="p-4 rounded-2xl bg-surface border border-line hover:border-brand hover:bg-brand-tint/40 transition-all flex items-start space-x-3 group cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded-md inline-block mb-0.5">
                    {t('24/7 TOLL-FREE', '24 மணி நேர இலவச அழைப்பு')}
                  </span>
                  <div className="font-bold text-content text-sm group-hover:text-brand-text transition-colors">
                    {HELPLINE}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t('English & தமிழ் · Instant response', 'ஆங்கிலம் மற்றும் தமிழ் சேவை')}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted group-hover:text-brand-text shrink-0" />
              </a>

              {/* 2. WhatsApp Live Chat */}
              <a
                href={WHATSAPP_LINK_APPOINTMENT}
                target="_blank"
                rel="noreferrer"
                className="p-4 rounded-2xl bg-surface border border-line hover:border-brand hover:bg-brand-tint/40 transition-all flex items-start space-x-3 group cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded-md inline-block mb-0.5">
                    {t('WHATSAPP DESK', 'வாட்ஸ்அப் உதவி')}
                  </span>
                  <div className="font-bold text-content text-sm group-hover:text-brand-text transition-colors">
                    {WHATSAPP_DISPLAY}
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t('Chat with duty officers · < 45s reply', 'உடனடி நேரடி சாட் உதவி')}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted group-hover:text-brand-text shrink-0" />
              </a>

              {/* 3. River OCC Control Room */}
              <div className="p-4 rounded-2xl bg-surface border border-line flex items-start space-x-3 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-brand-tint text-brand-text border border-brand-line flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-brand-text bg-brand-tint px-1.5 py-0.2 rounded-md inline-block mb-0.5">
                    {t('RIVER CONTROL (OCC)', 'ஆற்று கட்டுப்பாட்டகம்')}
                  </span>
                  <div className="font-bold text-content text-sm">
                    044-2855-6337
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t('Live vessel navigation & telemetry', 'நேரலை படகு இயக்கம் மற்றும் பாதுகாப்பு')}
                  </p>
                </div>
              </div>

              {/* 4. Grievance Management Email */}
              <a
                href="mailto:support@neermetro.tn.gov.in?subject=NEERMETRO%20Passenger%20Inquiry"
                className="p-4 rounded-2xl bg-surface border border-line hover:border-brand hover:bg-brand-tint/40 transition-all flex items-start space-x-3 group cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100/60 px-1.5 py-0.2 rounded-md inline-block mb-0.5">
                    {t('OFFICIAL ESCALATION', 'அதிகாரப்பூர்வ மின்னஞ்சல்')}
                  </span>
                  <div className="font-bold text-content text-xs truncate group-hover:text-brand-text transition-colors">
                    support@neermetro.tn.gov.in
                  </div>
                  <p className="text-[11px] text-muted mt-0.5">
                    {t('Management review within 2 hours', 'நிர்வாக அதிகாரியின் உடனடி மறுமொழி')}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted group-hover:text-brand-text shrink-0" />
              </a>
            </div>
          </div>

          {/* Quick Ticket & Refund Status Checker */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-2 border border-line">
            <div className="flex items-center space-x-2 mb-2">
              <Search className="w-4 h-4 text-brand-text" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-content">
                {t('Instant Ticket & Refund Status Lookup', 'டிக்கெட் & ரீஃபண்ட் நேரடி நிலை சரிபார்ப்பு')}
              </h4>
            </div>
            <p className="text-xs text-muted mb-3">
              {t(
                'Enter your Booking Reference (e.g. CM48291) or Refund Tracking ID to view real-time status:',
                'உங்கள் டிக்கெட் எண் அல்லது ரீஃபண்ட் எண்ணை உள்ளிட்டு நிலையை அறியவும்:'
              )}
            </p>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder={t('e.g., CM48291 or RFND-2026-8491', 'எ.கா: CM48291')}
                className="flex-1 px-3.5 py-2 rounded-xl bg-surface border border-line text-xs font-mono font-bold text-content focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-strong text-white text-xs font-bold transition-all cursor-pointer"
              >
                {t('Check Status', 'சரிபார்க்க')}
              </button>
            </form>

            {/* Lookup result display */}
            {lookupResult && lookupResult !== 'NOT_FOUND' && (
              <div className="mt-3 p-3.5 bg-surface rounded-xl border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {lookupResult.bookingRef} ·{' '}
                    {lookupResult.status === 'CANCELLED'
                      ? t('Cancelled', 'ரத்து')
                      : t('Active', 'செயலில்')}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="text-xs font-bold text-content">
                  {lookupResult.originName} → {lookupResult.destinationName}
                </div>

                <div className="text-[11px] text-muted mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>{t('Fare', 'கட்டணம்')}: ₹{lookupResult.fareInr}</span>
                  <span>{t('Date', 'தேதி')}: {lookupResult.journeyDate} ({lookupResult.departureTime})</span>
                </div>

                {lookupResult.status === 'CANCELLED' && (
                  <div className="mt-2 pt-2 border-t border-line text-xs text-emerald-800 font-medium">
                    <span className="font-bold">{t('Refund Status:', 'ரீஃபண்ட் நிலை:')}</span>{' '}
                    {lookupResult.refundStatus === 'PROCESSED'
                      ? t('Processed', 'செயலாக்கப்பட்டது')
                      : t('Pending', 'நிலுவையில்')}{' '}
                    · ₹{lookupResult.refundAmountInr || lookupResult.fareInr}{' '}
                    {t('credited to source UPI.', 'மூல UPI-க்கு வரவு வைக்கப்பட்டது.')}
                    {lookupResult.refundRef && (
                      <span className="block text-[10px] font-mono text-muted mt-0.5">
                        {t('Refund Ref:', 'ரீஃபண்ட் எண்:')} {lookupResult.refundRef}
                      </span>
                    )}
                  </div>
                )}

                {lookupResult.status === 'ACTIVE' && onOpenCancelForTicket && (
                  <div className="mt-2.5 pt-2 border-t border-line flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCancelForTicket(lookupResult.id);
                      }}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                    >
                      <span>{t('Cancel this Pass & Get Full Refund', 'சீட்டை ரத்து செய்து முழு ரீபண்ட் பெற')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {lookupResult === 'NOT_FOUND' && (
              <div className="mt-3 p-3 bg-surface rounded-xl border border-amber-200 text-xs text-amber-800">
                {t(
                  `No booking or refund record found with this reference. Please check the spelling or call our helpline ${HELPLINE}.`,
                  `இந்த எண்ணில் எந்தப் பதிவும் கிடைக்கவில்லை. தயவுசெய்து ${HELPLINE} என்ற எண்ணை அழைக்கவும்.`
                )}
              </div>
            )}
          </div>

          {/* Reassurance Banner */}
          <div className="p-4 rounded-2xl bg-brand-tint border border-brand-line flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-brand-text shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              {t(
                'Bookings, safety, and refunds are protected under the Tamil Nadu Waterways Passenger Protection Charter.',
                'உங்கள் முன்பதிவு, பாதுகாப்பு மற்றும் ரீஃபண்ட் ஆகியவை தமிழ்நாடு நீர்வழி பயணிகள் உரிமை சட்டத்தின் கீழ் பாதுகாக்கப்படுகின்றன.'
              )}
            </p>
          </div>

          {/* Physical Stations & Operating Hours */}
          <div className="border-t border-line pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-text" />
              <span>{t('In-Person Station Master Rooms', 'நேரடி முனைய மேலாளர் அலுவலகங்கள்')}</span>
            </h4>
            <p className="text-xs text-muted leading-relaxed">
              {t(
                'Senior Station Superintendents are on duty at all 10 quays daily from 05:45 to 23:00. Approach the customer help cubicle beside Pontoon Gate 01 at any terminal.',
                'அனைத்து 10 முனையங்களிலும் காலை 05:45 முதல் இரவு 23:00 வரை நிலைய மேலாளர்கள் பணியில் இருப்பார்கள். கேட் 01 அருகில் உள்ள உதவி மையத்தில் அவர்களை நேரடியாக அணுகலாம்.'
              )}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-surface-2 border-t border-line flex items-center justify-end shrink-0 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-inverse hover:bg-[#2b3034] text-white text-[13px] font-bold transition-colors cursor-pointer touch-manipulation active:scale-95"
          >
            {t('Close', 'மூடுக')}
          </button>
        </div>
      </div>
    </div>
  );
};
