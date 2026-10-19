<script>
  import { onDestroy } from 'svelte';

  let { names, back, onDone } = $props();

  const FLIP_DURATION_MS = 450;

  let index = $state(0);
  let shown = $state(false);
  let hiding = $state(false);
  let mounted = true;
  onDestroy(() => (mounted = false));

  const isLast = $derived(index + 1 >= names.length);

  function hideAndNext() {
    if (hiding) return;
    hiding = true;
    shown = false;
    setTimeout(() => {
      if (!mounted) return;
      if (isLast) {
        onDone();
      } else {
        index += 1;
      }
      hiding = false;
    }, FLIP_DURATION_MS);
  }
</script>

<header class="py-4 text-center">
  <p class="text-sm text-base-content/70">Joueur {index + 1} sur {names.length}</p>
  <progress class="progress progress-secondary mx-auto mt-2 w-40" value={index + (shown ? 1 : 0)} max={names.length}></progress>
</header>

<div class="flip mx-auto h-[26rem] w-full max-w-xs" class:is-flipped={shown}>
  <div class="flip-inner h-full w-full">
    <button class="flip-face card-pattern text-white" aria-hidden={shown} tabindex={shown ? -1 : 0} onclick={() => (shown = true)}>
      <span class="text-sm opacity-80">Cette carte est pour</span>
      <span class="font-display my-3 text-4xl font-extrabold break-all">{names[index]}</span>
      <span class="rounded-full bg-black/25 px-4 py-2 text-sm">Touche pour la retourner</span>
    </button>

    <div class="flip-face flip-back-face border-4 border-secondary bg-base-100" aria-hidden={!shown}>
      {@render back(index)}
    </div>
  </div>
</div>

<div class="mx-auto mt-6 max-w-xs">
  <button class="btn btn-primary btn-block h-14 text-lg" disabled={!shown || hiding} onclick={hideAndNext}>
    {isLast ? 'Cacher et lancer le jeu' : 'Cacher et passer le téléphone'}
  </button>
</div>
