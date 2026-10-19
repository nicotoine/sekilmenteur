<script>
  import { ALL_THEMES } from './themeUtil.js';

  let { themes, value = $bindable() } = $props();
</script>

<section class="mb-6">
  <h2 class="mb-3 text-xl font-bold">Thème</h2>
  <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Thème">
    <button
      class="btn h-11 {value === ALL_THEMES ? 'btn-secondary' : 'btn-outline'}"
      role="radio"
      aria-checked={value === ALL_THEMES}
      onclick={() => (value = ALL_THEMES)}>🎲 Tous</button
    >
    {#each themes as theme}
      <button
        class="btn h-11 {value === theme.id ? 'btn-secondary' : 'btn-outline'}"
        role="radio"
        aria-checked={value === theme.id}
        onclick={() => (value = theme.id)}>{theme.emoji ?? ''} {theme.name}{theme.adult ? ' 18+' : ''}</button
      >
    {/each}
  </div>
</section>
