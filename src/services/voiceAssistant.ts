import { ParsedVoiceCommand } from '../types';
import { STATIONS, INITIAL_ALERTS } from '../data/mockData';
import { planJourneys } from './journeyPlanner';
import { queryVectorKnowledgeBase, KNOWLEDGE_BASE_DOCS } from './knowledgeBase';
import { HELPLINE } from '../constants/support';

// Shared Lost & Found fallback spoken replies (single source for both lost-item branches)
const LOST_FOUND_FALLBACK_EN = `Lost items are safely secured at the destination Station Master office for 30 calendar days. Call toll-free ${HELPLINE} (Option 3) to claim.`;
const LOST_FOUND_FALLBACK_TA = `தவறவிட்ட பொருட்கள் நிலைய அலுவலரிடம் 30 நாட்களுக்கு பாதுகாப்பாக வைக்கப்படும். மீட்க ${HELPLINE} ஐ அழைக்கவும்.`;

// Comprehensive phonetic dictionary of stations mapping common speech transcriptions to station codes
export const PHONETIC_STATION_MAP: Record<string, string[]> = {
  KOY: [
    'koyambedu', 'koyembedu', 'koyamedu', 'koyambadu', 'koyambedu hub',
    'koyam pedu', 'koyan bedu', 'koyan', 'kambedu', 'cmbt', 'cmbt bus stand', 'koyambedu bus stand',
    'koyambedu market', 'koyambedu metro', 'koyambedu station', 'koyambed', 'koyambet', 'koyambakkam',
    'koyam bed', 'koyam', 'call am better', 'call on bed', 'call me do', 'come back to', 'koyem badoo',
    'go on bed', 'go embed', 'comb better', 'call on', 'coy embed', 'coy amber', 'koyambur', 'coimbatore',
    'oyambude', 'oyambedu', 'oyembedu', 'oyambadu', 'koyambude', 'coyambedu', 'coyembedu', 'coyambadu',
    'koyambad', 'koyambudu',
    'கோயம்பேடு', 'கோயம்பேட்டிலிருந்து', 'கோயம்பேடுக்கு', 'கோயம்பேடு வரை'
  ],
  EGM: [
    'egmore', 'egmor', 'egg more', 'eggmor', 'eg more', 'agmore', 'agmor', 'ag more',
    'ekmore', 'ekmor', 'ek more', 'ecmore', 'eight more', 'xmore', 'exmore', 'egmore station',
    'egmore railway', 'elambur', 'elumbur', 'ezhumbur', 'igmore', 'igmor', 'ig more',
    'ignore', 'add more', 'head more', 'eighty more', 'egg', 'aid more', 'egg moore',
    'edmore', 'edgmore', 'egmure', 'egmoor', 'egg moor', 'egmar', 'egg mar', 'egmur', 'egg mur',
    '8 more', 'eighty more', 'egg move', 'egg mode',
    'எழும்பூர்', 'எழும்பூரிலிருந்து', 'எழும்பூருக்கு', 'எழும்பூர் வரை', 'எலும்பூர்', 'எலம்பூர்'
  ],
  CHET: [
    'chetpet', 'chetpat', 'chetput', 'chet pet', 'setpet', 'set pet', 'shadpet',
    'shad pet', 'jetpet', 'jet pet', 'chatpat', 'chat pet', 'chatpet', 'chetpet eco',
    'chetpet station', 'chelpet', 'chel pet', 'chitpet', 'chit pet', 'chet pate', 'chetpattu',
    'check pet', 'check pat', 'shepherd', 'shed pet', 'shed pat', 'shut pet', 'shut pat',
    'சேத்துப்பட்டு', 'சேத்துப்பட்டிலிருந்து', 'சேத்துப்பட்டுக்கு', 'சேத்துப்பட்டு வரை'
  ],
  POON: [
    'poonamallee', 'poonamalle', 'poonamalli', 'poonamally', 'punamalli', 'punamallee',
    'puna mally', 'poona mally', 'poovai', 'poonamalle bypass', 'poonamallee bypass',
    'ponamallee', 'ponamalle', 'poonamalli bus stand', 'poorna mally', 'puna mall', 'phone call', 'poona',
    'பூந்தமல்லி', 'பூந்தமல்லியிலிருந்து', 'பூந்தமல்லிக்கு', 'பூந்தமல்லி வரை'
  ],
  MADU: [
    'maduravoyal', 'maduravayal', 'maduravoyil', 'madura voyal', 'mathuravoyal',
    'madhuravoyal', 'madura', 'maduravoyal bypass', 'mathura voyal', 'madura vayal',
    'maduravoyal junction', 'matter of oil', 'madura oil', 'maduraval', 'matter voyal',
    'மதுரவாயல்', 'மதுரவாயலிலிருந்து', 'மதுரவாயலுக்கு', 'மதுரவாயல் வரை'
  ],
  ARUM: [
    'arumbakkam', 'arumbakam', 'arumbarkam', 'arum bakkam', 'arumpakkam',
    'arumbakkam metro', 'vaishnav', 'arum bakam', 'arum pakkam', 'arumbakkam station',
    'around back', 'a room back', 'arm back', 'around bagan',
    'அரும்பாக்கம்', 'அரும்பாக்கத்திலிருந்து', 'அரும்பாக்கத்திற்கு', 'அரும்பாக்கம் வரை'
  ],
  AMIN: [
    'aminjikarai', 'amaindakarai', 'amainthakarai', 'amenjikarai', 'aminji karai',
    'aminji', 'tollgate', 'amenji karai', 'amainda karai', 'amaintha karai',
    'aminjikkarai', 'aminjikarai market', 'am in the car', 'amenity car', 'amin car', 'ammenji',
    'அமைந்தகரை', 'அமைந்தகரையிலிருந்து', 'அமைந்தகரைக்கு', 'அமைந்தகரை வரை'
  ],
  CHIN: [
    'chintadripet', 'chinthadripet', 'chinda tripet', 'chintadri pet', 'chinda',
    'ritchie street', 'chintadripettai', 'chinthadripettai', 'chintha dripet',
    'chintadripet station', 'chintadripet mrts', 'center pet', 'china pet', 'chin that', 'center the pet',
    'சிந்தாதிரிப்பேட்டை', 'சிந்தாதிரிப்பேட்டையிலிருந்து', 'சிந்தாதிரிப்பேட்டைக்கு', 'சிந்தாதிரிப்பேட்டை வரை'
  ],
  SENN: [
    'senneerkuppam', 'sennirkuppam', 'saneerkuppam', 'saneer kuppam',
    'senneer kuppam', 'chenneerkuppam', 'chennirkuppam', 'chenneer kuppam',
    'sennir kuppam', 'senirkuppam', 'chenneer kuppam quay', 'sennir', 'senior cup', 'sameer kuppam',
    'செந்நீர்க்குப்பம்', 'செந்நீர்க்குப்பத்திலிருந்து', 'செந்நீர்க்குப்பத்திற்கு', 'செந்நீர்க்குப்பம் வரை'
  ],
  ISLD: [
    'island grounds', 'island', 'marina', 'marina beach', 'ice land', 'island ground',
    'ice land grounds', 'theevu thidal', 'theevuthidal', 'napier', 'napier bridge', 'beach',
    'secretariat', 'fort st george', 'island grounds terminal', 'island marina', 'i land',
    'தீவுத்திடல்', 'தீவுத்திடலுக்கு', 'மெரினா', 'தீவுத்திடல் வரை'
  ],
};

// Levenshtein distance for fuzzy speech matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Compute similarity score between 0.0 and 1.0
function stringSimilarity(s1: string, s2: string): number {
  const str1 = s1.trim().toLowerCase();
  const str2 = s2.trim().toLowerCase();
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  const dist = levenshteinDistance(longer, shorter);
  return (longer.length - dist) / longer.length;
}

