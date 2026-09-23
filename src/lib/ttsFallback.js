// Web Speech API fallback for cards/words with no human recording yet.
// speechSynthesis.getVoices() is standard but browser-inconsistent: the list
// is often empty until the async 'voiceschanged' event fires at least once,
// and some engines never fire it at all - so this polls briefly as well.
// Nothing here is specific to Chrome or any other browser/vendor; every
// property used (lang, localService, voiceschanged) is part of the Web
// Speech API spec.

import { getCharacter } from '../utils/database/characterDB.js';
import { extractToneAccent } from './pinyinDisplay.js';

const VOICE_RESOLVE_TIMEOUT_MS = 1000;
const VOICE_POLL_INTERVAL_MS = 100;
// Slower than the API default (1) so Mandarin tone contours have more room
// to actually be heard - the closest lever the Web Speech API gives us to
// "make tones clearer" (there's no per-syllable tone control; utterance.pitch
// shifts the whole voice uniformly and wouldn't help here).
const SPEECH_RATE = 0.5;
// 3rd tone (the dipping contour) is the one that reads least clearly at
// normal-ish speed - slow it down further than everything else.
const THIRD_TONE_RATE = 0.1;

// Soft, non-required tiebreaker only - many platforms surface a hint like
// this in the voice name, but plenty of legitimate zh voices won't match,
// and that's fine: the code falls back to the first available zh voice.
const FEMALE_NAME_HINT = /female|women|girl|(?:^|[^a-z])(?:ting-?ting|mei-?jia|yao-?yao|xiao-?xiao|jia-?jia)(?:[^a-z]|$)/i;

function pickZhVoice(voices) {
  const zhVoices = (voices || []).filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith('zh'));
  if (!zhVoices.length) return null;

  const cnVoices = zhVoices.filter((voice) => voice.lang.toLowerCase() === 'zh-cn');
  const localePool = cnVoices.length ? cnVoices : zhVoices;

  const localVoices = localePool.filter((voice) => voice.localService);
  const pool = localVoices.length ? localVoices : localePool;

  const nameHinted = pool.find((voice) => FEMALE_NAME_HINT.test(voice.name || ''));
  return nameHinted || pool[0];
}

function resolveVoice() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve(null);
      return;
    }
    const synth = window.speechSynthesis;
    let settled = false;

    const finish = () => {
      if (settled) return;
      const voices = synth.getVoices();
      if (!voices || !voices.length) return;
      settled = true;
      cleanup();
      resolve(pickZhVoice(voices));
    };

    const cleanup = () => {
      synth.removeEventListener?.('voiceschanged', finish);
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
    };

    synth.addEventListener?.('voiceschanged', finish);
    const pollId = window.setInterval(finish, VOICE_POLL_INTERVAL_MS);
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      // Resolve with whatever's available now, even if still empty (-> no
      // zh voice on this browser/OS - callers must stay silent, not error).
      resolve(pickZhVoice(synth.getVoices()));
    }, VOICE_RESOLVE_TIMEOUT_MS);

    finish();
  });
}

// Resolved once per page load and reused - undefined means "not resolved
// yet", null means "resolved, no zh voice available".
let cachedVoicePromise;

function getZhVoice() {
  if (!cachedVoicePromise) {
    cachedVoicePromise = resolveVoice();
  }
  return cachedVoicePromise;
}

// Looks up a character's own tone via the shared character dictionary
// (character-database.json, synchronous/localStorage-backed) - the same
// source lesson text and HSK/Colors glosses already use. Returns null when
// the character isn't in the dictionary or carries no parseable tone; those
// just speak at the normal rate rather than blocking on the lookup.
function getCharTone(char) {
  const entry = getCharacter(char);
  if (!entry?.pinyin) return null;
  const { tone } = extractToneAccent(entry.pinyin);
  return tone || null;
}

// Speaking mixed rates as separate queued utterances (one per syllable)
// leaves an audible, mechanical-sounding seam between them - the Web Speech
// API has no way to vary rate continuously within a single utterance. So
// instead of splitting, the whole word/sentence shares one rate: if it
// contains any 3rd-tone character, the entire thing is spoken at the slow
// rate (no seam, at the cost of also slowing down its other syllables).
function containsThirdTone(value) {
  return Array.from(value).some((char) => /[㐀-鿿]/.test(char) && getCharTone(char) === 3);
}

/**
 * Speak Chinese text (hanzi, not pinyin) via the Web Speech API, using
 * whatever zh voice this browser/OS actually offers. The whole utterance
 * slows down further when it contains a 3rd tone (the tone that reads least
 * clearly otherwise) - one utterance, one rate, no mid-word seam. Fails
 * silently (no sound, no thrown error) if the API or a zh voice isn't
 * available - never lets a TTS problem break the calling UI.
 */
export async function speakHanzi(text) {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) return;
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    return;
  }

  try {
    const voice = await getZhVoice();
    if (!voice) return;

    const utterance = new SpeechSynthesisUtterance(value);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = containsThirdTone(value) ? THIRD_TONE_RATE : SPEECH_RATE;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Silent by design - see module comment.
  }
}
