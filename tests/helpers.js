import { roster } from '../src/lib/roster.svelte.js';

export function setPlayers(count) {
  roster.names = Array.from({ length: count }, (_, i) => `J${i + 1}`);
}
