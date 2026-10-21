<script>
  import Section from './Section.svelte';

  let { names = $bindable() } = $props();

  const summary = $derived(names.map((n, i) => n.trim() || `Équipe ${i + 1}`).join(' vs '));
</script>

<Section title="Équipes" {summary}>
  <div class="flex flex-col gap-2">
    {#each names as _, i}
      <input type="text" class="input input-lg h-12 w-full min-w-0 text-base" placeholder={`Équipe ${i + 1}`} maxlength="20" autocomplete="off" bind:value={names[i]} />
    {/each}
  </div>
</Section>
