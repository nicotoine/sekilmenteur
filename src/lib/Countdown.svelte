<script>
  import { onDestroy } from 'svelte';

  let { from = 3, onDone } = $props();

  let value = $state(from);
  const id = setInterval(() => {
    value -= 1;
    if (value <= 0) {
      clearInterval(id);
      onDone();
    }
  }, 1000);
  onDestroy(() => clearInterval(id));
</script>

<div class="flex flex-1 items-center justify-center" aria-live="assertive">
  <span class="font-display text-[10rem] leading-none font-extrabold text-secondary">{Math.max(value, 1)}</span>
</div>
