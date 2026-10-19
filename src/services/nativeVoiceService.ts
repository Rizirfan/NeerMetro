/**
 * VX (Voice eXpress) Native Web Speech Recognition Service
 * High-performance, instant device-native speech recognition for rapid transit routing.
 * Features:
 * - 100% Zero-Login & Zero-Popup: Uses browser native SpeechRecognition / webkitSpeechRecognition.
 * - Conflict-Free Audio: Does NOT lock microphone hardware with getUserMedia, allowing SpeechRecognition to capture audio cleanly.
 * - Real-Time Streaming: Transcribes words as they are spoken.
 * - Bilingual Support: Native Tamil (ta-IN) & Indian English (en-IN).
 * - Automatic Pause/Silence Detection: Automatically detects when speech stops and finalizes query.
 */

// Web Speech API types
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: (() => void) | null;
  onaudioend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type SpeechRecognitionConstructor = new () => IWindowSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface NativeVoiceOptions {
  language: 'en' | 'ta' | string;
  onAudioLevel?: (level: number) => void;
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onSpeechEnd?: () => void;
  onError?: (error: string) => void;
}

class NativeVoiceService {
  private recognition: IWindowSpeechRecognition | null = null;
  private isListening = false;
  private fullTranscript = '';
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private pulseTimer: ReturnType<typeof setInterval> | null = null;
  private hasSpoken = false;

  /**
   * Check if Native Device Speech Recognition is supported in this browser
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Start listening using conflict-free VX native voice recognition
   */
  public startListening(options: NativeVoiceOptions): void {
    if (this.isListening) {
      this.abort();
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      throw new Error(
        'Native Speech Recognition is not supported in this browser. Please use Google Chrome, Edge, or Puter.js AI.'
      );
    }

    this.fullTranscript = '';
    this.hasSpoken = false;
    this.isListening = true;

    const rec = new SpeechRec();
    this.recognition = rec;

    // Continuous listening with real-time interim results
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    // Bilingual locale setting (ta-IN for Tamil, en-IN for Indian English & transit names)
    rec.lang = options.language === 'ta' ? 'ta-IN' : 'en-IN';

    // Start synthetic visual audio level pulses for UI animation while listening
    if (options.onAudioLevel) {
      let phase = 0;
      this.pulseTimer = setInterval(() => {
        if (!this.isListening) return;
        phase += 0.25;
        // Mild ambient pulse when quiet, heightened pulse when actively speaking
        const base = this.hasSpoken ? 0.35 : 0.15;
        const amplitude = this.hasSpoken ? 0.45 : 0.15;
        const lvl = Math.min(1, Math.max(0, base + Math.sin(phase) * amplitude));
        options.onAudioLevel?.(lvl);
      }, 80);
    }

    rec.onspeechstart = () => {
      this.hasSpoken = true;
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalStr = '';
      let interimStr = '';

      // Standard results loop from 0 to results.length
      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';
        if (item.isFinal) {
          finalStr += text + ' ';
        } else {
          interimStr += text;
        }
      }

      const combined = (finalStr + interimStr).replace(/\s{2,}/g, ' ').trim();
      if (combined) {
        this.fullTranscript = combined;
        this.hasSpoken = true;
        options.onInterim?.(combined);

        // Auto-pause / silence detector:
        // After passenger speaks a query, if they pause for 1200ms, auto-stop and process!
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
        }
        this.silenceTimer = setTimeout(() => {
          if (this.isListening && this.fullTranscript.trim()) {
            options.onSpeechEnd?.();
          }
        }, 1200);
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        // Natural quietness, do not throw
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      console.warn('Native Voice notice:', event.error, event.message);
      if (event.error === 'not-allowed') {
        options.onError?.('Microphone permission was denied. Please allow microphone in browser settings.');
      } else if (event.error === 'network') {
        options.onError?.('Speech recognition network error. Please check your internet or use Puter.js AI.');
      } else {
        options.onError?.(`Speech recognition notice: ${event.error}`);
      }
    };

    rec.onend = () => {
      const captured = this.fullTranscript.trim();
      if (this.isListening) {
        // Session ended: report final transcript
        this.cleanup();
        if (captured) {
          options.onFinal?.(captured);
        }
      }
    };

    try {
      rec.start();
    } catch (err: unknown) {
      this.cleanup();
      const e = err as Error;
      throw new Error(`Failed to start speech recognition: ${e.message}`);
    }
  }

  /**
   * Stop listening and return final transcribed text
   */
  public stopListening(): string {
    const text = this.fullTranscript.trim();
    this.cleanup();
    return text;
  }

  /**
   * Abort listening without processing
   */
  public abort(): void {
    this.cleanup();
  }

  private cleanup(): void {
    this.isListening = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.pulseTimer) {
      clearInterval(this.pulseTimer);
      this.pulseTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
  }
}

export const nativeVoiceService = new NativeVoiceService();
