<script>
  import { router } from './router.svelte.js';

  let { title, onExit, children } = $props();

  function leave() {
    onExit?.();
    router.go('');
  }
</script>

<header class="mb-2 flex items-center justify-between">
  <button class="btn btn-ghost btn-sm" onclick={leave}>← Jeux</button>
  <span class="font-display font-bold text-base-content/70">{title}</span>
</header>

{@render children()}
