<script>
  /**
   * Bouton qui demande confirmation avant d'agir, pour qu'un appui
   * involontaire ne coupe pas un tour ou une partie.
   */
  let { class: className = '', question, detail = '', confirmLabel = 'Confirmer', onConfirm, children } = $props();

  let open = $state(false);

  function confirm() {
    open = false;
    onConfirm();
  }
</script>

<button class={className} onclick={() => (open = true)}>{@render children()}</button>

{#if open}
  <div class="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="confirm-question">
    <div class="modal-box text-center">
      <h3 id="confirm-question" class="font-display text-2xl font-bold">{question}</h3>
      {#if detail}
        <p class="mt-2 text-base-content/70">{detail}</p>
      {/if}
      <div class="modal-action justify-center gap-3">
        <button class="btn btn-ghost h-12 grow" onclick={() => (open = false)}>Annuler</button>
        <button class="btn btn-primary h-12 grow" onclick={confirm}>{confirmLabel}</button>
      </div>
    </div>
    <button class="modal-backdrop" aria-label="Annuler" onclick={() => (open = false)}></button>
  </div>
{/if}