// Fuzzy Station Resolver: Finds the best matching station from spoken text
export function findStationByFuzzyMatch(phrase: string): { code: string; confidence: number; matchedAlias: string } | null {
  const text = phrase.toLowerCase().replace(/[^\w\s\u0B80-\u0BFF]/g, ' ').trim();
  let bestMatch: { code: string; confidence: number; matchedAlias: string } | null = null;

  // 1. Direct Substring Check (Fastest and highly reliable)
  for (const [code, aliases] of Object.entries(PHONETIC_STATION_MAP)) {
    for (const alias of aliases) {
      if (text.includes(alias)) {
        return { code, confidence: 0.98, matchedAlias: alias };
      }
    }
  }

  // 2. Sliding window n-gram fuzzy matching (handles 1-word, 2-word, 3-word spoken tokens)
  const words = text.split(/\s+/).filter((w) => w.length >= 2);
  const candidateNgrams: string[] = [];

  for (let i = 0; i < words.length; i++) {
    candidateNgrams.push(words[i]);
    if (i + 1 < words.length) {
      candidateNgrams.push(`${words[i]} ${words[i + 1]}`);
    }
    if (i + 2 < words.length) {
      candidateNgrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  for (const candidate of candidateNgrams) {
    for (const [code, aliases] of Object.entries(PHONETIC_STATION_MAP)) {
      for (const alias of aliases) {
        const sim = stringSimilarity(candidate, alias);
        if (sim >= 0.65) {
          if (!bestMatch || sim > bestMatch.confidence) {
            bestMatch = { code, confidence: sim, matchedAlias: alias };
          }
        }
      }
    }
  }

  return bestMatch;
}

// Audio chime for immediate feedback
export function playChime(type: 'start' | 'success' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio context not allowed or blocked
  }
}

/**
 * Prepare text for natural speech synthesis:
 * - Pronounces "NEERMETRO" naturally as "Neer Metro" (or "நீர்மெட்ரோ" in Tamil) instead of spelling it N-E-E-R-M-E-T-R-O.
 * - Strips emojis so TTS doesn't speak "waving hand sign", "water wave", etc.
 * - Expands currency signs (₹35 -> 35 rupees) and measurement units (km -> kilometers, min -> minutes).
 * - Spaces out acronyms like CMBT, UPI, QR, IRS so they are spoken cleanly.
 */
export function prepareTextForSpeech(text: string, lang: 'en' | 'ta' = 'en'): string {
  if (!text) return '';

  let spoken = text;

  // 1. Strip emojis to prevent robotic description reads ("waving hand sign", etc.)
  spoken = spoken.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

  if (lang === 'ta') {
    // Tamil pronunciation conversions
    spoken = spoken
      .replace(/\(\s*NEERMETRO\s*\)/gi, '')
      .replace(/\bNEERMETRO\b/gi, 'நீர்மெட்ரோ')
      .replace(/\bneermetro\b/gi, 'நீர்மெட்ரோ')
      .replace(/₹\s*(\d+)/g, '$1 ரூபாய்')
      .replace(/\b(\d+)\s*km\b/gi, '$1 கிலோமீட்டர்')
      .replace(/\bkm\b/gi, 'கிலோமீட்டர்')
      .replace(/\b(\d+)\s*min(?:s|utes)?\b/gi, '$1 நிமிடங்கள்')
      .replace(/\bmin\b/gi, 'நிமிடங்கள்')
      .replace(/\bCMBT\b/g, 'சி எம் பி டி')
      .replace(/\bUPI\b/g, 'யு பி ஐ')
      .replace(/\bQR\b/g, 'க்யூ ஆர்')
      .replace(/\bC1\b/g, 'தடம் சி 1')
      .replace(/\bC2\b/g, 'தடம் சி 2')
      .replace(/\bC3\b/g, 'தடம் சி 3');
  } else {
    // English pronunciation conversions
    // Crucial: Converts all-caps 'NEERMETRO' into 'Neer Metro' so TTS pronounces it smoothly as words instead of spelling letter-by-letter N-E-E-R-M-E-T-R-O
    spoken = spoken
      .replace(/\bNEERMETRO\b/g, 'Neer Metro')
      .replace(/\bNEER\s+METRO\b/g, 'Neer Metro')
      .replace(/\bNeermetro\b/g, 'Neer Metro')
      .replace(/\bneermetro\b/g, 'Neer Metro')
      .replace(/₹\s*(\d+)/g, '$1 rupees')
      .replace(/\b(\d+)\s*km\b/gi, '$1 kilometers')
      .replace(/\bkm\b/gi, 'kilometers')
      .replace(/\b(\d+)\s*min(?:s|utes)?\b/gi, '$1 minutes')
      .replace(/\bmin\b/gi, 'minutes')
      .replace(/\bapprox\.?\b/gi, 'approximately')
      .replace(/\bCMBT\b/g, 'C M B T')
      .replace(/\bIRS\b/g, 'I R S')
      .replace(/\bOCC\b/g, 'O C C')
      .replace(/\bUPI\b/g, 'U P I')
      .replace(/\bQR\b/g, 'Q R')
      .replace(/\bNCMC\b/g, 'N C M C')
      .replace(/\bLine\s*C1\b/gi, 'Line C 1')
      .replace(/\bLine\s*C2\b/gi, 'Line C 2')
      .replace(/\bLine\s*C3\b/gi, 'Line C 3')
      .replace(/\bF-102\b/g, 'F 102')
      .replace(/\bF-101\b/g, 'F 101');
  }

  // Normalize multi-spaces
  return spoken.replace(/\s{2,}/g, ' ').trim();
}

// Speak helper using Web SpeechSynthesis API with browser fix and natural phonetics
export function speakText(text: string, lang: 'en' | 'ta' = 'en'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      setTimeout(() => {
        const spokenContent = prepareTextForSpeech(text, lang);
        const utterance = new SpeechSynthesisUtterance(spokenContent);
        utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const targetVoice = voices.find(v =>
            lang === 'ta'
              ? v.lang.includes('ta')
              : v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en')
          );
          if (targetVoice) {
            utterance.voice = targetVoice;
          }
        }

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis error:', e);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      }, 60);
    } catch (err) {
      console.warn('speakText error:', err);
      resolve();
    }
  });
}

// Normalize spoken query (handling punctuation, spoken digits, and phonetics)
export function normalizeSpokenQuery(query: string): string {
  let q = query.toLowerCase().replace(/[?,.!]/g, ' ').trim();
  // Map spoken digit words into numeric form
  q = q
    .replace(/\bzero\b/g, '0')
    .replace(/\bone\b/g, '1')
    .replace(/\btwo\b/g, '2')
    .replace(/\bthree\b/g, '3')
    .replace(/\bfour\b/g, '4')
    .replace(/\bfive\b/g, '5')
    .replace(/\bsix\b/g, '6')
    .replace(/\bseven\b/g, '7')
    .replace(/\beight\b/g, '8')
    .replace(/\bnine\b/g, '9');

  // Collapse spaces between adjacent digits e.g. "1 0 2" -> "102"
  q = q.replace(/(\d)\s+(\d)/g, '$1$2').replace(/(\d)\s+(\d)/g, '$1$2');

  // Common ASR speech-to-text phonetic corrections
  q = q
    .replace(/\b(?:near|neer|meer)\s*(?:metro|metre)\b/gi, 'neermetro')
    .replace(/\b(?:fairy|fary)\b/gi, 'ferry')
    .replace(/\b(?:fairies)\b/gi, 'ferries')
    .replace(/\bso\s+(my\s+)?(ticket|pass)\b/gi, 'show $1$2')
    .replace(/\b(?:cure|queue\s*are)\s*code\b/gi, 'qr code');

  // Station name phonetic normalizations for common speech-to-text corruptions:
  // 1. Koyambedu (handles soft/dropped 'k', 'oyambude', 'coimbatore', 'koyambadu')
  q = q
    .replace(/\b(?:o|k|c)yamb[a-z]*\b/gi, 'koyambedu')
    .replace(/\bcoimbatore\b/gi, 'koyambedu')
    .replace(/\b(?:koyamedu|koyembedu|koyambadu|koyambude|koyambudu)\b/gi, 'koyambedu');

  // 2. Egmore (handles 'eg more', 'egg more', 'agmore', 'eight more', 'ignore')
  q = q
    .replace(/\b(?:eg|egg|ag|ek|ig|ed|edg)\s*(?:more|mor|moor|mure|mar|mur)\b/gi, 'egmore')
    .replace(/\b(?:eight|8|x|ex)\s*more\b/gi, 'egmore')
    .replace(/\bto\s+(?:ignore|egg|eg)\b/gi, 'to egmore');

  // 3. Chetpet (handles 'chet pet', 'setpet', 'shadpet', 'check pet')
  q = q.replace(/\b(?:chet|chat|set|shad|jet|chel|chit|check|shed|shut)\s*(?:pet|pat|put|pate|pattu)\b/gi, 'chetpet');

  // 4. Poonamallee (handles 'punamalli', 'poona mally', 'poonamalle')
  q = q.replace(/\b(?:poona?|puna?|pona?)\s*(?:mallee|malle|malli|mally|mall)\b/gi, 'poonamallee');

  // 5. Maduravoyal (handles 'madura voyal', 'mathuravoyal', 'matter of oil')
  q = q.replace(/\b(?:madura|mathura|madhura|matter)\s*(?:voyal|vayal|voyil|val|oil|of\s*oil)\b/gi, 'maduravoyal');

  // 6. Arumbakkam (handles 'arum bakkam', 'around back', 'a room back')
  q = q.replace(/\b(?:arum|around|arm)\s*(?:bakkam|bakam|pakkam|back|bagan)\b/gi, 'arumbakkam');

  // 7. Aminjikarai (handles 'aminji karai', 'amenji karai', 'am in the car')
  q = q
    .replace(/\b(?:aminji|amainda|amaintha|amenji|amenity)\s*(?:karai|kkarai|car)\b/gi, 'aminjikarai')
    .replace(/\bam\s+in\s+the\s+car\b/gi, 'aminjikarai');

  // 8. Chintadripet (handles 'chinda tripet', 'center pet', 'china pet')
  q = q.replace(/\b(?:chinta(?:dri)?|chintha(?:dri)?|center|china)\s*(?:the\s*)?(?:pet|tripet|pettai)\b/gi, 'chintadripet');

  // 9. Senneerkuppam (handles 'senneer kuppam', 'sennir kuppam', 'senior cup')
  q = q.replace(/\b(?:senneer|sennir|saneer|chenneer|chennir|senir|sameer|senior)\s*(?:kuppam|cup)\b/gi, 'senneerkuppam');

  // 10. Island Grounds / Marina (handles 'ice land grounds', 'theevu thidal', 'marina beach')
  q = q
    .replace(/\b(?:island|ice\s*land|i\s*land)\s*(?:grounds?|marina)?\b/gi, 'island grounds')
    .replace(/\b(?:theevu\s*thidal|theevuthidal)\b/gi, 'island grounds');

  return q.replace(/\s{2,}/g, ' ').trim();
}

