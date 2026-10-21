<script>
  import { ALL_THEMES } from './themeUtil.js';
  import Section from './Section.svelte';

  let { themes, value = $bindable(), open = false } = $props();

  const label = (theme) => `${theme.emoji ?? ''} ${theme.name}${theme.adult ? ' 18+' : ''}`.trim();
  const summary = $derived(value === ALL_THEMES ? '🎲 Tous' : label(themes.find((t) => t.id === value) ?? { name: '' }));
</script>

<Section title="Thème" {summary} {open}>
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
        onclick={() => (value = theme.id)}>{label(theme)}</button
      >
    {/each}
  </div>
</Section>
