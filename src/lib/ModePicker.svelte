<script>
  import Section from './Section.svelte';

  /** Choix du mode de jeu : une liste de { id, name, emoji, description }. */
  let { modes, value = $bindable(), open = false } = $props();

  const current = $derived(modes.find((m) => m.id === value) ?? modes[0]);
</script>

<Section title="Mode" summary="{current.emoji} {current.name}" {open}>
  <div class="flex flex-col gap-2" role="radiogroup" aria-label="Mode de jeu">
    {#each modes as mode}
      <button
        class="flex items-start gap-3 rounded-field border-2 p-3 text-left transition-colors {value === mode.id ? 'border-secondary bg-secondary/10' : 'border-base-300 bg-base-200'}"
        role="radio"
        aria-checked={value === mode.id}
        onclick={() => (value = mode.id)}
      >
        <span class="text-2xl" aria-hidden="true">{mode.emoji}</span>
        <span class="min-w-0">
          <span class="block font-bold">{mode.name}</span>
          <span class="block text-sm text-base-content/70">{mode.description}</span>
        </span>
      </button>
    {/each}
  </div>
</Section>
