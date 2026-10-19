<script>
  import { onDestroy, untrack } from 'svelte';

  let { seconds, onEnd } = $props();

  const total = untrack(() => seconds);
  let endAt = Date.now() + total * 1000;
  let remaining = $state(total);
  let running = $state(true);
  let intervalId;

  function tick() {
    remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    if (remaining === 0) {
      stop();
      onEnd?.();
    }
  }
  function stop() {
    clearInterval(intervalId);
    running = false;
  }
  function toggle() {
    if (running) {
      stop();
    } else if (remaining > 0) {
      endAt = Date.now() + remaining * 1000;
      running = true;
      intervalId = setInterval(tick, 250);
    }
  }

  intervalId = setInterval(tick, 250);
  onDestroy(() => clearInterval(intervalId));

  const label = $derived(`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`);
  const percent = $derived((remaining / total) * 100);
</script>

<div class="flex flex-col items-center gap-4">
  <div
    class="radial-progress font-display text-6xl font-extrabold tabular-nums transition-colors {remaining <= 15 ? 'text-error' : 'text-secondary'}"
    style="--value:{percent}; --size:15rem; --thickness:0.7rem"
    role="timer"
    aria-label="Temps restant {label}"
  >
    {label}
  </div>
  <button class="btn btn-ghost btn-sm" onclick={toggle} disabled={remaining === 0}>
    {running ? 'Pause' : remaining === 0 ? 'Temps écoulé' : 'Reprendre'}
  </button>
</div>
