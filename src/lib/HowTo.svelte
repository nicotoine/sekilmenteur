<script>
  import Section from './Section.svelte';

  let { children } = $props();
</script>

<Section title="Comment jouer">
  <div class="text-sm text-base-content/80">
    {@render children()}
  </div>
</Section>
