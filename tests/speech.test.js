import { afterEach, describe, expect, it, vi } from 'vitest';
import { speechAvailable, frenchVoices, speak, stopSpeaking, onVoicesChanged } from '../src/lib/speech.js';

const voices = [
  { name: 'Anglaise', lang: 'en-US', voiceURI: 'en' },
  { name: 'Amélie', lang: 'fr-FR', voiceURI: 'fr1' },
  { name: 'Thomas', lang: 'fr-CA', voiceURI: 'fr2' },
];

function installSpeech() {
  const synth = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => voices, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  globalThis.speechSynthesis = synth;
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  return synth;
}

afterEach(() => {
  delete globalThis.speechSynthesis;
  delete globalThis.SpeechSynthesisUtterance;
});

describe('synthèse vocale', () => {
  it('est inactive sans API : rien ne casse', () => {
    expect(speechAvailable()).toBe(false);
    expect(frenchVoices()).toEqual([]);
    expect(speak('Bonjour')).toBe(false);
    expect(() => stopSpeaking()).not.toThrow();
    expect(onVoicesChanged(() => {})).toBeTypeOf('function');
  });

  it('ne garde que les voix françaises', () => {
    installSpeech();
    expect(speechAvailable()).toBe(true);
    expect(frenchVoices().map((v) => v.name)).toEqual(['Amélie', 'Thomas']);
  });

  it('parle en français avec la voix choisie, ou la première voix française', () => {
    const synth = installSpeech();
    expect(speak('Le village s\'endort.', { voiceURI: 'fr2' })).toBe(true);
    let utterance = synth.speak.mock.calls[0][0];
    expect(utterance.text).toBe('Le village s\'endort.');
    expect(utterance.lang).toBe('fr-FR');
    expect(utterance.voice.name).toBe('Thomas');
    expect(synth.cancel).toHaveBeenCalledTimes(1);

    speak('Suite', { voiceURI: 'inconnue' });
    utterance = synth.speak.mock.calls[1][0];
    expect(utterance.voice.name).toBe('Amélie');
  });

  it('ignore un texte vide et sait se taire', () => {
    const synth = installSpeech();
    expect(speak('')).toBe(false);
    expect(synth.speak).not.toHaveBeenCalled();
    stopSpeaking();
    expect(synth.cancel).toHaveBeenCalledTimes(1);
  });

  it('écoute l\'arrivée des voix et sait se désabonner', () => {
    const synth = installSpeech();
    const cb = () => {};
    const off = onVoicesChanged(cb);
    expect(synth.addEventListener).toHaveBeenCalledWith('voiceschanged', cb);
    off();
    expect(synth.removeEventListener).toHaveBeenCalledWith('voiceschanged', cb);
  });
});
