import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Headset,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ticket, Language } from '../types';
import { HELPLINE } from '../constants/support';

interface CancellationRefundModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onConfirmCancellation: (ticketId: string, refundDetails: { refundRef: string; refundAmount: number }) => void;
  onOpenCustomerCare: () => void;
}

export const CancellationRefundModal: React.FC<CancellationRefundModalProps> = ({
  ticket,
  isOpen,
  onClose,
  language,
  onConfirmCancellation,
  onOpenCustomerCare,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const [step, setStep] = useState<'REVIEW' | 'SUCCESS'>('REVIEW');
  const [generatedRefundRef, setGeneratedRefundRef] = useState('');

  if (!isOpen || !ticket) return null;

  // Calculation
  const farePaid = ticket.fareInr;
  // If departure is in future (>20m), deduction is 0. Otherwise max ₹5.
  const deduction = 0; // 100% full refund policy
  const netRefund = farePaid - deduction;

  const handleConfirm = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ref = `RFND-2026-${randomSuffix}`;
    setGeneratedRefundRef(ref);

    onConfirmCancellation(ticket.id, {
      refundRef: ref,
      refundAmount: netRefund,
    });

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      /* ignore */
    }

    setStep('SUCCESS');
  };

  const handleModalClose = () => {
    setStep('REVIEW');
    setGeneratedRefundRef('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl border border-line overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-surface-2 border-b border-line flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700">
                {t('PASS CANCELLATION & REFUND', 'சீட்டு ரத்து & ரீஃபண்ட்')}
              </span>
              <h3 className="text-lg font-extrabold text-content leading-tight">
                {step === 'REVIEW'
                  ? t('Cancel Digital Boarding Pass', 'டிஜிட்டல் சீட்டை ரத்து செய்க')
                  : t('Refund Successfully Initiated', 'ரீஃபண்ட் வெற்றிகரமாக தொடங்கப்பட்டது')}
              </h3>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-line text-content border border-line flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {step === 'REVIEW' ? (
          <div className="p-5 sm:p-6 space-y-5 text-content">
            {/* Ticket Summary Card */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-line space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-brand-text">REF #{ticket.bookingRef}</span>
                <span className="text-muted font-bold">Line {ticket.routeCode}</span>
              </div>

              <div className="flex items-center gap-2 font-bold text-sm text-content">
                <span>{ticket.originName}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{ticket.destinationName}</span>
              </div>

              <div className="text-xs text-muted flex flex-wrap gap-x-3 gap-y-0.5 pt-1 border-t border-line">
                <span>{t('Date', 'தேதி')}: {ticket.journeyDate}</span>
                <span>{t('Departure', 'நேரம்')}: {ticket.departureTime}</span>
                <span>{ticket.passengerCount} {t('passengers', 'பயணிகள்')}</span>
              </div>
            </div>

            {/* Refund Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-surface border border-line shadow-xs space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">
                {t('Refund Breakdown', 'திரும்பப் பெறும் தொகை விபரம்')}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">{t('Fare Paid (Original)', 'செலுத்திய கட்டணம்')}</span>
                  <span className="font-bold font-mono">₹{farePaid}.00</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>{t('Cancellation Fee (Zero Policy)', 'ரத்து கட்டணம்')}</span>
                  <span className="font-bold font-mono">- ₹0.00</span>
                </div>
                <div className="pt-2 border-t border-line flex justify-between text-sm font-bold text-content">
                  <span>{t('Total Net Refundable Amount', 'மொத்த ரீபண்ட் தொகை')}</span>
                  <span className="font-mono text-emerald-700 text-base">₹{netRefund}.00</span>
                </div>
              </div>

              <div className="pt-2 border-t border-line text-[11px] text-muted space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('Credit Mode: Original Source (UPI / Card / Bank)', 'அசல் கட்டண முறைக்கே திரும்பும்')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-brand-text font-medium">
                  <Clock className="w-3.5 h-3.5 text-brand-text shrink-0" />
                  <span>{t('Speed: Credited within 15 to 30 minutes', '15 - 30 நிமிடங்களில் உங்கள் கணக்கில் சேரும்')}</span>
                </div>
              </div>
            </div>

            {/* Reassurance Guarantee Note */}
            <div className="p-3.5 rounded-xl bg-brand-tint border border-brand-line flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-text shrink-0 mt-0.5" />
              <div className="text-[11px] text-muted leading-relaxed">
                <span className="font-bold text-content block">
                  {t('Protected by Passenger Protection Charter', 'பயணிகள் பாதுகாப்பு உரிமை உத்தரவாதம்')}
                </span>
                {t(
                  `Your refund is processed directly by the Tamil Nadu Waterways Authority. In case of any bank query, our 24/7 helpline is available at ${HELPLINE}.`,
                  `உங்கள் ரீபண்ட் தமிழ்நாடு நீர்வழி ஆணையத்தால் நேரடியாக கையாளப்படுகிறது. ஏதேனும் சந்தேகம் இருந்தால் ${HELPLINE} என்ற எண்ணை அழைக்கவும்.`
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer"
              >
                {t(`Confirm Cancellation (Refund ₹${netRefund})`, `ரத்து செய்வதை உறுதிசெய் (ரீபண்ட் ₹${netRefund})`)}
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="py-3 px-4 rounded-xl bg-surface-2 hover:bg-line text-content font-bold text-xs transition-all cursor-pointer"
              >
                {t('Keep My Pass', 'சீட்டை தக்கவைத்துக்கொள்')}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 text-center space-y-5 text-content">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-content">
                {t('Refund Processed Successfully', 'ரீஃபண்ட் வெற்றிகரமாக பதிவு செய்யப்பட்டது')}
              </h3>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                {t(
                  'We have initiated the reversal of ₹' + netRefund + '.00 to your original payment method.',
                  '₹' + netRefund + '.00 தொகை உங்கள் அசல் கட்டண முறைக்கு திரும்ப அனுப்பப்பட்டுள்ளது.'
                )}
              </p>
            </div>

            {/* Refund Receipt Details Card */}
            <div className="p-4 rounded-2xl bg-surface-2 border border-line text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('Refund Tracking ID', 'ரீஃபண்ட் குறிப்பு எண்')}</span>
                <span className="font-mono font-bold text-brand-text">{generatedRefundRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('Amount Credited', 'தொகை')}</span>
                <span className="font-mono font-bold text-emerald-700">₹{netRefund}.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('Expected Credit Window', 'வரவு வைக்கப்படும் நேரம்')}</span>
                <span className="font-semibold text-content">15 - 30 minutes (UPI)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{t('Status', 'நிலை')}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {t('PROCESSED', 'முடிக்கப்பட்டது')}
                </span>
              </div>
            </div>

            {/* Need Help link */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleModalClose();
                  onOpenCustomerCare();
                }}
                className="text-xs font-bold text-brand-text hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Headset className="w-3.5 h-3.5" />
                <span>{t('Need assistance? Contact Customer Care', 'உதவி தேவையா? உதவி மையத்தை அணுகவும்')}</span>
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-inverse text-white font-bold text-xs hover:bg-[#2b3034] transition-all cursor-pointer"
              >
                {t('Done', 'முடிந்தது')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
