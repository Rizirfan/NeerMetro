import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  X,
  ArrowRight,
  Send,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Headset,
  PhoneCall,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Clock,
  Sparkles,
  Radar,
  Coins,
  MapPin,
  QrCode,
} from 'lucide-react';
import { FerryIcon, BoardingPassIcon } from './icons';
import { Language, ParsedVoiceCommand } from '../types';
import { parseVoiceIntent, speakText, playChime, reconstructCleanUserQuery } from '../services/voiceAssistant';
import {
  puterVoiceService,
} from '../services/puterVoiceService';
import {
  nativeVoiceService,
} from '../services/nativeVoiceService';
import {
  queryVectorKnowledgeBase,
  KNOWLEDGE_BASE_DOCS,
  KnowledgeDocument,
} from '../services/knowledgeBase';
import { STATIONS } from '../data/mockData';
import { planJourneys } from '../services/journeyPlanner';
import { HELPLINE, WHATSAPP_LINK } from '../constants/support';


interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onExecuteAction: (intent: string, payload?: { origin?: string; destination?: string; ferryId?: string; tab?: string }) => void;
  onOpenCustomerCare?: () => void;
  autoStartListening?: boolean;
}

const QUICK_COMMANDS = [
  { textEn: 'How do I get from Koyambedu to Egmore?', textTa: 'கோயம்பேடு முதல் எழும்பூர் வரை எப்படி போவது?', tag: 'Route' },
  { textEn: 'Zero-Panic Refund & Cancellation Policy', textTa: 'பயணச் சீட்டு ரத்து & உடனடி ரீஃபண்ட் கொள்கை', tag: 'Refund' },
  { textEn: '24/7 Customer Care & Helpline Numbers', textTa: '24/7 வாடிக்கையாளர் உதவி மையம் & எண்கள்', tag: 'Care' },
  { textEn: 'Student & Senior Citizen Concessions', textTa: 'மாணவர் மற்றும் முதியோர் கட்டணச் சலுகை', tag: 'Fares' },
  { textEn: 'Baggage Allowance & Folding Bicycles', textTa: 'லக்கேஜ் & மடிக்கக்கூடிய சைக்கிள் விதிகள்', tag: 'Rules' },
  { textEn: 'Wheelchair & 100% Universal Accessibility', textTa: 'முழு சக்கர நாற்காலி அணுகல் வசதி', tag: 'Access' },
  { textEn: 'Where is electric ferry F-102?', textTa: 'படகு F-102 எங்கே இருக்கிறது?', tag: 'Tracker' },
  { textEn: 'Lost & Found Central Property Locker', textTa: 'தொலைந்த பொருட்கள் பாதுகாப்பு மையம்', tag: 'Lost' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  command?: ParsedVoiceCommand;
  lang?: 'en' | 'ta';
}

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  language: initialLanguage,
  onExecuteAction,
  onOpenCustomerCare,
  autoStartListening,
}) => {
  // Local language state (can be toggled in header)
  const [localLang, setLocalLang] = useState<Language>(initialLanguage);

  // Voice Engine State: 'vx' (VX Voice - Device Native Speech, 100% Zero-Login) or 'puter' (Puter.js Cloud AI Whisper)
  const [voiceEngine, setVoiceEngine] = useState<'vx' | 'puter'>('vx');
  const [isPuterAuthed, setIsPuterAuthed] = useState<boolean>(false);

  // Puter.js Service state
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);

  // Mute voice response (silent mode)
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Listening & conversation state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Guards and recognition references
  const isProcessingRef = useRef(false);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  const latestTranscriptRef = useRef('');

  const greetingMessage = useCallback((): ChatMessage => ({
    id: 'greet_0',
    role: 'assistant',
    text:
      localLang === 'en'
        ? 'Hello! Welcome to NEERMETRO Chennai Water Metro Assistant. Press the mic to speak, then tap to stop for an instant answer!'
        : 'வணக்கம்! சென்னை நீர்மெட்ரோ வழிகாட்டிக்கு வரவேற்கிறோம். மைக் பட்டனை அழுத்திப் பேசி, நிறுத்தியதும் உடனடியாகப் பதில் பெறுங்கள்!',
    time: nowTime(),
    command: {
      intent: 'GREETING',
      rawQuery: 'hi',
      confidence: 1.0,
      spokenReplyEn: 'Hello! Welcome to NEERMETRO. How can I help you today?',
      spokenReplyTa: 'வணக்கம்! சென்னை நீர்மெட்ரோ உதவி மையத்திற்கு வரவேற்கிறோம்.',
    },
  }), [localLang]);

  // Subscribe to Puter.js AI voice state updates
  useEffect(() => {
    const unsubscribe = puterVoiceService.subscribe((state) => {
      setLiveAudioLevel(state.audioLevel);
      if (state.status === 'recording') {
        setIsListening(true);
        setIsTranscribing(false);
      } else if (state.status === 'transcribing') {
        setIsListening(false);
        setIsTranscribing(true);
      } else if (state.status === 'idle') {
        setIsListening(false);
        setIsTranscribing(false);
      } else if (state.status === 'error') {
        setIsListening(false);
        setIsTranscribing(false);
        if (state.errorMessage) {
          setErrorMessage(state.errorMessage);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLocalLang(initialLanguage);
  }, [initialLanguage]);

  // Pre-load Puter.js in background
  useEffect(() => {
    puterVoiceService.ensurePuterLoaded().catch(() => {});
  }, []);

  // Auto-scroll conversation log to newest message
  useEffect(() => {
    const el = chatLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Command processing logic — executes with 0ms artificial delay for lightning-fast replies
  const processCommand = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Barge-in: cancel any ongoing speech synthesis immediately
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 1. Parse intent & resolve slots first
    const parsed = parseVoiceIntent(trimmed);

    // 2. Reconstruct clean, accurate, and properly formatted user query text
    const cleanUserText = reconstructCleanUserQuery(trimmed, parsed);

    // 3. Append clean, proper user text bubble into conversation log immediately
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        role: 'user' as const,
        text: cleanUserText,
        time: nowTime(),
      },
    ]);

    // 3. Knowledge doc resolution (single KB pass — queryVectorKnowledgeBase
    // already filters results to score > 0.05 internally)
    let doc: KnowledgeDocument | null = null;
    if (parsed.knowledgeDocId) {
      doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === parsed.knowledgeDocId) || null;
    }
    if (
      !doc &&
      (parsed.intent === 'CUSTOMER_CARE' ||
        parsed.intent === 'CANCEL_BOOKING' ||
        parsed.intent === 'KNOWLEDGE_SEARCH')
    ) {
      const topHits = queryVectorKnowledgeBase(trimmed, 1);
      if (topHits.length > 0) {
        doc = topHits[0].document;
      }
    }

    // 4. Determine response language & reply text
    const hasTamilChar = /[\u0B80-\u0BFF]/.test(trimmed);
    const replyLang: 'en' | 'ta' = (localLang === 'ta' || hasTamilChar) ? 'ta' : 'en';

    let reply = replyLang === 'ta' ? parsed.spokenReplyTa : parsed.spokenReplyEn;
    if (
      doc &&
      parsed.intent !== 'PLAN_JOURNEY' &&
      parsed.intent !== 'GREETING' &&
      parsed.intent !== 'THANKS' &&
      parsed.intent !== 'ABOUT' &&
      parsed.intent !== 'TRACK_FERRY' &&
      parsed.intent !== 'NEXT_FERRY' &&
      parsed.intent !== 'SHOW_TICKET' &&
      parsed.intent !== 'FARE_INQUIRY' &&
      parsed.intent !== 'NEAREST_STATION'
    ) {
      reply = replyLang === 'ta' ? doc.summaryTa : doc.summaryEn;
    }

    if (parsed.intent === 'UNKNOWN') {
      reply =
        replyLang === 'ta'
          ? `மன்னிக்கவும், "${cleanUserText}" சரியாகப் புரியவில்லை. 'கோயம்பேடு முதல் எழும்பூர் வரை', 'அடுத்த படகு', அல்லது 'வாடிக்கையாளர் உதவி' என்று கேட்டுப் பாருங்கள்.`
          : `I heard: "${cleanUserText}". I couldn't recognize that transit request. Try saying: "From Koyambedu to Egmore", "Next ferry", or "Customer care" (or select a route below).`;
      playChime('error');
    } else {
      playChime('success');
    }

    // 5. Post response to chat immediately (<30ms) and speak aloud
    setMessages((prev) => [
      ...prev,
      {
        id: `bot_${Date.now()}`,
        role: 'assistant' as const,
        text: reply,
        time: nowTime(),
        command: parsed,
        lang: replyLang,
      },
    ]);
    isProcessingRef.current = false;
    setIsListening(false);
    setIsTranscribing(false);
    setTranscript('');
    setManualInput('');

    // Text-to-Speech: speak response aloud immediately unless muted
    if (!isMuted) {
      speakText(reply, replyLang).catch(() => {});
    }
  }, [localLang, isMuted]);

  // Stop listening: transcribes audio via active voice engine (VX or Puter.js) and processes response immediately
  const stopListening = async (opts?: { skipAutoProcess?: boolean }) => {
    setIsListening(false);
    if (opts?.skipAutoProcess) {
      if (voiceEngine === 'vx') {
        nativeVoiceService.abort();
      } else {
        puterVoiceService.cancel();
      }
      setIsTranscribing(false);
      return;
    }

    if (voiceEngine === 'vx') {
      const text = nativeVoiceService.stopListening();
      setIsTranscribing(false);
      const trimmed = (text || latestTranscriptRef.current).trim();
      if (trimmed) {
        setTranscript(trimmed);
        setManualInput('');
        await processCommand(trimmed);
      }
    } else {
      setIsTranscribing(true);
      try {
        const text = await puterVoiceService.stopRecordingAndTranscribe({
          language: localLang === 'ta' ? 'ta' : 'en',
        });
        setIsTranscribing(false);
        const trimmed = (text || latestTranscriptRef.current).trim();
        if (trimmed) {
          setTranscript(trimmed);
          setManualInput('');
          await processCommand(trimmed);
        }
      } catch (err: unknown) {
        setIsTranscribing(false);
        const e = err as Error;
        setErrorMessage(
          localLang === 'ta'
            ? `Puter.js தகவல்: ${e.message}. உடனடி குரல் தேடலுக்கு 'VX குரல்' முறைக்கு மாறலாம்.`
            : `Puter.js notice: ${e.message}. You can switch to 'VX Voice' for zero-login speech.`
        );
      }
    }
  };

  // Start Active Speech-to-Text Listening Pipeline (VX Zero-Login Native vs Puter.js AI)
  const startListening = useCallback(async () => {
    if (isProcessingRef.current || isTranscribing) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setErrorMessage('');
    setTranscript('');
    latestTranscriptRef.current = '';

    if (voiceEngine === 'vx') {
      if (!nativeVoiceService.isSupported()) {
        setErrorMessage(
          localLang === 'ta'
            ? 'இந்த உலாவியில் VX குரல் வசதி இல்லை. Puter.js AI அல்லது Chrome/Edge பயன்படுத்தவும்.'
            : 'VX Voice is not supported in this browser. Please use Chrome/Edge or switch to Puter.js AI.'
        );
        return;
      }

      try {
        playChime('start');
        setIsListening(true);
        setIsTranscribing(false);

        await nativeVoiceService.startListening({
          language: localLang === 'ta' ? 'ta' : 'en',
          onAudioLevel: (lvl) => setLiveAudioLevel(lvl),
          onInterim: (liveText) => {
            if (isOpenRef.current && liveText) {
              latestTranscriptRef.current = liveText;
              setTranscript(liveText);
              setManualInput(liveText);
            }
          },
          onSpeechEnd: () => {
            if (isOpenRef.current && !isProcessingRef.current) {
              stopListening();
            }
          },
          onFinal: (finalText) => {
            if (isOpenRef.current && finalText) {
              latestTranscriptRef.current = finalText;
            }
          },
          onError: (err) => {
            setErrorMessage(err);
          },
        });
      } catch (err: unknown) {
        setIsListening(false);
        const e = err as Error;
        setErrorMessage(`Microphone / Voice: ${e.message}`);
      }
    } else {
      // Puter.js AI Engine
      try {
        playChime('start');
        setIsListening(true);
        setIsTranscribing(false);

        await puterVoiceService.startRecording({
          language: localLang === 'ta' ? 'ta' : 'en',
          onAudioLevel: (lvl) => setLiveAudioLevel(lvl),
          onInterim: (liveText) => {
            if (isOpenRef.current && liveText) {
              latestTranscriptRef.current = liveText;
              setTranscript(liveText);
              setManualInput(liveText);
            }
          },
          onSilence: () => {
            if (isOpenRef.current && !isProcessingRef.current) {
              stopListening();
            }
          },
        });
      } catch (err: unknown) {
        setIsListening(false);
        const e = err as Error;
        setErrorMessage(`Microphone / Puter.js: ${e.message}. You can also type below.`);
      }
    }
  }, [localLang, isTranscribing, voiceEngine]);

  // Clean, rock-solid toggle listening handler: Tap to start, Tap to stop
  const toggleListening = () => {
    if (isListening || isTranscribing) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) {
      nativeVoiceService.abort();
      puterVoiceService.cancel();
      stopListening({ skipAutoProcess: true });
      setTranscript('');
      setErrorMessage('');
      isProcessingRef.current = false;
      setIsTranscribing(false);
    } else {
      setIsPuterAuthed(puterVoiceService.isSignedIn());
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setMessages((prev) => (prev.length > 0 ? prev : [greetingMessage()]));

      if (autoStartListening) {
        const timer = setTimeout(() => {
          if (isOpenRef.current) {
            startListening();
          }
        }, 160);
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoStartListening]);

  if (!isOpen) return null;

  const runPrompt = (cmd: { textEn: string; textTa: string } | string) => {
    const text = typeof cmd === 'string' ? cmd : (localLang === 'ta' ? cmd.textTa : cmd.textEn);
    latestTranscriptRef.current = text;
    setTranscript(text);
    processCommand(text);
  };

  const t = (en: string, ta: string) => (localLang === 'en' ? en : ta);

  const renderJourneyCard = (cmd: ParsedVoiceCommand) => {
    const originCode = cmd.origin || 'KOY';
    const destCode = cmd.destination || 'EGM';
    const oStn = STATIONS.find((s) => s.code === originCode);
    const dStn = STATIONS.find((s) => s.code === destCode);
    const plans = planJourneys(originCode, destCode);
    const plan = plans[0];
    const duration = plan ? plan.totalDurationMin : 24;
    const fare = plan ? plan.totalFareInr : 35;
    const lineCode = plan?.legs.find((l) => l.mode === 'WATER_METRO')?.routeCode || 'C1';

    return (
      <div className="mt-2.5 bg-gradient-to-br from-brand-tint to-surface border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-line/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
              <FerryIcon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text truncate">
              {t('FASTEST WATER CORRIDOR', 'வேகமான நீர்வழிப் பாதை')} · Line {lineCode}
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            {duration} min · ₹{fare}
          </span>
        </div>

        {/* Route visualization */}
        <div className="flex items-center justify-between gap-2 my-2 py-2 px-3 bg-surface/95 rounded-xl border border-line">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase text-muted block">From</span>
            <span className="text-xs sm:text-sm font-extrabold text-content truncate block">
              {localLang === 'en' ? oStn?.nameEn : oStn?.nameTa}
            </span>
          </div>
          <div className="flex items-center gap-1 text-brand-text shrink-0 px-1">
            <div className="w-5 h-0.5 bg-brand-line" />
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <span className="text-[9px] font-bold uppercase text-muted block">To</span>
            <span className="text-xs sm:text-sm font-extrabold text-content truncate block">
              {localLang === 'en' ? dStn?.nameEn : dStn?.nameTa}
            </span>
          </div>
        </div>

        {/* Action Button: Redirect to Journey Planner */}
        <div className="mt-3 pt-2.5 border-t border-brand-line/60 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted truncate">
            {t('Departures every 8 mins', '8 நிமிடங்களுக்கு ஒரு படகு')}
          </span>
          <button
            type="button"
            onClick={() => {
              onExecuteAction('PLAN_JOURNEY', { origin: originCode, destination: destCode });
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
          >
            <span>{t('Open in Journey Planner', 'பயணத் திட்டத்தில் திற')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderGreetingCard = () => (
    <div className="mt-3 bg-gradient-to-br from-brand-tint/90 via-surface to-brand-tint border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-brand-line/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-text" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-text">
            {t('Transit Directory & Quick Services', 'நீர்வழிச் சேவைகள் & முக்கிய விவரங்கள்')}
          </span>
        </div>
        <span className="text-[9px] font-mono font-semibold text-brand-text bg-brand-tint px-2 py-0.5 rounded-full border border-brand-line">
          {t('Tap to explore', 'தொடவும்')}
        </span>
      </div>
      {renderQuickActionButtons()}
    </div>
  );

  const renderKnowledgeCard = (doc: KnowledgeDocument) => (
    <div className="mt-2.5 bg-gradient-to-br from-brand-tint to-surface border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-line/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
            {doc.category === 'CANCELLATION_REFUND' ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : doc.category === 'CUSTOMER_CARE_MANAGEMENT' ? (
              <Headset className="w-3.5 h-3.5" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5" />
            )}
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text truncate">
            {doc.category.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
          100% Policy Verified
        </span>
      </div>

      <h4 className="text-xs sm:text-sm font-bold text-content leading-snug">
        {localLang === 'en' ? doc.titleEn : doc.titleTa}
      </h4>

      <p className="text-[11px] sm:text-xs text-muted mt-1 leading-relaxed">
        {localLang === 'en' ? doc.summaryEn : doc.summaryTa}
      </p>

      {/* Reassuring key points */}
      <div className="mt-2.5 space-y-1.5 bg-surface/95 p-2.5 rounded-xl border border-line">
        {(localLang === 'en' ? doc.bulletPointsEn : doc.bulletPointsTa).slice(0, 4).map((pt, idx) => (
          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-content">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-tight">{pt}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-brand-line/60 flex flex-wrap gap-2">
        {doc.category === 'CUSTOMER_CARE_MANAGEMENT' && (
          <>
            <a
              href={`tel:${HELPLINE.replace(/-/g, '')}`}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call {HELPLINE}</span>
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp Agent</span>
            </a>
            {onOpenCustomerCare && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomerCare();
                }}
                className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Headset className="w-3 h-3" />
                <span>Open Support Console</span>
              </button>
            )}
          </>
        )}

        {doc.category === 'CANCELLATION_REFUND' && (
          <>
            <button
              type="button"
              onClick={() => {
                onClose();
                onExecuteAction('SHOW_TICKET');
              }}
              className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ArrowRight className="w-3 h-3" />
              <span>Go to My Passes to Cancel</span>
            </button>
            {onOpenCustomerCare && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCustomerCare();
                }}
                className="px-3 py-1.5 rounded-xl bg-surface hover:bg-brand-tint text-brand-text border border-brand-line text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Headset className="w-3 h-3" />
                <span>Track Refund Reference</span>
              </button>
            )}
          </>
        )}

        {doc.category !== 'CUSTOMER_CARE_MANAGEMENT' && doc.category !== 'CANCELLATION_REFUND' && doc.suggestedAction && (
          <button
            type="button"
            onClick={() => {
              onClose();
              const action = doc.suggestedAction;
              if (!action) return;
              if (action.actionType === 'NAVIGATE_TAB') {
                onExecuteAction('NAVIGATE_TAB', { tab: action.payload });
              } else if (action.actionType === 'OPEN_SUPPORT') {
                onOpenCustomerCare?.();
              } else if (action.actionType === 'CALL_HELPLINE') {
                window.location.href = `tel:${HELPLINE.replace(/-/g, '')}`;
              } else if (action.actionType === 'WHATSAPP_SUPPORT') {
                window.open(WHATSAPP_LINK, '_blank', 'noopener');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>{localLang === 'en' ? doc.suggestedAction.labelEn : doc.suggestedAction.labelTa}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );

  const renderTrackerCard = (cmd: ParsedVoiceCommand) => {
    const ferryId = cmd.ferryId || 'F-102';
    return (
      <div className="mt-2.5 bg-gradient-to-br from-brand-tint to-surface border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-line/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
              <Radar className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text truncate">
              {t('LIVE FAIRWAY AIS TELEMETRY', 'நேரலை படகு கண்காணிப்பு')} · {ferryId}
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            18 km/h · 92% Battery
          </span>
        </div>

        <div className="my-2 py-2 px-3 bg-surface/95 rounded-xl border border-line space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-medium">{t('Sector:', 'பகுதி:')}</span>
            <span className="font-bold text-content">Chetpet ⇄ Egmore Quay</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-medium">{t('ETA Next Quay:', 'அடுத்த வருகை:')}</span>
            <span className="font-bold text-emerald-700">~4 mins</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-brand-line/60 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">
            {t('GPS Fairway Transponder active', 'GPS நேரலை கண்காணிப்பு செயலில் உள்ளது')}
          </span>
          <button
            type="button"
            onClick={() => {
              onExecuteAction('TRACK_FERRY', { ferryId });
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
          >
            <span>{t('Track on Live Map', 'நேரலை வரைபடத்தில் பார்')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderNextFerryCard = (cmd: ParsedVoiceCommand) => {
    const destCode = cmd.destination || 'EGM';
    const dStn = STATIONS.find((s) => s.code === destCode);
    const destName = localLang === 'ta' ? (dStn?.nameTa || 'எழும்பூர்') : (dStn?.nameEn || 'Egmore');

    return (
      <div className="mt-2.5 bg-gradient-to-br from-brand-tint to-surface border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-line/60">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text truncate">
              {t('NEXT DEPARTURE', 'அடுத்த புறப்பாடு')} · Line C1
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            {t('Departs in 4 min', '4 நிமிடத்தில்')}
          </span>
        </div>

        <div className="my-2 py-2 px-3 bg-surface/95 rounded-xl border border-line">
          <div className="text-[11px] text-muted">{t('Destination Terminal', 'சேருமிடம்')}</div>
          <div className="text-sm font-extrabold text-content">{destName}</div>
          <div className="text-[10px] text-muted mt-0.5">Pontoon Gate 2 · Headway every 8 mins</div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-brand-line/60 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">
            {t('Regular electric ferry service', 'தொடர் மின்சார படகு சேவை')}
          </span>
          <button
            type="button"
            onClick={() => {
              onExecuteAction('NEXT_FERRY', { destination: destCode });
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
          >
            <span>{t('View Schedule & Fares', 'அட்டவணை & கட்டணம்')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderTicketCard = () => (
    <div className="mt-2.5 bg-gradient-to-br from-brand-tint to-surface border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-line/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
            <BoardingPassIcon className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text truncate">
            {t('DIGITAL BOARDING PASS & QR', 'டிஜிட்டல் டிக்கெட் & QR')}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
          {t('Turnstile Ready', 'ஸ்கேன் செய்ய தயார்')}
        </span>
      </div>

      <div className="my-2 py-2 px-3 bg-surface/95 rounded-xl border border-line flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-content">Koyambedu ⇄ Egmore</div>
          <div className="text-[10px] text-muted">Line C1 · Electric Water Metro Pass</div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-brand-tint border border-brand-line flex items-center justify-center text-brand-text">
          <QrCode className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-brand-line/60 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted">{t('Instant Turnstile Access', 'விரைவு QR நுழைவு')}</span>
        <button
          type="button"
          onClick={() => {
            onExecuteAction('SHOW_TICKET');
            onClose();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
        >
          <span>{t('Open My Passes', 'என் டிக்கெட்டுகளைத் திற')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const renderNearestStationCard = () => (
    <div className="mt-2.5 bg-gradient-to-br from-brand-tint to-surface border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-line/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text truncate">
            {t('CLOSEST WATER QUAY', 'அருகிலுள்ள முனையம்')}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold text-brand-text bg-brand-tint px-2 py-0.5 rounded-full border border-brand-line shrink-0">
          ~350m · 4 min walk
        </span>
      </div>

      <div className="my-2 py-2 px-3 bg-surface/95 rounded-xl border border-line">
        <div className="text-xs font-extrabold text-content">
          {localLang === 'ta' ? 'கோயம்பேடு மத்திய நீர்முனையம்' : 'Koyambedu Central Hub Quay'}
        </div>
        <div className="text-[10px] text-muted mt-0.5">
          {t('Direct covered walkway from CMBT Metro & Bus Terminal · Line C1 Pontoon Gate 1 & 2', 'CMBT மெட்ரோ மற்றும் பேருந்து நிலையத்திலிருந்து நேரடி இணைப்பு')}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-brand-line/60 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted">{t('10 quays across Cooum', '10 முனையங்கள்')}</span>
        <button
          type="button"
          onClick={() => {
            onExecuteAction('NEAREST_STATION');
            onClose();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
        >
          <span>{t('View Station Directory', 'நிலைய விவரங்கள்')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const renderFareCard = () => (
    <div className="mt-2.5 bg-gradient-to-br from-brand-tint to-surface border border-brand-line rounded-2xl p-3.5 sm:p-4 text-left shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-brand-line/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-5 h-5 rounded-md bg-brand text-white flex items-center justify-center shrink-0">
            <Coins className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text truncate">
            {t('FARE STRUCTURE & DISCOUNTS', 'கட்டண விவரம் & சலுகைகள்')}
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
          From ₹15
        </span>
      </div>

      <div className="my-2 py-2 px-3 bg-surface/95 rounded-xl border border-line space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted">{t('Base Fare (1-3 km):', 'அடிப்படை கட்டணம் (1-3 கிமீ):')}</span>
          <span className="font-bold text-content">₹15</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t('Each Additional km:', 'ஒவ்வொரு கூடுதல் கிமீ:')}</span>
          <span className="font-bold text-content">₹3 / km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">{t('Student & Senior Concession:', 'மாணவர் & முதியோர் சலுகை:')}</span>
          <span className="font-bold text-emerald-700">{t('50% Concession', '50% தள்ளுபடி')}</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-brand-line/60 flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted">{t('Unified Singara Chennai Card accepted', 'சிங்கார சென்னை கார்டு ஏற்றுக்கொள்ளப்படும்')}</span>
        <button
          type="button"
          onClick={() => {
            onExecuteAction('FARE_INQUIRY');
            onClose();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-brand hover:bg-brand-strong text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
        >
          <span>{t('Open Full Fare Matrix', 'முழுக் கட்டணப் பட்டியல்')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  const quickByTag = (tag: string) => QUICK_COMMANDS.find((c) => c.tag === tag)!;

  const featureCards = [
    { tag: 'Tracker', icon: <Radar className="w-5 h-5" />, tint: 'text-purple-600 bg-purple-50' },
    { tag: 'Fares', icon: <Coins className="w-5 h-5" />, tint: 'text-amber-600 bg-amber-50' },
    { tag: 'Refund', icon: <ShieldCheck className="w-5 h-5" />, tint: 'text-emerald-600 bg-emerald-50' },
    { tag: 'Access', icon: <HelpCircle className="w-5 h-5" />, tint: 'text-blue-600 bg-blue-50' },
  ];

  const popularTags = ['Route', 'Rules', 'Lost'];

  // Shared quick actions — single source for both the welcome panel and the
  // greeting-reply card (previously two overlapping hardcoded topic lists).
  const renderQuickActionButtons = () => (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        {featureCards.map((card) => {
          const cmd = quickByTag(card.tag);
          return (
            <button
              key={card.tag}
              type="button"
              onClick={() => runPrompt(cmd)}
              className="group text-left p-3 rounded-2xl bg-surface border border-line hover:border-brand hover:shadow-sm transition-all cursor-pointer touch-manipulation active:scale-[0.98]"
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.tint}`}>
                {card.icon}
              </span>
              <span className="block text-xs font-bold text-content group-hover:text-brand-text mt-2 leading-tight truncate">
                {localLang === 'ta' ? cmd.textTa : cmd.textEn}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-text" />
          {t('Popular Queries', 'அடிக்கடி கேட்கப்படுபவை')}
        </span>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => {
            const cmd = quickByTag(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => runPrompt(cmd)}
                className="px-3 py-1.5 rounded-full bg-surface-2 hover:bg-brand-tint border border-line hover:border-brand-line text-[11px] font-medium text-content transition-colors cursor-pointer touch-manipulation active:scale-[0.98]"
              >
                {localLang === 'ta' ? cmd.textTa : cmd.textEn}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  const renderWelcomePanel = () => (
    <div className="space-y-4 pt-1">
      {/* Welcome hero */}
      <div className="text-center px-2">
        <h3 className="text-base sm:text-lg font-bold text-content tracking-tight">
          {t('How can I help you today?', 'இன்று உங்களுக்கு எவ்வாறு உதவலாம்?')}
        </h3>
        <p className="text-[11px] sm:text-xs text-muted mt-1 leading-relaxed max-w-sm mx-auto">
          {t(
            'Ask about routes, fares, live ferry tracking, refunds, accessibility and more — tap to talk, or hold and release to reply instantly.',
            'வழிகள், கட்டணம், நேரலை படகு கண்காணிப்பு, ரீஃபண்ட் பற்றி — தட்டிப் பேசலாம் அல்லது அழுத்திப் பேசி உடனடிப் பதில் பெறலாம்.'
          )}
        </p>
      </div>

      {renderQuickActionButtons()}
    </div>
  );

  const showWelcome = messages.length <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Ask NEERMETRO Voice Mobility', 'NEERMETRO குரல் வழி வழிகாட்டி')}
        className="bg-surface border-t sm:border border-line w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl relative h-[96dvh] sm:h-auto sm:max-h-[96vh] flex flex-col overflow-hidden shadow-2xl text-content animate-sheet-in"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden shrink-0 bg-surface pt-2.5 pb-1 flex justify-center rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-line" />
        </div>

        {/* Header with Logo alone and Controls */}
        <div className="shrink-0 px-5 pt-2 sm:px-8 sm:pt-6 pb-2">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Logo Alone */}
            <img
              src="/logo/neermetro-3d-mark.png"
              alt="NEERMETRO"
              className="h-10 w-10 object-contain shrink-0 select-none"
              draggable={false}
            />

            {/* Right: Controls (Language, Helpline, Mute, Close) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language toggle EN / தமிழ் */}
              <button
                type="button"
                onClick={() => setLocalLang(localLang === 'en' ? 'ta' : 'en')}
                className="h-8 px-2.5 rounded-lg border border-line bg-surface-2 text-[11px] font-bold text-content hover:border-brand-line transition-colors cursor-pointer touch-manipulation"
                title={t('Switch language', 'மொழியை மாற்று')}
                aria-label={t('Switch language', 'மொழியை மாற்று')}
              >
                {localLang === 'en' ? 'EN' : 'தமிழ்'}
              </button>

              {/* 24/7 Helpline Support Shortcut */}
              {onOpenCustomerCare && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomerCare();
                  }}
                  className="h-8 px-2.5 rounded-lg border border-brand-line bg-brand-tint text-brand-text text-[11px] font-bold flex items-center gap-1 hover:bg-brand-tint-2 transition-colors cursor-pointer touch-manipulation"
                  title="24/7 Customer Care & Helpline"
                  aria-label="24/7 Customer Care"
                >
                  <Headset className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('Helpline', 'உதவி')}</span>
                </button>
              )}

              {/* Speech mute toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setIsMuted(!isMuted);
                }}
                aria-label={isMuted ? t('Enable speech', 'குரலை இயக்கு') : t('Mute speech', 'குரலை முடக்கு')}
                title={isMuted ? t('Enable speech', 'குரலை இயக்கு') : t('Mute speech', 'குரலை முடக்கு')}
                aria-pressed={isMuted}
                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer touch-manipulation ${
                  isMuted
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-surface-2 text-brand-text border-line hover:border-brand-line'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label={t('Close', 'மூடு')}
                className="h-8 w-8 rounded-lg text-muted hover:text-content hover:bg-surface-2 transition-colors cursor-pointer touch-manipulation flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dual Voice Options: VX (Voice eXpress · Instant · Zero Login) vs Puter.js AI */}
          <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-line-2">
            <div className="text-[11px] font-semibold text-muted flex items-center gap-1">
              <span>{localLang === 'ta' ? 'குரல் முறை:' : 'Voice Engine:'}</span>
            </div>
            <div className="inline-flex p-0.5 bg-surface-2 rounded-lg border border-line">
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopListening({ skipAutoProcess: true });
                  setVoiceEngine('vx');
                  setErrorMessage('');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  voiceEngine === 'vx'
                    ? 'bg-surface text-brand-text shadow-xs'
                    : 'text-muted hover:text-content'
                }`}
                title={localLang === 'ta' ? 'VX நேரலை குரல் தேடல் (உள்நுழைவு தேவையில்லை)' : 'VX Instant Voice Search (Zero Login)'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{localLang === 'ta' ? 'VX குரல் (உடனடி)' : 'VX Voice'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isListening) stopListening({ skipAutoProcess: true });
                  setVoiceEngine('puter');
                  setErrorMessage('');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  voiceEngine === 'puter'
                    ? 'bg-surface text-brand-text shadow-xs'
                    : 'text-muted hover:text-content'
                }`}
                title="Puter.js Cloud AI Whisper"
              >
                <Sparkles className="w-3 h-3 text-brand-text" />
                <span>Puter.js AI</span>
                {isPuterAuthed && <span className="text-[9px] text-emerald-600 font-bold">✓</span>}
              </button>
            </div>
          </div>

          {/* Puter.js Sign-In Notice Banner (only shown if user explicitly selected Puter.js and isn't signed in) */}
          {voiceEngine === 'puter' && !isPuterAuthed && (
            <div className="mt-2.5 p-2.5 bg-cyan-50/90 border border-cyan-200 rounded-xl text-xs text-cyan-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
                <span className="text-[11px]">
                  {localLang === 'ta'
                    ? 'Puter.js கிளவுட் AI-க்கு உள்நுழைவு தேவை. உள்நுழையவும் அல்லது VX குரலைப் பயன்படுத்தவும்.'
                    : 'Puter.js AI uses cloud Whisper and asks for login. Sign in once or switch to VX Voice.'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await puterVoiceService.signIn();
                    setIsPuterAuthed(ok);
                  }}
                  className="px-2.5 py-1 bg-brand text-white rounded-lg text-[10px] font-bold hover:bg-brand-strong transition-colors cursor-pointer"
                >
                  {localLang === 'ta' ? 'உள்நுழைக' : 'Sign In to Puter'}
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceEngine('vx')}
                  className="px-2 py-1 bg-surface border border-brand-line text-brand-text rounded-lg text-[10px] font-bold hover:bg-brand-tint transition-colors cursor-pointer"
                >
                  {localLang === 'ta' ? 'VX முறை' : 'Use VX'}
                </button>
              </div>
            </div>
          )}

          {/* Error notification */}
          {errorMessage && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-medium">{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Conversation Log */}
        <div
          ref={chatLogRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-8 py-2 space-y-2.5"
          aria-live="polite"
        >
          {showWelcome && renderWelcomePanel()}
          {(showWelcome ? [] : messages.filter((m) => m.id !== 'greet_0')).map((msg) =>
            msg.role === 'user' ? (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] bg-inverse text-white px-3.5 py-2.5 rounded-2xl rounded-br-md text-[13px] leading-snug">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-surface border border-brand-line shadow-2xs flex items-center justify-center shrink-0 mt-0.5 p-0.5 overflow-hidden">
                  <img
                    src="/logo/neermetro-3d-mark.png"
                    alt="NEERMETRO 3D Avatar"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="max-w-[85%]">
                  <div className="bg-surface-2 border border-line px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] leading-snug text-content">
                    {msg.text}
                  </div>

                  {/* Render rich Journey Card, Transit Cards, Vector Knowledge Card, or Greeting Card */}
                  {msg.command && (
                    (() => {
                      if (msg.command.intent === 'PLAN_JOURNEY') {
                        return renderJourneyCard(msg.command);
                      }
                      if (msg.command.intent === 'GREETING' || msg.command.intent === 'ABOUT') {
                        return renderGreetingCard();
                      }
                      if (msg.command.intent === 'TRACK_FERRY') {
                        return renderTrackerCard(msg.command);
                      }
                      if (msg.command.intent === 'NEXT_FERRY') {
                        return renderNextFerryCard(msg.command);
                      }
                      if (msg.command.intent === 'SHOW_TICKET') {
                        return renderTicketCard();
                      }
                      if (msg.command.intent === 'NEAREST_STATION') {
                        return renderNearestStationCard();
                      }
                      if (msg.command.intent === 'FARE_INQUIRY') {
                        return renderFareCard();
                      }
                      const kDoc = msg.command.knowledgeDocId
                        ? KNOWLEDGE_BASE_DOCS.find((d) => d.id === msg.command!.knowledgeDocId)
                        : (msg.command.intent === 'CUSTOMER_CARE' || msg.command.intent === 'CANCEL_BOOKING' || msg.command.intent === 'KNOWLEDGE_SEARCH')
                        ? queryVectorKnowledgeBase(msg.command.rawQuery, 1)[0]?.document
                        : null;
                      return kDoc ? renderKnowledgeCard(kDoc) : null;
                    })()
                  )}

                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 ml-1">
                    <span className="text-[10px] font-mono text-muted">{msg.time}</span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Live draft bubble while listening or transcribing */}
        {(isListening || isTranscribing) && (
          <div className="shrink-0 px-5 sm:px-8 pb-2 animate-fade-in-up">
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-inverse text-white px-4 py-3 rounded-2xl rounded-br-md text-[13px] leading-snug shadow-xl border border-white/10">
                <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                          isTranscribing ? 'bg-cyan-400' : 'bg-emerald-400'
                        } opacity-75`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          isTranscribing ? 'bg-cyan-500' : 'bg-emerald-500'
                        }`}
                      />
                    </span>
                    <span className="text-[11px] font-mono text-brand-line font-semibold">
                      {isTranscribing
                        ? t('Transcribing speech to text…', 'குரலை உரையாக மாற்றுகிறது…')
                        : isListening
                        ? t('Listening: Speak now…', 'கேட்கிறது: பேசவும்…')
                        : t('Speak now…', 'பேசவும்…')}
                    </span>
                  </div>

                  {/* Equalizer Waveform Bars */}
                  <div className="flex items-center gap-0.5 h-4 px-1.5 py-0.5 rounded-full bg-surface/10">
                    {[0.4, 0.75, 1.0, 0.75, 0.4].map((mult, idx) => {
                      const level = isTranscribing
                        ? 0.6
                        : liveAudioLevel > 0.05
                        ? liveAudioLevel
                        : 0.15;
                      const barH = Math.max(4, Math.round(16 * Math.min(1, level * mult * 1.6)));
                      return (
                        <span
                          key={idx}
                          className="w-1 rounded-full transition-all duration-75"
                          style={{
                            height: `${barH}px`,
                            backgroundColor: isTranscribing
                              ? '#06b6d4'
                              : level > 0.12
                              ? '#10b981'
                              : '#38a3bd',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {transcript ? (
                  <div className="py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        {t('Live Speech', 'நேரலை குரல்')}
                      </span>
                      {isListening && (
                        <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                          {t('• Tap mic to stop & reply', '• நிறுத்த தட்டவும்')}
                        </span>
                      )}
                      {isTranscribing && (
                        <span className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          {t('Replying…', 'பதில் அளிக்கிறது…')}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-bold text-[15px] sm:text-[16px] leading-snug tracking-tight">
                      "{transcript}"
                      {isListening && (
                        <span className="inline-block w-1.5 h-4 ml-1.5 bg-cyan-400 animate-pulse align-middle" />
                      )}
                    </p>
                  </div>
                ) : isTranscribing ? (
                  <p className="text-cyan-200 text-xs italic flex items-center gap-2 py-0.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                    <span>
                      {t('Generating answer…', 'பதில் தயாராகிறது…')}
                    </span>
                  </p>
                ) : isListening ? (
                  <p className="text-emerald-300 font-medium text-xs flex items-center gap-2 py-0.5">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>{t('Listening… speak now, then tap mic to stop & get instant reply!', 'கேட்கிறது… பேசிவிட்டு உடனே பதில் பெற மைக்கை நிறுத்தவும்!')}</span>
                  </p>
                ) : (
                  <p className="text-white/60 text-xs italic">
                    {localLang === 'ta'
                      ? 'எ.கா: "கோயம்பேடு முதல் எழும்பூர் வரை", "அடுத்த படகு", "வாடிக்கையாளர் உதவி"'
                      : 'e.g. "From Koyambedu to Egmore", "Next ferry", "Customer helpline"'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Composer — input + mic toggle (Tap or Hold to talk) + send */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!manualInput.trim()) return;
            const text = manualInput;
            setTranscript(text);
    processCommand(text);
            setManualInput('');
          }}
          className="shrink-0 border-t border-line bg-surface px-4 sm:px-8 pt-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] sm:pb-4"
        >
          <div className="flex items-center gap-2 bg-surface-2 border border-line rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-brand transition-colors">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={
                isListening
                  ? t('Listening to your speech…', 'உங்கள் குரல் கேட்கிறது…')
                  : t('Type query or press mic to talk…', 'கேள்வியை உள்ளிடவும் அல்லது பேசவும்…')
              }
              className="flex-1 min-w-0 bg-transparent border-0 py-1.5 text-[14px] sm:text-[13px] text-content placeholder-muted focus:outline-none"
            />

            {/* Mic Button: Tap to Talk / Tap to Stop */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isTranscribing}
              aria-label={
                isListening || isTranscribing
                  ? t('Stop listening and get reply', 'நிறுத்தி பதில் பெறு')
                  : t('Press to talk', 'பேசத் தொடங்கு')
              }
              title={
                isListening
                  ? t('Listening… tap to stop & reply', 'கேட்கிறது… நிறுத்தி பதில் பெற தட்டவும்')
                  : t('Tap to speak', 'பேச தட்டவும்')
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer touch-manipulation shrink-0 active:scale-95 ${
                isTranscribing
                  ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
                  : isListening
                  ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)] animate-pulse ring-4 ring-rose-200'
                  : 'bg-surface text-brand-text border border-line hover:bg-brand-tint'
              }`}
            >
              {isTranscribing ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Mic className="w-4.5 h-4.5" />}
            </button>

            <button
              type="submit"
              disabled={!manualInput.trim()}
              aria-label={t('Send message', 'செய்தி அனுப்பு')}
              className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center transition-all cursor-pointer touch-manipulation shrink-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-strong"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Quick instructions under composer */}
          <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${voiceEngine === 'vx' ? 'bg-emerald-500' : isPuterAuthed ? 'bg-cyan-500' : 'bg-amber-500'}`} />
              {isListening
                ? (voiceEngine === 'vx'
                    ? (localLang === 'ta' ? 'VX நேரலை கேட்கிறது · முடித்ததும் நிறுத்துங்கள்' : 'VX Listening · Tap to stop & reply')
                    : (localLang === 'ta' ? 'Puter.js AI கேட்கிறது · முடித்ததும் நிறுத்துங்கள்' : 'Puter.js AI Listening · Tap to stop & reply'))
                : (voiceEngine === 'vx'
                    ? (localLang === 'ta' ? 'VX நேரலை குரல் (உள்நுழைவு தேவையில்லை)' : 'VX Voice · Zero Login · Instant')
                    : (localLang === 'ta' ? 'Puter.js AI கிளவுட் முறை' : 'Puter.js Cloud AI Mode'))}
            </span>
            <span className="hidden sm:inline text-muted">
              {t('Press to speak · Tap to stop', 'பேச அழுத்தவும் · நிறுத்த தட்டவும்')}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
