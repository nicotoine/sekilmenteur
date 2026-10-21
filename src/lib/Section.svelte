<script>
  /**
   * Bloc de réglages dépliant. Replié, il résume la valeur choisie
   * pour que l'écran de réglages tienne sans défiler.
   */
  let { title, summary = '', open = $bindable(false), children } = $props();
</script>

<details class="collapse-arrow collapse mb-2 bg-base-100" bind:open>
  <summary class="collapse-title flex min-h-14 items-center gap-3 pr-12 font-display text-lg font-bold">
    <span class="shrink-0">{title}</span>
    {#if summary}
      <span class="min-w-0 grow truncate text-right text-sm font-normal text-secondary">{summary}</span>
    {/if}
  </summary>
  <div class="collapse-content">
    {@render children()}
  </div>
</details>