// Comprehensive Origin & Destination Station Extractor from natural speech
export function extractOriginAndDestination(query: string): { origin: string; destination: string; confidence: number } {
  const q = normalizeSpokenQuery(query);
  const found: Array<{ code: string; alias: string; index: number; length: number }> = [];

  for (const [code, aliases] of Object.entries(PHONETIC_STATION_MAP)) {
    for (const alias of aliases) {
      let idx = q.indexOf(alias);
      while (idx !== -1) {
        found.push({ code, alias, index: idx, length: alias.length });
        idx = q.indexOf(alias, idx + 1);
      }
    }
  }

  // Filter overlapping matches, prefer longer alias (e.g. 'island grounds' over 'island')
  found.sort((a, b) => b.length - a.length);
  const filtered: Array<{ code: string; alias: string; index: number; length: number }> = [];
  for (const f of found) {
    const overlaps = filtered.some(
      (existing) =>
        (f.index >= existing.index && f.index < existing.index + existing.length) ||
        (f.index + f.length > existing.index && f.index + f.length <= existing.index + existing.length)
    );
    if (!overlaps) filtered.push(f);
  }

  // Sort by appearance in sentence
  filtered.sort((a, b) => a.index - b.index);

  // Group into distinct station occurrences in appearance order (deduplicate multiple mentions of the same station)
  const distinctStations: Array<{ code: string; alias: string; index: number; length: number }> = [];
  for (const f of filtered) {
    if (!distinctStations.some((d) => d.code === f.code)) {
      distinctStations.push(f);
    }
  }

  // CASE 1: Two or more DISTINCT stations found directly in text
  if (distinctStations.length >= 2) {
    const first = distinctStations[0];
    const second = distinctStations[distinctStations.length - 1];
    const beforeFirst = q.substring(0, first.index);
    const between = q.substring(first.index + first.length, second.index);

    let origin = first.code;
    let destination = second.code;

    // If "from" appears between, or "to" appears before the first:
    // e.g. "reach Egmore from Chetpet" or "to Egmore from Chetpet"
    if (/\bfrom\b/i.test(between) || (/\bto\b/i.test(beforeFirst) && /\bfrom\b/i.test(between))) {
      origin = second.code;
      destination = first.code;
    }

    if (origin === destination) {
      destination = origin === 'KOY' ? 'EGM' : 'KOY';
    }

    return { origin, destination, confidence: 0.98 };
  }

  // CASE 2: Exactly 1 distinct station directly found — search the rest of the sentence for the other station
  if (distinctStations.length === 1) {
    const known = distinctStations[0];
    const beforeText = q.substring(0, known.index);
    const afterText = q.substring(known.index + known.length);

    // Check if known station is the origin
    const isKnownOrigin =
      /\b(?:from|start\s+from|starting\s+at|out\s+of)\b/i.test(beforeText) ||
      /\b(?:to|and\s+to|towards)\b/i.test(afterText);

    // Check if known station is the destination
    const isKnownDest =
      /\b(?:to|reach|reaching|towards|destined\s+for)\b/i.test(beforeText) &&
      !/\bfrom\b/i.test(beforeText);

    let origin = '';
    let destination = '';

    if (isKnownDest && !isKnownOrigin) {
      destination = known.code;
      const remainder = (beforeText + ' ' + afterText).replace(/\b(?:to|reach|towards)\b/gi, ' ');
      const matchOther = findStationByFuzzyMatch(remainder);
      if (matchOther && matchOther.code !== destination) {
        origin = matchOther.code;
      } else {
        origin = destination === 'KOY' ? 'EGM' : 'KOY';
      }
    } else {
      origin = known.code;
      const remainder = afterText.replace(/\b(?:to|and\s+to|towards|reach|until|till)\b/gi, ' ');
      const matchOther = findStationByFuzzyMatch(remainder);
      if (matchOther && matchOther.code !== origin) {
        destination = matchOther.code;
      } else {
        destination = origin === 'EGM' ? 'KOY' : 'EGM';
      }
    }

    if (origin === destination) {
      destination = origin === 'KOY' ? 'EGM' : 'KOY';
    }

    return { origin, destination, confidence: 0.92 };
  }

  // CASE 3: 0 exact substring matches — try Regex pattern matching with fuzzy resolution
  const patterns = [
    /(?:from|start\s+from|starting\s+from)\s+(.+?)\s+(?:and\s+to|to|towards|until|till|2)\s+(.+)/i,
    /(?:between)\s+(.+?)\s+(?:and|to)\s+(.+)/i,
    /(?:to|reach)\s+(.+?)\s+(?:from)\s+(.+)/i,
    /(?:plan\s+journey\s+)?(.+?)\s+(?:and\s+to|to|towards|2)\s+(.+)/i,
  ];

  for (const pat of patterns) {
    const match = q.match(pat);
    if (match) {
      const part1 = match[1].replace(/\b(?:from|plan|journey|how\s+do\s+i\s+get|take\s+me)\b/gi, '').trim();
      const part2 = match[2].trim();

      const isReverse = pat.source.includes('(?:to|reach)\\s+(.+?)\\s+(?:from)');

      const match1 = findStationByFuzzyMatch(part1);
      const match2 = findStationByFuzzyMatch(part2);

      if (match1 && match2) {
        let origin = match1.code;
        let destination = match2.code;
        if (isReverse) {
          origin = match2.code;
          destination = match1.code;
        }
        if (origin === destination) {
          destination = origin === 'KOY' ? 'EGM' : 'KOY';
        }
        return { origin, destination, confidence: 0.91 };
      } else if (match1 && !match2) {
        const origin = match1.code;
        const destination = origin === 'KOY' ? 'EGM' : 'KOY';
        return { origin, destination, confidence: 0.88 };
      } else if (!match1 && match2) {
        const destination = match2.code;
        const origin = destination === 'EGM' ? 'KOY' : 'EGM';
        return { origin, destination, confidence: 0.88 };
      }
    }
  }

  // NO STATIONS MATCHED AT ALL
  return { origin: '', destination: '', confidence: 0.0 };
}

