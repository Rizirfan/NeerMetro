/**
 * Puter.js AI Voice Speech-to-Text Service
 * Exclusively uses Puter.js AI (puter.ai.speech2txt) for speech-to-text conversion.
 * Features automated Voice Activity Detection (VAD) that transcribes spoken audio into text automatically.
 */

declare global {
  interface Window {
    puter?: {
      ai?: {
        speech2txt: (
          source: Blob | File | string | { file?: Blob | File | string; language?: string; provider?: string },
          options?: { language?: string; provider?: string; model?: string }
        ) => Promise<string | { text?: string; transcript?: string }>;
      };
      auth?: {
        isSignedIn?: () => boolean;
        signIn?: (opts?: { attempt_temp_user_creation?: boolean }) => Promise<unknown>;
        getUser?: () => Promise<unknown>;
      };
    };
  }
}

export interface PuterVoiceState {
  status: 'idle' | 'recording' | 'transcribing' | 'error';
  audioLevel: number;
  isSpeaking: boolean;
  interimTranscript?: string;
  errorMessage?: string;
}

export interface RecordingOptions {
  language?: 'en' | 'ta' | string;
  onAudioLevel?: (level: number) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSilence?: () => void;
  onInterim?: (text: string) => void;
}

class PuterVoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private interimTimer: ReturnType<typeof setInterval> | null = null;
  private isInterimBusy = false;
  private lastTranscribedChunkCount = 0;
  private latestTranscript = '';
  private hasSpoken = false;
  private isRecording = false;
  private isTranscribing = false;
  private stateListeners: Set<(state: PuterVoiceState) => void> = new Set();

  private currentState: PuterVoiceState = {
    status: 'idle',
    audioLevel: 0,
    isSpeaking: false,
  };

  /**
   * Subscribe to Puter voice service state updates
   */
  public subscribe(listener: (state: PuterVoiceState) => void): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => this.stateListeners.delete(listener);
  }

  private notifyState(partial: Partial<PuterVoiceState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.stateListeners.forEach((l) => l(this.currentState));
  }

  public getState(): PuterVoiceState {
    return this.currentState;
  }

  /**
   * Ensure Puter.js is loaded in the browser
   */
  public async ensurePuterLoaded(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (window.puter?.ai?.speech2txt) {
      return true;
    }

    return new Promise((resolve) => {
      const existing = document.querySelector('script[src*="js.puter.com"]');
      if (existing) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.puter?.ai?.speech2txt) {
            clearInterval(interval);
            resolve(true);
          } else if (attempts > 60) {
            clearInterval(interval);
            resolve(false);
          }
        }, 80);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.puter?.ai?.speech2txt) {
            clearInterval(interval);
            resolve(true);
          } else if (attempts > 30) {
            clearInterval(interval);
            resolve(Boolean(window.puter?.ai?.speech2txt));
          }
        }, 80);
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  /**
   * Check if user is currently signed in to Puter.js
   */
  public isSignedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.puter?.auth?.isSignedIn && window.puter.auth.isSignedIn());
  }

  /**
   * Explicit user-triggered sign-in for Puter.js
   */
  public async signIn(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    await this.ensurePuterLoaded();
    if (!window.puter?.auth?.signIn) return false;
    try {
      await window.puter.auth.signIn({ attempt_temp_user_creation: true });
      return this.isSignedIn();
    } catch {
      return false;
    }
  }

  /**
   * Get current Puter user details if signed in
   */
  public async getUser(): Promise<{ username?: string } | null> {
    if (typeof window === 'undefined') return null;
    try {
      if (this.isSignedIn() && window.puter?.auth?.getUser) {
        const u = await window.puter.auth.getUser();
        return u as { username?: string };
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Select a supported mime type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav',
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c)) return c;
    }
    return '';
  }

  /**
   * Start microphone recording with automated Voice Activity Detection (VAD)
   * When the passenger talks and then stops, it automatically fires onSilence to transcribe.
   */
  public async startRecording(options?: RecordingOptions): Promise<void> {
    if (this.isRecording) return;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.');
    }

    // Pre-warm Puter.js in background without popping up auth modals
    this.ensurePuterLoaded().catch(() => {});

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      this.audioChunks = [];
      this.hasSpoken = false;
      this.latestTranscript = '';
      this.lastTranscribedChunkCount = 0;
      this.isInterimBusy = false;

      // Audio analysis for real-time visualizer & VAD
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtx) {
        const ctx = new AudioCtx();
        this.audioContext = ctx;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.3;
        source.connect(analyser);
        this.analyser = analyser;

        const buffer = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!this.isRecording) return;
          analyser.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i];
          }
          const avg = sum / buffer.length;
          const level = Math.min(1, Math.max(0, avg / 50));

          options?.onAudioLevel?.(level);
          this.notifyState({ audioLevel: level });

          // Voice Activity & Silence Detection (Natural conversational pacing)
          if (level > 0.055) {
            // User is actively speaking
            if (!this.hasSpoken) {
              this.hasSpoken = true;
              options?.onSpeechStart?.();

              // Start live interim transcription loop while user is speaking
              if (!this.interimTimer) {
                this.interimTimer = setInterval(() => {
                  if (!this.isRecording || !this.hasSpoken || this.isInterimBusy) return;
                  // Need at least 3 chunks (300ms) and at least 2 new chunks since last slice
                  if (this.audioChunks.length < 3 || this.audioChunks.length <= this.lastTranscribedChunkCount + 2) {
                    return;
                  }

                  this.isInterimBusy = true;
                  this.lastTranscribedChunkCount = this.audioChunks.length;

                  const mime = this.getSupportedMimeType() || 'audio/webm';
                  const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm';
                  const snapshotChunks = [...this.audioChunks];
                  const snapshotBlob = new Blob(snapshotChunks, { type: mime });
                  const snapshotFile =
                    typeof File !== 'undefined'
                      ? new File([snapshotBlob], `live_${Date.now()}.${ext}`, { type: mime })
                      : snapshotBlob;

                  const langHint = options?.language === 'ta' ? 'ta' : 'en';

                  this.quickTranscribe(snapshotFile, langHint)
                    .then((liveText) => {
                      if (liveText && this.isRecording) {
                        this.latestTranscript = liveText;
                        options?.onInterim?.(liveText);
                        this.notifyState({ interimTranscript: liveText });
                      }
                    })
                    .catch(() => {})
                    .finally(() => {
                      this.isInterimBusy = false;
                    });
                }, 650);
              }
            }
            this.notifyState({ isSpeaking: true });

            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
            }
          } else if (this.hasSpoken && level < 0.045) {
            // User finished speaking and paused: automatically trigger transcription after 850ms quiet
            if (!this.silenceTimer) {
              this.silenceTimer = setTimeout(() => {
                if (this.isRecording && this.hasSpoken) {
                  this.notifyState({ isSpeaking: false });
                  options?.onSpeechEnd?.();
                  options?.onSilence?.();
                }
              }, 850);
            }
          }

          this.animFrameId = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }

      // Max utterance guard: if user speaks continuously for 8s without pause, auto-cut & transcribe
      this.maxDurationTimer = setTimeout(() => {
        if (this.isRecording && this.hasSpoken) {
          this.notifyState({ isSpeaking: false });
          options?.onSpeechEnd?.();
          options?.onSilence?.();
        }
      }, 8000);

      // Initialize MediaRecorder
      const mimeType = this.getSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder = recorder;
      recorder.start(100); // 100ms chunk intervals
      this.isRecording = true;
      this.notifyState({ status: 'recording', isSpeaking: false, errorMessage: undefined });
    } catch (err: unknown) {
      this.cleanup();
      const error = err as Error;
      this.notifyState({ status: 'error', errorMessage: error.message });
      throw error;
    }
  }

  /**
   * Fast incremental preview transcription for live text display while user speaks
   */
  public async quickTranscribe(
    source: Blob | File,
    language?: 'en' | 'ta' | string
  ): Promise<string> {
    if (!window.puter?.ai?.speech2txt || !this.isSignedIn()) return '';

    const langHint = language === 'ta' ? 'ta' : 'en';
    let response: unknown;

    try {
      response = await window.puter.ai.speech2txt(source, {
        language: langHint,
        provider: 'openai',
      });
    } catch {
      try {
        response = await window.puter.ai.speech2txt({
          file: source,
          language: langHint,
          provider: 'openai',
        });
      } catch {
        try {
          response = await window.puter.ai.speech2txt(source);
        } catch {
          return '';
        }
      }
    }

    let text = '';
    if (typeof response === 'string') {
      text = response;
    } else if (response && typeof response === 'object') {
      const obj = response as Record<string, unknown>;
      if (typeof obj.text === 'string') text = obj.text;
      else if (typeof obj.transcript === 'string') text = obj.transcript;
      else if (typeof obj.result === 'string') text = obj.result;
      else if (typeof obj.transcription === 'string') text = obj.transcription;
      else if (obj.message && typeof (obj.message as { content?: string }).content === 'string') {
        text = (obj.message as { content?: string }).content || '';
      }
    }

    return (text || '').trim();
  }

  /**
   * Stop recording, package audio, and automatically transcribe via Puter.js
   */
  public async stopRecordingAndTranscribe(options?: {
    language?: 'en' | 'ta' | string;
  }): Promise<string> {
    if (!this.isRecording && this.audioChunks.length === 0) {
      this.cleanup();
      return '';
    }

    this.isRecording = false;
    this.isTranscribing = true;
    this.notifyState({ status: 'transcribing', isSpeaking: false });

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    // Stop MediaRecorder and collect final chunks
    const recorder = this.mediaRecorder;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Build audio Blob
    const mimeType = this.getSupportedMimeType() || 'audio/webm';
    const audioBlob = new Blob(this.audioChunks, { type: mimeType });
    this.cleanup();

    if (audioBlob.size < 400) {
      // Empty snippet / click noise
      this.isTranscribing = false;
      this.notifyState({ status: 'idle' });
      return '';
    }

    // Ensure Puter.js is ready
    const isReady = await this.ensurePuterLoaded();
    if (!isReady || !window.puter?.ai?.speech2txt) {
      this.isTranscribing = false;
      this.notifyState({ status: 'error', errorMessage: 'Puter.js library is not available.' });
      throw new Error('Puter.js library could not be loaded. Please check your internet connection.');
    }

    // Only check auth status without forcing unexpected popup modals
    const isAuthed = this.isSignedIn();
    if (!isAuthed) {
      // Puter may attempt internal session or prompt only when user consented
    }

    try {
      const langHint = options?.language === 'ta' ? 'ta' : 'en';
      const ext = mimeType.includes('mp4')
        ? 'mp4'
        : mimeType.includes('ogg')
        ? 'ogg'
        : mimeType.includes('wav')
        ? 'wav'
        : 'webm';

      const audioFile =
        typeof File !== 'undefined'
          ? new File([audioBlob], `speech_${Date.now()}.${ext}`, { type: mimeType })
          : audioBlob;

      // Call puter.ai.speech2txt with resilient fallback attempts
      let response: unknown;
      try {
        response = await window.puter.ai.speech2txt(audioFile, {
          language: langHint,
          provider: 'openai',
        });
      } catch {
        try {
          response = await window.puter.ai.speech2txt(audioBlob, {
            language: langHint,
            provider: 'openai',
          });
        } catch {
          try {
            response = await window.puter.ai.speech2txt({
              file: audioFile,
              language: langHint,
              provider: 'openai',
            });
          } catch {
            // Minimal invocation
            response = await window.puter.ai.speech2txt(audioFile);
          }
        }
      }

      this.isTranscribing = false;
      this.notifyState({ status: 'idle' });

      let text = '';
      if (typeof response === 'string') {
        text = response;
      } else if (response && typeof response === 'object') {
        const obj = response as Record<string, unknown>;
        if (typeof obj.text === 'string') {
          text = obj.text;
        } else if (typeof obj.transcript === 'string') {
          text = obj.transcript;
        } else if (typeof obj.result === 'string') {
          text = obj.result;
        } else if (typeof obj.transcription === 'string') {
          text = obj.transcription;
        } else if (obj.message && typeof (obj.message as { content?: string }).content === 'string') {
          text = (obj.message as { content?: string }).content || '';
        }
      }

      const finalText = (text || this.latestTranscript || '').trim();
      return finalText;
    } catch (err: unknown) {
      this.isTranscribing = false;
      const error = err as Error;
      if (this.latestTranscript) {
        return this.latestTranscript.trim();
      }
      this.notifyState({ status: 'error', errorMessage: error.message });
      throw new Error(`Puter.js transcription failed: ${error.message}`);
    }
  }

  /**
   * Cancel ongoing recording or transcription
   */
  public cancel(): void {
    this.cleanup();
    this.notifyState({ status: 'idle', audioLevel: 0, isSpeaking: false });
  }

  private cleanup(): void {
    this.isRecording = false;
    this.hasSpoken = false;

    if (this.interimTimer) {
      clearInterval(this.interimTimer);
      this.interimTimer = null;
    }
    this.isInterimBusy = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      } catch {
        /* ignore */
      }
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {
        /* ignore */
      }
      this.audioContext = null;
    }

    this.analyser = null;
    this.audioChunks = [];
  }
}

export const puterVoiceService = new PuterVoiceService();
