import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { renderTicketQR } from '../lib/ticketQR';
import { UpiIcon, TransitCardIcon } from './icons';
import { JourneyPlan, Ticket, Language } from '../types';
import { stationName } from '../lib/stationName';

interface BookingTicketModalProps {
  plan: JourneyPlan | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onTicketGenerated: (ticket: Ticket) => void;
}

const PAYMENT_METHODS = [
  { id: 'UPI' as const, en: 'UPI (GPay / PhonePe / Paytm)', ta: 'UPI (ஜிபே / போன்பே)', icon: UpiIcon },
  { id: 'CARD' as const, en: 'Debit / Credit Card / RuPay', ta: 'வங்கி அட்டை', icon: CreditCard },
  { id: 'TRANSIT_CARD' as const, en: 'Singara Chennai Transit Card', ta: 'சிங்கார சென்னை அட்டை', icon: TransitCardIcon },
];

export const BookingTicketModal: React.FC<BookingTicketModalProps> = ({
  plan,
  isOpen,
  onClose,
  language,
  onTicketGenerated,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const [passengerCount, setPassengerCount] = useState(1);
  const [paymentStep, setPaymentStep] = useState<'DETAILS' | 'PAYING' | 'SUCCESS'>('DETAILS');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'TRANSIT_CARD'>('UPI');
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentStep('DETAILS');
      setGeneratedTicket(null);
      setPassengerCount(1);
    }
  }, [isOpen, plan]);

  useEffect(() => {
    if (paymentStep === 'SUCCESS' && generatedTicket && qrCanvasRef.current) {
      renderTicketQR(qrCanvasRef.current, generatedTicket, 200);
    }
  }, [paymentStep, generatedTicket]);

  if (!isOpen || !plan) return null;

  const totalFare = plan.totalFareInr * passengerCount;
  const fromName = stationName(plan.legs[0]?.from || '', language);
  const toName = stationName(plan.legs[plan.legs.length - 1]?.to || '', language);

  const handlePay = () => {
    setPaymentStep('PAYING');
    setTimeout(() => {
      const bookingId = `CM${Math.floor(10000 + Math.random() * 90000)}`;
      const routeLeg = plan.legs.find((l) => l.mode === 'WATER_METRO');
      const newTicket: Ticket = {
        id: `tkt_${Date.now()}`,
        bookingRef: bookingId,
        originCode: plan.legs[0]?.from || 'KOY',
        destinationCode: plan.legs[plan.legs.length - 1]?.to || 'EGM',
        originName: fromName,
        destinationName: toName,
        passengerCount,
        fareInr: totalFare,
        journeyDate: '18 Oct 2026',
        departureTime: plan.departureTime,
        routeCode: routeLeg?.routeCode || 'C1',
        status: 'ACTIVE',
        qrSignature: `COUMETRO_${bookingId}_PAX${passengerCount}_SIG_ED25519_VALID`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setGeneratedTicket(newTicket);
      setPaymentStep('SUCCESS');
      onTicketGenerated(newTicket);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Book Journey Pass', 'பயணச் சீட்டு பதிவு')}
        className="animate-sheet-in bg-surface border-t sm:border border-line text-content w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl relative shadow-2xl max-h-[92dvh] overflow-y-auto overscroll-contain"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden sticky top-0 z-10 bg-surface pt-2.5 pb-1 flex justify-center rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>

        <button
          onClick={onClose}
          aria-label={t('Close', 'மூடு')}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 rounded-full text-muted hover:text-content hover:bg-surface-2 transition-colors cursor-pointer z-10 touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentStep === 'DETAILS' && (
          <div className="px-5 pt-3 sm:px-8 sm:pt-8">
            <div className="flex items-center gap-2 mb-1.5">
              <img src="/logo/neermetro-3d-mark.png" alt="NEERMETRO" className="w-5 h-5 object-contain" />
              <span className="eyebrow !mb-0">{t('NEERMETRO TRANSIT PASS', 'நீர்மெட்ரோ பயணச் சீட்டு')}</span>
            </div>
            <h2 className="text-[22px] sm:text-2xl font-bold text-content leading-tight">
              {t('Book Journey Pass', 'பயணச் சீட்டு பதிவு')}
            </h2>
            <p className="text-xs text-muted mt-1.5 leading-snug">
              {fromName} → {toName} • {plan.totalDurationMin} {t('min', 'நிமி')}
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-surface-2 border border-line space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-muted gap-3">
                <span className="shrink-0">{t('Service Route', 'தடம்')}</span>
                <span className="font-bold text-content text-right min-w-0 truncate">
                  {language === 'en' ? plan.titleEn : plan.titleTa}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted gap-3">
                <span className="shrink-0">{t('Departure Time', 'புறப்படும் நேரம்')}</span>
                <span className="font-mono font-bold text-brand-text">{plan.departureTime}</span>
              </div>
              <div className="flex justify-between items-center text-muted gap-3">
                <span className="shrink-0">{t('Fare per Passenger', 'ஒருவருக்கு கட்டணம்')}</span>
                <span className="font-mono font-bold text-content">₹{plan.totalFareInr}</span>
              </div>
            </div>

            {/* Passenger Count Selection */}
            <div className="mt-5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                {t('Number of Passengers', 'பயணிகள் எண்ணிக்கை')}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPassengerCount(n)}
                    aria-pressed={passengerCount === n}
                    className={`py-2.5 sm:py-2 rounded-xl font-bold font-mono text-sm transition-colors min-h-[44px] cursor-pointer touch-manipulation ${
                      passengerCount === n
                        ? 'active-card'
                        : 'bg-surface-2 text-content border border-line hover:bg-line'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mt-5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
                {t('Select Payment Method', 'கட்டண முறை')}
              </label>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      aria-pressed={isSelected}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center space-x-3 transition-colors min-h-[60px] cursor-pointer touch-manipulation ${
                        isSelected
                          ? 'active-card'
                          : 'bg-surface border-line text-content hover:bg-surface-2'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-surface text-brand-text' : 'bg-surface-2 text-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold">{t(m.en, m.ta)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky Total & Pay Bar — always reachable while scrolling */}
            <div className="sticky bottom-0 mt-6 -mx-5 px-5 sm:-mx-8 sm:px-8 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:pb-5 bg-surface border-t border-line flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 shadow-[0_-12px_28px_-12px_rgba(17,19,21,0.18)]">
              <div className="flex items-center justify-between sm:block">
                <span className="text-[10px] text-muted block font-bold uppercase tracking-wider">
                  {t('Total Fare', 'மொத்தக் கட்டணம்')}
                </span>
                <span className="text-2xl font-bold text-content font-mono leading-tight">₹{totalFare}</span>
              </div>
              <button
                type="button"
                onClick={handlePay}
                className="w-full sm:w-auto sm:ml-auto primary-button !py-3.5 sm:!py-3 !px-6 text-[13px] min-h-[50px] touch-manipulation"
              >
                {t('Authorize & Generate Pass', 'பணம் செலுத்தி டிக்கெட் பெறுக')}
              </button>
            </div>
          </div>
        )}

        {paymentStep === 'PAYING' && (
          <div className="py-20 px-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-line border-t-[#0b647a] animate-spin" />
            <h2 className="text-lg font-bold text-content">
              {t('Authorizing Payment…', 'கட்டணம் அங்கீகரிக்கப்படுகிறது…')}
            </h2>
            <p className="text-xs text-muted mt-1.5 leading-snug">
              {t('Preparing your boarding pass.', 'உங்கள் பயணச் சீட்டு தயாராகிறது.')}
            </p>
          </div>
        )}

        {paymentStep === 'SUCCESS' && generatedTicket && (
          <div className="text-center px-5 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] sm:pb-8">
            <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-tint text-brand-text border border-brand-line text-xs font-bold mb-3">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t('Boarding Pass Generated', 'டிக்கெட் உருவாக்கப்பட்டது')}</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <img src="/logo/neermetro-3d-mark.png" alt="NEERMETRO" className="w-6 h-6 object-contain drop-shadow-xs" />
              <h3 className="text-base font-bold text-content">{t('NEERMETRO Digital Pass', 'நீர்மெட்ரோ டிஜிட்டல் பாஸ்')}</h3>
            </div>
            <p className="text-xs text-muted font-mono mt-0.5">{generatedTicket.bookingRef}</p>

            <div className="mt-4 inline-block bg-surface-2 p-3 rounded-2xl border border-line">
              <canvas ref={qrCanvasRef} className="rounded-xl" />
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-surface-2 border border-line text-xs text-content max-w-sm mx-auto">
              <div className="font-bold">{fromName} → {toName}</div>
              <div className="text-muted mt-1">
                {generatedTicket.passengerCount} {t('Passengers', 'பயணிகள்')} • {t('Line', 'தடம்')} {generatedTicket.routeCode} • {generatedTicket.departureTime}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full primary-button !py-3.5 text-[13px] !justify-center min-h-[50px] touch-manipulation"
            >
              {t('Done (Saved to My Passes)', 'முடிந்தது (டிக்கெட்டுகளில் சேமிக்கப்பட்டது)')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