// Advanced NLU Intent & Slot Extraction Engine
export function parseVoiceIntent(query: string): ParsedVoiceCommand {
  const q = normalizeSpokenQuery(query);

  // 0. Greeting & Conversational Starter & Command Inquiries
  const isGreetingQuery =
    /^(hi|hello|hey|hey there|hiya|vanakkam|namaste|good morning|good afternoon|good evening|howdy|sup|hello there|hi there)\b/i.test(q) ||
    /^(help|menu|options|start|guide|features|commands|command|command list|manual test|test commands|test|what can you do|what do you do|help me|what is this)\b/i.test(q) ||
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q === 'vanakkam' ||
    q === 'வணக்கம்' ||
    q === 'ஹலோ' ||
    q === 'ஹாய்' ||
    q === 'உதவி' ||
    q.includes('commands') ||
    q.includes('manual test') ||
    q.includes('command list') ||
    q.includes('what can you do') ||
    q.includes('what can i ask') ||
    q.includes('what to say');

  // Specific operational overrides (don't treat "hi, cancel ticket" as just a greeting)
  const hasSpecificAction =
    q.includes('cancel') ||
    q.includes('refund') ||
    q.includes('track') ||
    q.includes('ferry') ||
    q.includes('boat') ||
    q.includes('care') ||
    q.includes('helpline') ||
    q.includes('support') ||
    q.includes('complaint') ||
    q.includes('station') ||
    q.includes('terminal') ||
    q.includes('from') ||
    q.includes('to') ||
    q.includes('fare') ||
    q.includes('cost') ||
    q.includes('price') ||
    q.includes('ticket') ||
    q.includes('qr') ||
    q.includes('pass') ||
    q.includes('luggage') ||
    q.includes('baggage') ||
    q.includes('wheelchair') ||
    q.includes('lost') ||
    q.includes('alert') ||
    Object.values(PHONETIC_STATION_MAP).some((aliases) => aliases.some((a) => q.includes(a)));

  if (isGreetingQuery && !hasSpecificAction) {
    return {
      intent: 'GREETING',
      rawQuery: query,
      confidence: 0.99,
      spokenReplyEn:
        "Hello! 👋 Welcome to NEERMETRO. You can ask for river routes like 'From Koyambedu to Egmore', 'Next ferry', 'Track ferry F-102', 'Show ticket', 'Fare inquiry', 'Student concession', 'Ticket refund', 'Customer care', or 'Operating hours'. How can I assist you today?",
      spokenReplyTa:
        "வணக்கம்! 👋 கூமெட்ரோ சென்னை வாட்டர் மெட்ரோ உதவி மையத்திற்கு வரவேற்கிறோம். 'கோயம்பேடு முதல் எழும்பூர் வரை', 'அடுத்த படகு', 'படகை கண்காணி', 'டிக்கெட் காட்டு', 'கட்டண விபரம்', அல்லது 'வாடிக்கையாளர் சேவை' என்று நீங்கள் கேட்கலாம். இன்று உங்களுக்கு என்ன தகவல் வேண்டும்?",
    };
  }

  // Thanks / Appreciation
  const isThanksQuery =
    /\b(thank you|thanks|thx|thank u|many thanks|thanks a lot|nandri)\b/i.test(q) ||
    q.includes('நன்றி');

  if (isThanksQuery && !hasSpecificAction) {
    return {
      intent: 'THANKS',
      rawQuery: query,
      confidence: 0.98,
      spokenReplyEn:
        "You're very welcome! Wishing you a safe, smooth, and green river journey on the Chennai Water Metro. Let me know if you need any other assistance.",
      spokenReplyTa:
        "மிக்க மகிழ்ச்சி! கூமெட்ரோவில் உங்கள் நீர்வழிப் பயணம் இனிமையாகவும் பாதுகாப்பாகவும் அமைய வாழ்த்துகள். வேறு ஏதேனும் உதவி தேவைப்பட்டால் கேளுங்கள்.",
    };
  }

  // About NEERMETRO
  const isAboutQuery =
    q.includes('what is neermetro') ||
    q.includes('about neermetro') ||
    q.includes('what is water metro') ||
    q.includes('about water metro') ||
    q.includes('tell me about') ||
    q.includes('chennai water metro project') ||
    q.includes('who are you') ||
    q.includes('about project') ||
    q.includes('வாட்டர் மெட்ரோ என்றால் என்ன') ||
    q.includes('நீர்மெட்ரோ பற்றி');

  if (isAboutQuery && !hasSpecificAction) {
    return {
      intent: 'ABOUT',
      rawQuery: query,
      confidence: 0.97,
      spokenReplyEn:
        "NEERMETRO is Chennai's eco-friendly electric river transit system operating along the Cooum fairway across 10 modern quays from Senneerkuppam & Poonamallee to Island Grounds Marina. It features zero-emission vessels, universal accessibility, and fast decongested travel.",
      spokenReplyTa:
        "கூமெட்ரோ என்பது கூவம் ஆற்றின் வழியே செந்நீர்க்குப்பம் முதல் தீவுத்திடல் வரை 10 நவீன நிலையங்களுடன் இயங்கும் சென்னையின் புதிய மின்சார படகு போக்குவரத்து அமைப்பாகும். இது பூஜ்ஜிய உமிழ்வு மற்றும் அதிவேக பயணத்தை வழங்குகிறது.",
    };
  }

  // 1. Next Ferry / அடுத்த படகு
  if (
    q.includes('next ferry') ||
    q.includes('next boat') ||
    q.includes('adutha boat') ||
    q.includes('adutha ferry') ||
    q.includes('அடுத்த படகு') ||
    q.includes('when is the next') ||
    q.includes('when is next') ||
    q.includes('next departure') ||
    q.includes('boat timing') ||
    q.includes('ferry timing') ||
    q.includes('ferry time') ||
    q.includes('next trip')
  ) {
    const match = findStationByFuzzyMatch(q);
    const dest = match ? match.code : 'EGM';
    const stn = STATIONS.find((s) => s.code === dest);
    return {
      intent: 'NEXT_FERRY',
      destination: dest,
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: `The next ferry to ${stn?.nameEn || 'Egmore'} departs in 4 minutes from Pontoon Gate 2.`,
      spokenReplyTa: `${stn?.nameTa || 'எழும்பூர்'}-க்கான அடுத்த படகு 4 நிமிடங்களில் முனையம் 2லிருந்து புறப்படும்.`,
    };
  }

  // 2. Track Ferry / படகை கண்காணி
  if (
    q.includes('track') ||
    q.includes('where is') ||
    q.includes('enga irukku') ||
    q.includes('எங்கே இருக்கிறது') ||
    q.includes('boat location') ||
    q.includes('ferry location') ||
    q.includes('boat status') ||
    q.includes('ferry status') ||
    q.includes('live radar') ||
    q.includes('gps location') ||
    q.includes('vessel location') ||
    /\b(f-?\s*10[1-6])\b/i.test(q)
  ) {
    const match = q.match(/(?:f-?|ferry\s*|boat\s*)(\d{3})/i) || q.match(/(\d{3})/);
    const ferryId = match ? `F-${match[1]}` : 'F-102';
    return {
      intent: 'TRACK_FERRY',
      ferryId,
      rawQuery: query,
      confidence: 0.95,
      spokenReplyEn: `Tracking ferry ${ferryId}. It is currently cruising at 18 km/h between Chetpet and Egmore with an ETA of 4 minutes.`,
      spokenReplyTa: `படகு ${ferryId} கண்காணிக்கப்படுகிறது. தற்போது சேத்துப்பட்டு மற்றும் எழும்பூர் இடையே 18 கிமீ வேகத்தில் செல்கிறது.`,
    };
  }

  // 3. Show Ticket / QR Code / Boarding Pass
  const isAskingToViewTicket =
    (
      q.includes('ticket') ||
      q.includes('pass') ||
      q.includes('passes') ||
      q.includes('qr') ||
      q.includes('boarding pass') ||
      q.includes('திக்கெட்') ||
      q.includes('டிக்கெட்') ||
      q.includes('பாஸ்')
    ) &&
    (
      q.includes('show') ||
      q.includes('view') ||
      q.includes('open') ||
      q.includes('my') ||
      q.includes('enoda') ||
      q.includes('display') ||
      q.includes('qr') ||
      q.includes('turnstile') ||
      q.includes('active') ||
      q.includes('காட்டு') ||
      q.includes('பார்க்க') ||
      q === 'ticket' ||
      q === 'my ticket' ||
      q === 'show ticket' ||
      q === 'qr' ||
      q === 'qr code' ||
      q === 'boarding pass' ||
      q === 'pass'
    ) &&
    !q.includes('cancel') &&
    !q.includes('refund') &&
    !q.includes('fare') &&
    !q.includes('price') &&
    !q.includes('cost') &&
    !q.includes('from') &&
    !q.includes('to');

  if (isAskingToViewTicket) {
    return {
      intent: 'SHOW_TICKET',
      rawQuery: query,
      confidence: 0.97,
      spokenReplyEn: 'Here is your active digital boarding pass and turnstile QR code for Koyambedu to Egmore.',
      spokenReplyTa: 'இதோ உங்கள் செயலில் உள்ள டிஜிட்டல் டிக்கெட் மற்றும் QR குறியீடு.',
    };
  }

  // 4. Customer Care & Management Escalation
  const isCustomerCare =
    q.includes('customer care') ||
    q.includes('care number') ||
    q.includes('helpline') ||
    q.includes('help desk') ||
    q.includes('support number') ||
    q.includes('support phone') ||
    q.includes('call care') ||
    q.includes('call support') ||
    q.includes('reach management') ||
    q.includes('contact management') ||
    q.includes('management') ||
    q.includes('complaint') ||
    q.includes('grievance') ||
    q.includes('toll free') ||
    q.includes('toll-free') ||
    q.includes('enquiry') ||
    q.includes('enquer') ||
    q.includes('enquire') ||
    q.includes('phone number') ||
    q.includes('whatsapp support') ||
    q.includes('whatsapp') ||
    q.includes('station master') ||
    q.includes('வாடிக்கையாளர் சேவை') ||
    q.includes('உதவி எண்') ||
    q.includes('நிர்வாக தொடர்பு') ||
    q.includes('புகார்');

  if (isCustomerCare) {
    return {
      intent: 'CUSTOMER_CARE',
      rawQuery: query,
      confidence: 0.98,
      spokenReplyEn: `Opening 24/7 Customer Care & Helpline. Toll-Free: ${HELPLINE}. WhatsApp agent desk is active.`,
      spokenReplyTa: `24/7 வாடிக்கையாளர் சேவை மையம் திறக்கப்படுகிறது. கட்டணமில்லா எண்: ${HELPLINE}.`,
    };
  }

  // 5. Cancellation & 100% Refund Guarantee
  const isCancellationOrRefund =
    q.includes('cancel ticket') ||
    q.includes('cancel booking') ||
    q.includes('cancel pass') ||
    q.includes('how to cancel') ||
    q.includes('cancellation') ||
    q.includes('cancel') ||
    q.includes('refund') ||
    q.includes('money back') ||
    q.includes('return money') ||
    q.includes('refund status') ||
    q.includes('track refund') ||
    q.includes('claim refund') ||
    q.includes('how long for refund') ||
    q.includes('refund policy') ||
    q.includes('ரத்து') ||
    q.includes('ரீபண்ட்') ||
    q.includes('பணம் திரும்புதல்') ||
    q.includes('சீட்டு ரத்து');

  if (isCancellationOrRefund) {
    return {
      intent: 'CANCEL_BOOKING',
      rawQuery: query,
      confidence: 0.98,
      spokenReplyEn: 'NEERMETRO guarantees a 100% full refund when cancelled 20 minutes before departure. Refunds are credited via UPI within 15 to 30 minutes with zero hidden deductions.',
      spokenReplyTa: 'புறப்படுவதற்கு 20 நிமிடங்களுக்கு முன் ரத்து செய்தால் 100% முழுப் பணமும் 15 முதல் 30 நிமிடங்களில் கணக்கில் சேரும்.',
    };
  }

  // 6. Nearest Station / Terminal
  if (
    q.includes('nearest station') ||
    q.includes('nearest terminal') ||
    q.includes('nearest stop') ||
    q.includes('closest station') ||
    q.includes('closest terminal') ||
    q.includes('pakkathula') ||
    q.includes('பக்கத்தில்') ||
    q.includes('station near me') ||
    q.includes('terminal near me') ||
    q.includes('where is the station') ||
    q.includes('where is station')
  ) {
    return {
      intent: 'NEAREST_STATION',
      stationName: 'Koyambedu Central Hub',
      rawQuery: query,
      confidence: 0.94,
      spokenReplyEn: 'Your nearest terminal is Koyambedu Central Hub, located 250 meters away with direct metro and CMBT connectivity.',
      spokenReplyTa: 'உங்களுக்கு அருகிலுள்ள முனையம் கோயம்பேடு மையம். 250 மீட்டர் தொலைவில் மெட்ரோ இணைப்புடன் உள்ளது.',
    };
  }

  // 7. Service Alerts & Weather Advisories
  if (
    q.includes('service alert') ||
    q.includes('service alerts') ||
    q.includes('delay') ||
    q.includes('delays') ||
    q.includes('disruption') ||
    q.includes('weather alert') ||
    q.includes('weather') ||
    q.includes('service suspended') ||
    q.includes('high tide') ||
    q.includes('flood') ||
    q.includes('storm') ||
    q.includes('தாமதம்') ||
    q.includes('எச்சரிக்கை') ||
    q.includes('வானிலை') ||
    q.includes('is there any problem') ||
    q.includes('service status')
  ) {
    const activeAlerts = INITIAL_ALERTS.filter((a) => a.active);
    return {
      intent: 'SERVICE_ALERTS',
      rawQuery: query,
      confidence: 0.94,
      spokenReplyEn:
        activeAlerts.length === 0
          ? 'All corridors are clear — there are no active service alerts right now.'
          : `There ${activeAlerts.length === 1 ? 'is 1 active service alert' : `are ${activeAlerts.length} active service alerts`}: ${activeAlerts
              .map((a) => `${a.titleEn}. ${a.descriptionEn}`)
              .join(' ')}`,
      spokenReplyTa:
        activeAlerts.length === 0
          ? 'தற்போது எந்த சேவை அறிவிப்பும் இல்லை — அனைத்துப் பாதைகளும் இயல்பாக இயங்குகின்றன.'
          : `நடப்பு சேவை அறிவிப்புகள் ${activeAlerts.length}: ${activeAlerts
              .map((a) => `${a.titleTa}. ${a.descriptionTa}`)
              .join(' ')}`,
    };
  }

  // 8. Dynamic Journey Planning & Route Corridor Resolver (High Priority)
  // Resolves point-to-point journeys e.g. "From Koyambedu to Egmore", "Chetpet to Island Grounds", etc.
  const hasStationAlias = Object.values(PHONETIC_STATION_MAP).some((aliases) => aliases.some((a) => q.includes(a)));
  const isExplicitRouteQuery =
    hasStationAlias ||
    (q.includes('from') && (q.includes('to') || q.includes('and to') || q.includes('towards') || q.includes('reach'))) ||
    q.includes('plan journey') ||
    q.includes('how do i get') ||
    q.includes('how to get') ||
    q.includes('how to go') ||
    q.includes('take me to') ||
    q.includes('go to') ||
    q.includes('travel to') ||
    q.includes('book ticket') ||
    q.includes('போவது எப்படி') ||
    q.includes('செல்ல வழி');

  if (isExplicitRouteQuery) {
    const extracted = extractOriginAndDestination(q);
    let origin = extracted.origin;
    let destination = extracted.destination;

    if (origin && destination) {
      if (origin === destination) {
        destination = origin === 'KOY' ? 'EGM' : 'KOY';
      }
      const oStn = STATIONS.find((s) => s.code === origin) || STATIONS[3];
      const dStn = STATIONS.find((s) => s.code === destination) || STATIONS[7];

      // Derive deterministic route and time using planJourneys
      const plans = planJourneys(origin, destination);
      const bestPlan = plans[0];
      const duration = bestPlan ? bestPlan.totalDurationMin : 24;
      const fare = bestPlan ? bestPlan.totalFareInr : 35;
      const routeCode = bestPlan?.legs.find((l) => l.mode === 'WATER_METRO')?.routeCode || 'C1';

      let spokenEn = `Planning fastest river journey from ${oStn.nameEn} to ${dStn.nameEn}. The ${routeCode} line takes ${duration} minutes for ₹${fare}.`;
      let spokenTa = `${oStn.nameTa}-லிருந்து ${dStn.nameTa}-க்கு பயணத் திட்டம் தயாராக உள்ளது. ${routeCode} தடத்தில் ${duration} நிமிடங்களில் ₹${fare}-க்கு செல்லலாம்.`;

      if (q.includes('how much') || q.includes('fare') || q.includes('cost') || q.includes('price') || q.includes('கட்டணம்')) {
        spokenEn = `The fare from ${oStn.nameEn} to ${dStn.nameEn} is ₹${fare} on Line ${routeCode} taking ${duration} minutes. Journey plan is ready.`;
        spokenTa = `${oStn.nameTa}-லிருந்து ${dStn.nameTa}-க்கு கட்டணம் ₹${fare}. பயண நேரம் ${duration} நிமிடங்கள்.`;
      } else if (q.includes('how long') || q.includes('duration') || q.includes('time') || q.includes('நேரம்')) {
        spokenEn = `Travel time from ${oStn.nameEn} to ${dStn.nameEn} is approximately ${duration} minutes on Line ${routeCode}.`;
        spokenTa = `${oStn.nameTa}-லிருந்து ${dStn.nameTa}-க்கு பயண நேரம் சுமார் ${duration} நிமிடங்கள்.`;
      }

      return {
        intent: 'PLAN_JOURNEY',
        origin,
        destination,
        rawQuery: query,
        confidence: extracted.confidence,
        spokenReplyEn: spokenEn,
        spokenReplyTa: spokenTa,
      };
    } else if (
      q.includes('plan journey') ||
      q.includes('how do i get') ||
      q.includes('how to get') ||
      q.includes('how to go') ||
      q.includes('book ticket') ||
      q.includes('போவது எப்படி') ||
      q.includes('செல்ல வழி')
    ) {
      origin = 'KOY';
      destination = 'EGM';
      return {
        intent: 'PLAN_JOURNEY',
        origin,
        destination,
        rawQuery: query,
        confidence: 0.85,
        spokenReplyEn: 'Planning fastest river journey from Koyambedu Central Hub to Egmore Station Quay.',
        spokenReplyTa: 'கோயம்பேடு மையம் முதல் எழும்பூர் படித்துறை வரை பயணத் திட்டம் தயாராக உள்ளது.',
      };
    }
  }

  // 9. Stations & Terminals Directory (Explicit Check)
  if (
    q.includes('all stations') ||
    q.includes('list stations') ||
    q.includes('stations list') ||
    q.includes('list all 10 stations') ||
    q.includes('all 10 stations') ||
    q.includes('10 stations') ||
    q.includes('terminals directory') ||
    q.includes('terminals list') ||
    q.includes('where can i board') ||
    q.includes('all terminals') ||
    q.includes('முனையங்கள்') ||
    q.includes('10 நிலையங்கள்') ||
    q === 'stations' ||
    q === 'terminals'
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_stations_terminals_directory');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_stations_terminals_directory',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || 'NEERMETRO operates across 10 modern waterfront terminals from Poonamallee to Island Grounds Marina with direct CMBT and Metro connectivity.',
      spokenReplyTa: doc?.summaryTa || 'கூமெட்ரோ பூந்தமல்லி முதல் தீவுத்திடல் வரை 10 நவீன மிதவை முனையங்களுடன் மெட்ரோ மற்றும் பேருந்து இணைப்பு வசதிகளுடன் இயங்குகிறது.',
    };
  }

  // 10. Lost & Found Protocol (Checked before generic baggage)
  if (
    q.includes('lost') ||
    q.includes('found') ||
    q.includes('lost my bag') ||
    q.includes('lost bag') ||
    q.includes('lost item') ||
    q.includes('forgot phone') ||
    q.includes('left bag') ||
    q.includes('missing') ||
    q.includes('stolen') ||
    q.includes('lost property') ||
    q.includes('locker') ||
    q.includes('பொருளை தவறவிட்டேன்') ||
    q.includes('தொலைந்துவிட்டது') ||
    q.includes('மீட்பு')
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_lost_and_found');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_lost_and_found',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || LOST_FOUND_FALLBACK_EN,
      spokenReplyTa: doc?.summaryTa || LOST_FOUND_FALLBACK_TA,
    };
  }

  // 11. Baggage, Cycles & Pet Policies (Use word boundary to avoid matching station names like Chetpet / Chintadripet)
  if (
    q.includes('baggage') ||
    q.includes('luggage') ||
    /\b(bag|bags|suitcase)\b/i.test(q) ||
    q.includes('bicycle') ||
    /\b(cycle|folding cycle|folding bicycle|bike)\b/i.test(q) ||
    /\b(pet|pets|dog|dogs|cat|cats)\b/i.test(q) ||
    q.includes('weight limit') ||
    q.includes('carry on') ||
    q.includes('பொருட்கள்') ||
    q.includes('சைக்கிள்') ||
    q.includes('மிதிவண்டி') ||
    q.includes('செல்லப்பிராணி')
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_baggage_pets_policy');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_baggage_pets_policy',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || 'Up to 15 kg free carry-on baggage is permitted. Folding bicycles are allowed free in dedicated racks.',
      spokenReplyTa: doc?.summaryTa || '15 கிலோ வரை இலவச பொருட்கள் கொண்டு செல்லலாம். மடிக்கக்கூடிய மிதிவண்டிகள் இலவசமாக அனுமதிக்கப்படும்.',
    };
  }

  // 12. Universal Accessibility & Barrier-Free Facilities
  if (
    q.includes('wheelchair') ||
    q.includes('accessible') ||
    q.includes('accessibility') ||
    q.includes('disability') ||
    q.includes('handicapped') ||
    q.includes('blind') ||
    q.includes('elderly') ||
    q.includes('ramp') ||
    q.includes('restroom') ||
    q.includes('toilet') ||
    q.includes('elevator') ||
    q.includes('lift') ||
    q.includes('facilities') ||
    q.includes('மாற்றுத்திறனாளி') ||
    q.includes('சக்கர நாற்காலி') ||
    q.includes('முதியவர்')
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_accessibility_facilities');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_accessibility_facilities',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || 'NEERMETRO is 100% barrier-free with continuous zero-step floating pontoon gangways for wheelchairs and tactile paving for visually impaired riders.',
      spokenReplyTa: doc?.summaryTa || 'சக்கர நாற்காலிகள் எளிதாக ஏற மிதவை பாலங்கள் மற்றும் மாற்றுத்திறனாளிகளுக்கு முழு வசதிகள் செய்யப்பட்டுள்ளன.',
    };
  }

  // 13. Vessel Safety, Life Jackets & Eco Standards
  if (
    q.includes('safety') ||
    q.includes('safe') ||
    q.includes('is it safe') ||
    q.includes('life jacket') ||
    q.includes('life jackets') ||
    q.includes('lifejacket') ||
    q.includes('life raft') ||
    q.includes('drowning') ||
    q.includes('accident') ||
    q.includes('emergency') ||
    q.includes('captain') ||
    q.includes('crew') ||
    q.includes('cctv') ||
    q.includes('electric boat') ||
    q.includes('battery') ||
    q.includes('பாதுகாப்பு') ||
    q.includes('லைஃப் ஜாக்கெட்')
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_vessel_safety_eco');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_vessel_safety_eco',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || 'Every passenger seat features an IRS-certified life jacket beneath it, 4 onboard life rafts for 120 passengers, and 24/7 River OCC live tracking.',
      spokenReplyTa: doc?.summaryTa || 'ஒவ்வொரு இருக்கையின் கீழும் உயிர்காக்கும் உடுப்புகள், அவசரகால மிதவைகள் மற்றும் கட்டுப்பாட்டக நேரலை கண்காணிப்பு உள்ளன.',
    };
  }

  // 12. Lost & Found Protocol (Explicit Check)
  if (
    q.includes('lost') ||
    q.includes('found') ||
    q.includes('lost my bag') ||
    q.includes('lost bag') ||
    q.includes('lost item') ||
    q.includes('forgot phone') ||
    q.includes('left bag') ||
    q.includes('missing') ||
    q.includes('stolen') ||
    q.includes('lost property') ||
    q.includes('locker') ||
    q.includes('பொருளை தவறவிட்டேன்') ||
    q.includes('தொலைந்துவிட்டது') ||
    q.includes('மீட்பு')
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_lost_and_found');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_lost_and_found',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || LOST_FOUND_FALLBACK_EN,
      spokenReplyTa: doc?.summaryTa || LOST_FOUND_FALLBACK_TA,
    };
  }

  // 13. Operating Hours, Frequency & Corridor Timetables (Explicit Check)
  if (
    q.includes('operating hours') ||
    q.includes('operating hour') ||
    q.includes('opening hours') ||
    q.includes('timing') ||
    q.includes('timings') ||
    q.includes('timetable') ||
    q.includes('schedule') ||
    q.includes('how often') ||
    q.includes('frequency') ||
    q.includes('first ferry') ||
    q.includes('last ferry') ||
    q.includes('routes') ||
    q.includes('route map') ||
    q.includes('lines') ||
    q.includes('corridor') ||
    q.includes('c1') ||
    q.includes('c2') ||
    q.includes('c3') ||
    q.includes('தடங்கள்') ||
    q.includes('இயக்க நேரம்') ||
    q.includes('அட்டவணை')
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_routes_timings_frequency');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_routes_timings_frequency',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || 'Water Metro services operate daily from 06:00 AM to 10:30 PM with departures every 8-10 minutes during peak rush hours across Lines C1, C2, and C3.',
      spokenReplyTa: doc?.summaryTa || 'சேவை காலை 06:00 முதல் இரவு 10:30 வரை இயங்குகிறது. நெரிசல் நேரங்களில் 8-10 நிமிடங்களுக்கு ஒரு படகு புறப்படும்.',
    };
  }

  // 14. How to Book Tickets & Digital Turnstile Pass Access (Explicit Check)
  if (
    q.includes('how to book') ||
    q.includes('booking process') ||
    q.includes('how do i book') ||
    q.includes('booking steps') ||
    q.includes('buy pass') ||
    q.includes('டிக்கெட் எடுப்பது எப்படி') ||
    q.includes('முன்பதிவு')
  ) {
    const doc = KNOWLEDGE_BASE_DOCS.find((d) => d.id === 'kb_booking_process_turnstiles');
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: 'kb_booking_process_turnstiles',
      rawQuery: query,
      confidence: 0.96,
      spokenReplyEn: doc?.summaryEn || 'Book river passes in under 30 seconds using UPI or Cards. Simply scan your phone screen QR code directly at Pontoon Gates 01-04 without printing.',
      spokenReplyTa: doc?.summaryTa || '30 வினாடிகளில் UPI அல்லது அட்டை மூலம் டிக்கெட் பெறலாம். கேட்டில் நேரடியாக மொபைல் QR-ஐக் காட்டி ஏறலாம்.',
    };
  }

  // 16. General Fare & Concession Inquiry
  if (
    q.includes('fare') ||
    q.includes('ticket price') ||
    q.includes('ticket cost') ||
    q.includes('vela evvalavu') ||
    q.includes('evlo') ||
    q.includes('கட்டணம்') ||
    q.includes('how much') ||
    q.includes('ticket rate') ||
    q.includes('price') ||
    q.includes('cost') ||
    q.includes('rate') ||
    q.includes('concession') ||
    q.includes('student') ||
    q.includes('senior citizen') ||
    q.includes('discount') ||
    q.includes('child free') ||
    q.includes('child ticket') ||
    q.includes('free ticket') ||
    q.includes('monthly pass') ||
    q.includes('smart card') ||
    q.includes('ncmc') ||
    q.includes('மாணவர் சலுகை') ||
    q.includes('முதியோர் சலுகை') ||
    q.includes('தள்ளுபடி')
  ) {
    return {
      intent: 'FARE_INQUIRY',
      rawQuery: query,
      confidence: 0.95,
      spokenReplyEn: 'NEERMETRO standard fares start at ₹15 for the first 3 km, and ₹3 per additional km (maximum ₹45). Students receive a 50% concession, and senior citizens receive 30% discount. Children under 5 travel free.',
      spokenReplyTa: 'நீர்மெட்ரோ கட்டணம் முதல் 3 கிமீக்கு ₹15, கூடுதல் கிமீக்கு ₹3 (அதிகபட்சம் ₹45). மாணவர்களுக்கு 50% சலுகை மற்றும் மூத்த குடிமக்களுக்கு 30% தள்ளுபடி உண்டு.',
    };
  }

  // 17. General Journey Duration (when no stations are specified)
  if (
    q.includes('how long') ||
    q.includes('duration') ||
    q.includes('evlo neram') ||
    q.includes('எவ்வளவு நேரம்') ||
    q.includes('travel time') ||
    q.includes('time taken')
  ) {
    return {
      intent: 'TRIP_DURATION',
      rawQuery: query,
      confidence: 0.92,
      spokenReplyEn: 'From Koyambedu to Egmore via the direct C1 water line takes approximately 24 minutes, saving 35 minutes compared to road traffic.',
      spokenReplyTa: 'கோயம்பேடு முதல் எழும்பூர் வரை படகில் செல்ல சுமார் 24 நிமிடங்கள் ஆகும். சாலையில் செல்வதை விட 35 நிமிடம் மிச்சம்.',
    };
  }

  // 18. Resilient Vector Knowledge Base Search (threshold applied inside the KB)
  const kbResults = queryVectorKnowledgeBase(query, 1);
  if (kbResults.length > 0) {
    const topDoc = kbResults[0].document;
    return {
      intent: 'KNOWLEDGE_SEARCH',
      knowledgeDocId: topDoc.id,
      rawQuery: query,
      confidence: Math.min(0.96, Math.max(0.85, kbResults[0].score)),
      spokenReplyEn: topDoc.summaryEn,
      spokenReplyTa: topDoc.summaryTa,
    };
  }

  // 19. Fallback for completely unrecognized queries / background noise
  return {
    intent: 'UNKNOWN',
    rawQuery: query,
    confidence: 0.0,
    spokenReplyEn:
      "I didn't quite catch that. You can ask for routes like 'From Koyambedu to Egmore', 'Next ferry', 'Track ferry F-102', 'Ticket refund', or 'Customer care'.",
    spokenReplyTa:
      "மன்னிக்கவும், சரியாகப் புரியவில்லை. 'கோயம்பேடு முதல் எழும்பூர் வரை', 'அடுத்த படகு', அல்லது 'வாடிக்கையாளர் சேவை' என்று கேட்டுப் பாருங்கள்.",
  };
}

