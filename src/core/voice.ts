/**
 * Voice output. Uses Web Speech API (cs-CZ) today; a recording recorded by the parents
 * can replace any phrase by registering it in `recordings` (one audio file per text).
 */
export const recordings: Record<string, string> = {};

let voice: SpeechSynthesisVoice | null = null;
let audio: HTMLAudioElement | null = null;
let token = 0;

function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => v.lang === 'cs-CZ') ?? vs.find((v) => v.lang.toLowerCase().startsWith('cs')) ?? null;
}

if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function stop() {
  token++;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (audio) {
    audio.pause();
    audio = null;
  }
}

/** Speak a phrase; resolves when finished (or after a safety timeout). */
export function say(text: string): Promise<void> {
  stop();
  const my = token;
  if (!text) return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    setTimeout(finish, 1500 + text.length * 85);
    const url = recordings[text];
    if (url) {
      audio = new Audio(url);
      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
      return;
    }
    if (!('speechSynthesis' in window)) return finish();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'cs-CZ';
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1.08;
    u.onend = () => my === token && finish();
    u.onerror = finish;
    speechSynthesis.speak(u);
  });
}

/** Must be called from a user gesture once (iOS Safari unlocks speech this way). */
export function unlockVoice() {
  if (!('speechSynthesis' in window)) return;
  pickVoice();
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}

export const hasCzechVoice = () => voice != null;
