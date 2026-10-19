import React, { useRef, useEffect } from 'react';
import { renderTicketQR } from '../lib/ticketQR';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Headset,
  RotateCcw,
} from 'lucide-react';
import { BoardingPassIcon } from './icons';
import { Ticket, Language } from '../types';
import { HELPLINE, WHATSAPP_DISPLAY, REFUND_POLICY_EN, REFUND_POLICY_TA } from '../constants/support';

interface MyTicketsViewProps {
  tickets: Ticket[];
  language: Language;
  onCancelTicket: (ticket: Ticket) => void;
  onOpenCustomerCare: () => void;
}

export const MyTicketsView: React.FC<MyTicketsViewProps> = ({
  tickets,
  language,
  onCancelTicket,
  onOpenCustomerCare,
}) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);

  const activeTickets = tickets.filter((tkt) => tkt.status === 'ACTIVE');
  const pastTickets = tickets.filter((tkt) => tkt.status !== 'ACTIVE');

  return (
    <div className="bg-surface text-content min-h-[calc(100vh-4rem)] py-8 sm:py-14 px-4 sm:px-[6%]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with Customer Care CTA */}
        <div className="pb-5 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
              {t('My Digital Passes', 'என் டிஜிட்டல் சீட்டுகள்')}
            </h1>
          </div>

          <button
            type="button"
            onClick={onOpenCustomerCare}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-brand-tint hover:bg-brand-line/50 text-brand-text border border-brand-line text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <Headset className="w-4 h-4 text-brand-text" />
            <span>{t('24/7 Helpline & Support', '24/7 உதவி மையம்')}</span>
          </button>
        </div>

        {/* 1. Active Passes — first priority */}
        {tickets.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-line flex items-center justify-center mx-auto mb-4 text-brand-text">
              <BoardingPassIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-content mb-1">
              {t('No Passes Yet', 'இன்னும் சீட்டுகள் இல்லை')}
            </h3>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              {t(
                'Plan a journey to get your instant digital pass.',
                'உடனடி டிஜிட்டல் பாஸ் பெற உங்கள் பயணத்தைத் திட்டமிடுங்கள்.'
              )}
            </p>
          </div>
        ) : (
          activeTickets.length > 0 && (
            <div>
              <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
                {t('Ready to Board', 'பயணிக்க தயார்')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeTickets.map((tkt) => (
                  <TicketCard
                    key={tkt.id}
                    ticket={tkt}
                    language={language}
                    onCancelClick={() => onCancelTicket(tkt)}
                  />
                ))}
              </div>
            </div>
          )
        )}

        {/* 2. Support & Refund Policy Instructions */}
        <div className="p-4 rounded-2xl bg-brand-tint border border-brand-line space-y-3 text-xs">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-brand-text shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-content block">
                {t('Refund Policy', 'ரீஃபண்ட் கொள்கை')}
              </span>
              <span className="text-muted leading-relaxed">
                {t(REFUND_POLICY_EN, REFUND_POLICY_TA)}
              </span>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Headset className="w-4 h-4 text-brand-text shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-content block">
                {t('Support', 'உதவி')}
              </span>
              <span className="text-muted leading-relaxed">
                {t(
                  `24/7 helpline ${HELPLINE} · WhatsApp ${WHATSAPP_DISPLAY}. For help with passes, refunds or complaints, tap 24/7 Helpline & Support above.`,
                  `24/7 உதவி எண் ${HELPLINE} · வாட்ஸ்அப் ${WHATSAPP_DISPLAY}. சீட்டு, ரீஃபண்ட், புகார்களுக்கு மேலே உள்ள 24/7 உதவி மையம் பொத்தானை அழைக்கவும்.`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Past / Cancelled Passes */}
        {pastTickets.length > 0 && (
          <div>
            <h2 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">
              {t('Past & Cancelled Passes', 'முடிந்த & ரத்து செய்யப்பட்டவை')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-85">
              {pastTickets.map((tkt) => (
                <TicketCard
                  key={tkt.id}
                  ticket={tkt}
                  language={language}
                  onCancelClick={() => onCancelTicket(tkt)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TicketCard: React.FC<{
  ticket: Ticket;
  language: Language;
  onCancelClick: () => void;
}> = ({ ticket, language, onCancelClick }) => {
  const t = (en: string, ta: string) => (language === 'en' ? en : ta);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || ticket.status === 'CANCELLED') return;
    renderTicketQR(canvasRef.current, ticket, 125);
  }, [ticket]);

  const isActive = ticket.status === 'ACTIVE';
  const isCancelled = ticket.status === 'CANCELLED';

  return (
    <div
      className={`bg-surface border rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
        isCancelled ? 'border-amber-200 bg-amber-50/10' : 'border-line'
      }`}
    >
      {/* Card Header */}
      <div className="bg-surface-2 border-b border-line px-5 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`w-2 h-2 rounded-full ${
              isCancelled ? 'bg-amber-500' : 'bg-brand'
            }`}
          ></span>
          <span className="text-xs font-bold text-content">
            {t('Line', 'தடம்')} {ticket.routeCode}
          </span>
          <span className="text-line">•</span>
          <span className="text-xs font-mono font-medium text-muted">
            {ticket.bookingRef}
          </span>
        </div>

        <div>
          {isActive ? (
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-tint text-brand-text border border-brand-line">
              <CheckCircle2 className="w-3 h-3 text-brand-text" />
              <span>{t('Boarding Ready', 'ஏற தயார்')}</span>
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>
                {t('Refund Processed', 'ரீஃபண்ட் முடிக்கப்பட்டது')}
              </span>
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-line text-content">
              {ticket.status === 'BOARDED'
                ? t('Boarded', 'ஏறியது')
                : t('Completed', 'முடிந்தது')}
            </span>
          )}
        </div>
      </div>

      {/* Main Card Body */}
      <div className="p-5 flex flex-col sm:flex-row gap-5 items-center justify-between">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
            <span className="text-base font-bold text-content break-words">
              {ticket.originName}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0 rotate-90 sm:rotate-0" />
            <span className="text-base font-bold text-content break-words">
              {ticket.destinationName}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-line text-xs">
            <div>
              <span className="text-muted block text-[9px]">{t('Date', 'தேதி')}</span>
              <span className="font-semibold text-content">{ticket.journeyDate}</span>
            </div>
            <div>
              <span className="text-muted block text-[9px]">{t('Boarding', 'நேரம்')}</span>
              <span className="font-semibold text-content">{ticket.departureTime}</span>
            </div>
            <div>
              <span className="text-muted block text-[9px]">{t('Fare', 'கட்டணம்')}</span>
              <span className="font-semibold text-content">
                ₹{ticket.fareInr} ({ticket.passengerCount}p)
              </span>
            </div>
          </div>

          {isCancelled ? (
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900">
              <div className="flex items-center justify-between font-bold gap-2">
                <span>
                  {t('100% Refund Credited', 'முழுத் தொகை வரவு வைக்கப்பட்டது')} · ₹
                  {ticket.refundAmountInr || ticket.fareInr}
                </span>
                <span className="font-mono text-emerald-800 shrink-0">
                  {ticket.refundRef || 'RFND-PROCESSED'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-[10px] text-muted pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-text shrink-0 mt-px" />
              <span>{t('Valid offline at all gates', 'அனைத்து கேட்டுகளிலும் செல்லுபடியாகும்')}</span>
            </div>
          )}
        </div>

        {/* QR Code Presentation or Cancelled Stamp */}
        <div className="bg-surface-2 p-2 rounded-xl border border-line shrink-0 text-center min-w-[135px] flex flex-col items-center justify-center">
          {isCancelled ? (
            <div className="py-6 px-3 flex flex-col items-center justify-center text-center">
              <RotateCcw className="w-8 h-8 text-emerald-600 mb-1" />
              <span className="text-[11px] font-bold text-content block">
                {t('PASS CANCELLED', 'ரத்து செய்யப்பட்டது')}
              </span>
            </div>
          ) : (
            <>
              <canvas ref={canvasRef} className="rounded-lg mx-auto" />
              <span className="text-[8px] font-mono text-muted block mt-1">
                {t('SCAN AT TURNSTILE', 'டர்ன்ஸ்டைலில் ஸ்கேன்')}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      {!isCancelled && (
        <div className="bg-surface-2 border-t border-line px-5 py-2.5 flex flex-wrap items-center justify-end gap-4 text-xs">
          <button
            type="button"
            onClick={() => window.print()}
            className="text-content hover:text-brand-text font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('Print Pass', 'அச்சிடு')}</span>
          </button>

          {isActive && (
            <button
              type="button"
              onClick={onCancelClick}
              className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer transition-colors"
            >
              {t('Cancel Pass & Refund', 'சீட்டை ரத்து செய்து ரீபண்ட் பெற')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