export const STATION_CLEAN_NAMES_EN: Record<string, string> = {
  POON: 'Poonamallee',
  SENN: 'Senneerkuppam',
  MADU: 'Maduravoyal',
  KOY: 'Koyambedu',
  ARUM: 'Arumbakkam',
  AMIN: 'Aminjikarai',
  SHEN: 'Shenoy Nagar',
  KILP: 'Kilpauk Garden',
  CHET: 'Chetpet',
  EGM: 'Egmore',
  CHIN: 'Chintadripet',
  ISLD: 'Island Grounds',
};

export const STATION_CLEAN_NAMES_TA: Record<string, string> = {
  POON: 'பூந்தமல்லி',
  SENN: 'செந்நீர்க்குப்பம்',
  MADU: 'மதுரவாயல்',
  KOY: 'கோயம்பேடு',
  ARUM: 'அரும்பாக்கம்',
  AMIN: 'அமைந்தகரை',
  SHEN: 'செனாய் நகர்',
  KILP: 'கீழ்ப்பாக்கம்',
  CHET: 'சேத்துப்பட்டு',
  EGM: 'எழும்பூர்',
  CHIN: 'சிந்தாதிரிப்பேட்டை',
  ISLD: 'தீவுத்திடல்',
};

/**
 * Reconstruct clean, accurate, and properly capitalized user text from speech recognition.
 * Fixes phonetic mishearings, station typos, and speech-to-text noise using parsed intent and slot context.
 */
