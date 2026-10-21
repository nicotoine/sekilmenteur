/**
 * Synthèse vocale via l'API Web Speech (Chrome, Safari, WebView Android).
 * Tout est facultatif : sans API ni voix française, rien ne se passe.
 */
const synth = () => (typeof speechSynthesis !== 'undefined' ? speechSynthesis : null);

export const speechAvailable = () => Boolean(synth()) && typeof SpeechSynthesisUtterance !== 'undefined';

export function frenchVoices() {
  const voices = synth()?.getVoices?.() ?? [];
  return voices.filter((v) => (v.lang ?? '').toLowerCase().startsWith('fr'));
}

/** Appelle `callback` dès que la liste des voix change (chargée après coup sur Chrome). */
export function onVoicesChanged(callback) {
  const s = synth();
  if (!s?.addEventListener) return () => {};
  s.addEventListener('voiceschanged', callback);
  return () => s.removeEventListener('voiceschanged', callback);
}

export function speak(text, { voiceURI = '', rate = 1 } = {}) {
  const s = synth();
  if (!speechAvailable() || !text) return false;
  s.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = rate;
  const voices = frenchVoices();
  const voice = voices.find((v) => v.voiceURI === voiceURI) ?? voices[0];
  if (voice) utterance.voice = voice;
  s.speak(utterance);
  return true;
}

export function stopSpeaking() {
  synth()?.cancel?.();
}