export function reconstructCleanUserQuery(rawQuery: string, parsed: ParsedVoiceCommand): string {
  const q = rawQuery.trim();
  if (!q) return '';

  const isTamil = /[\u0B80-\u0BFF]/.test(q);
  const lower = q.toLowerCase();

  // 1. Dynamic Journey Planning intent
  if (parsed.intent === 'PLAN_JOURNEY') {
    let oCode = parsed.origin || 'KOY';
    let dCode = parsed.destination || 'EGM';
    if (oCode === dCode) {
      dCode = oCode === 'KOY' ? 'EGM' : 'KOY';
    }
    const oNameEn = STATION_CLEAN_NAMES_EN[oCode] || 'Koyambedu';
    const dNameEn = STATION_CLEAN_NAMES_EN[dCode] || 'Egmore';
    const oNameTa = STATION_CLEAN_NAMES_TA[oCode] || 'கோயம்பேடு';
    const dNameTa = STATION_CLEAN_NAMES_TA[dCode] || 'எழும்பூர்';

    if (isTamil) {
      if (lower.includes('கட்டணம்') || lower.includes('evlo') || lower.includes('rate')) {
        return `${oNameTa} முதல் ${dNameTa} வரை கட்டணம் எவ்வளவு?`;
      }
      if (lower.includes('நேரம்') || lower.includes('evlo neram')) {
        return `${oNameTa} முதல் ${dNameTa} வரை எவ்வளவு நேரம் ஆகும்?`;
      }
      return `${oNameTa} முதல் ${dNameTa} வரை`;
    }

    if (lower.includes('fare') || lower.includes('how much') || lower.includes('cost') || lower.includes('price')) {
      return `Fare from ${oNameEn} to ${dNameEn}`;
    }
    if (lower.includes('how long') || lower.includes('duration') || lower.includes('time')) {
      return `How long from ${oNameEn} to ${dNameEn}?`;
    }
    if (lower.includes('how do i get') || lower.includes('how to get') || lower.includes('how to go') || lower.includes('reach')) {
      return `How do I get from ${oNameEn} to ${dNameEn}?`;
    }
    return `From ${oNameEn} to ${dNameEn}`;
  }

  // 2. Next Ferry intent
  if (parsed.intent === 'NEXT_FERRY') {
    if (isTamil) return 'அடுத்த படகு புறப்பாடு எப்போது?';
    for (const [code, name] of Object.entries(STATION_CLEAN_NAMES_EN)) {
      const aliases = PHONETIC_STATION_MAP[code] || [];
      if (aliases.some((a) => lower.includes(a))) {
        return `When is the next ferry to ${name}?`;
      }
    }
    return 'When is the next ferry departure?';
  }

  // 3. Track Ferry intent
  if (parsed.intent === 'TRACK_FERRY') {
    if (isTamil) return 'படகு நேரலை இருப்பிடம் எங்கே?';
    if (parsed.ferryId) {
      return `Track ferry ${parsed.ferryId}`;
    }
    const match = q.match(/\b(?:101|102|103|104|105|106)\b/);
    if (match) {
      return `Track ferry F-${match[0]}`;
    }
    return 'Where is electric ferry F-102?';
  }

  // 4. Show Ticket / Turnstile Pass intent
  if (parsed.intent === 'SHOW_TICKET') {
    if (isTamil) return 'எனது பயணச்சீட்டைக் காட்டு';
    if (lower.includes('qr') || lower.includes('turnstile')) {
      return 'Display turnstile QR code pass';
    }
    if (lower.includes('pass')) {
      return 'View my transit pass';
    }
    return 'Show my ticket';
  }

  // 5. Customer Care intent
  if (parsed.intent === 'CUSTOMER_CARE') {
    if (isTamil) return '24/7 வாடிக்கையாளர் உதவி மையம்';
    if (lower.includes('whatsapp')) return 'WhatsApp customer support';
    if (lower.includes('grievance') || lower.includes('officer')) return 'Passenger grievance redressal officer';
    return '24/7 Customer care & helpline numbers';
  }

  // 6. Cancel Booking intent
  if (parsed.intent === 'CANCEL_BOOKING') {
    if (isTamil) return 'டிக்கெட் ரத்து மற்றும் கட்டண ரீஃபண்ட் கொள்கை';
    if (lower.includes('refund') || lower.includes('turnaround')) return 'Ticket refund policy & credit turnaround';
    return 'How to cancel ticket booking?';
  }

  // 7. Nearest Station intent
  if (parsed.intent === 'NEAREST_STATION') {
    if (isTamil) return 'அருகிலுள்ள படித்துறை எது?';
    return 'Find nearest water metro station';
  }

  // 8. Fare Inquiry intent
  if (parsed.intent === 'FARE_INQUIRY') {
    if (isTamil) return 'கட்டண விவரங்கள் மற்றும் சலுகைகள்';
    if (lower.includes('student')) return 'Student concession discount';
    if (lower.includes('senior')) return 'Senior citizen concession discount';
    if (lower.includes('child')) return 'Is child ticket free?';
    return 'Water metro fare inquiry & concessions';
  }

  // 9. Service Alerts intent
  if (parsed.intent === 'SERVICE_ALERTS') {
    if (isTamil) return 'சேவை எச்சரிக்கைகள் & வானிலை தகவல்';
    if (lower.includes('weather') || lower.includes('tide')) return 'Weather alert & estuary tidal limits';
    return 'Service alerts & line disruptions';
  }

  // 10. Knowledge Search intent
  if (parsed.intent === 'KNOWLEDGE_SEARCH' && parsed.knowledgeDocId) {
    if (parsed.knowledgeDocId === 'kb_baggage_pets_policy') {
      return isTamil ? 'லக்கேஜ் & மடிக்கக்கூடிய சைக்கிள் விதிகள்' : 'Baggage allowance & folding bicycles policy';
    }
    if (parsed.knowledgeDocId === 'kb_accessibility_facilities') {
      return isTamil ? 'சக்கர நாற்காலி அணுகல் வசதிகள்' : 'Wheelchair access & barrier-free facilities';
    }
    if (parsed.knowledgeDocId === 'kb_vessel_safety_eco') {
      return isTamil ? 'பாதுகாப்பு & உயிர்காக்கும் உடுப்புகள்' : 'Vessel safety, life jackets & IRS certified catamarans';
    }
    if (parsed.knowledgeDocId === 'kb_lost_and_found') {
      return isTamil ? 'தொலைந்த பொருட்கள் பாதுகாப்பு மையம்' : 'Lost & found central property office';
    }
    if (parsed.knowledgeDocId === 'kb_routes_timings_frequency') {
      return isTamil ? 'இயக்க நேரம் & வழித்தடங்கள்' : 'Operating hours, frequency & timetables';
    }
    if (parsed.knowledgeDocId === 'kb_stations_terminals_directory') {
      return isTamil ? 'அனைத்து 10 நிலையங்கள் பட்டியல்' : 'List all 10 water metro stations & quays';
    }
    if (parsed.knowledgeDocId === 'kb_booking_process_turnstiles') {
      return isTamil ? 'டிக்கெட் எடுப்பது எப்படி & QR ஸ்கேன்' : 'How to book tickets & digital turnstile access';
    }
    if (parsed.knowledgeDocId === 'kb_fares_concessions_ncmc') {
      return isTamil ? 'ஸ்மார்ட் கார்டு & NCMC பாஸ் கட்டணம்' : 'Smart cards & NCMC pass fares';
    }
  }

  // 11. About & Greetings
  if (parsed.intent === 'ABOUT') {
    return isTamil ? 'சென்னை நீர்மெட்ரோ என்றால் என்ன?' : 'What is NEERMETRO?';
  }
  if (parsed.intent === 'GREETING') {
    if (lower.includes('command') || lower.includes('test') || lower.includes('help') || lower.includes('what can you do')) {
      return isTamil ? 'நான் என்னென்ன கட்டளைகளைக் கேட்கலாம்?' : 'What commands can I ask?';
    }
    return isTamil ? 'வணக்கம்' : 'Hello';
  }
  if (parsed.intent === 'THANKS') {
    return isTamil ? 'நன்றி' : 'Thank you';
  }

  // 12. General Phonetic Cleaning Fallback
  let cleaned = q
    .replace(/\b(?:near|neer|meer)\s*(?:metro|metre)\b/gi, 'NEERMETRO')
    .replace(/\b(?:fairy|fary|very)\b/gi, 'ferry')
    .replace(/\b(?:fairies)\b/gi, 'ferries')
    .replace(/\bso\s+(?:my\s+)?(?:ticket|pass)\b/gi, 'Show my ticket')
    .replace(/\bcure\s*code\b/gi, 'QR code')
    .replace(/\bkoyam\s*bedu\b|\bkoyamedu\b|\bkoyembedu\b/gi, 'Koyambedu')
    .replace(/\bchet\s*pet\b|\bchetpat\b|\bjet\s*pet\b/gi, 'Chetpet')
    .replace(/\bchintadri\s*pet\b|\bchinthadripet\b/gi, 'Chintadripet')
    .replace(/\bpoona\s*mallee\b|\bpunamallee\b|\bpoona\s*malli\b/gi, 'Poonamallee')
    .replace(/\bmadura\s*voyal\b|\bmaduravayol\b/gi, 'Maduravoyal')
    .replace(/\bisland\s*ground(?:s)?\b|\bice\s*land\s*ground(?:s)?\b/gi, 'Island Grounds')
    .replace(/\bsenn[ei]{1,2}r\s*kuppam\b/gi, 'Senneerkuppam')
    .replace(/\barumbakam\b|\barumbakkam\b/gi, 'Arumbakkam')
    .replace(/\baminji\s*karai\b|\bamainda\s*karai\b/gi, 'Aminjikarai')
    .replace(/\bshenoy\s*nagar\b/gi, 'Shenoy Nagar')
    .replace(/\bkilpauk\b|\bkeelpauk\b/gi, 'Kilpauk Garden')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Capitalize first character
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}
