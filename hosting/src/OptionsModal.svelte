<script lang="ts">
  export let isModalOpen: boolean
  export let onSave: (type: string, value: string) => void
  export let onClose: () => void

  let optionType: "from" | "to" = "from"
  let optionValue: string = ""

  function saveOption() {
    if (!optionValue.trim()) {
      return
    }
    onSave(optionType, optionValue)
    optionValue = ""
    optionType = "from"
  }

  function closeModal() {
    optionValue = ""
    onClose()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code == "Escape") {
      closeModal()
    }
  }
</script>

<div class="modal" class:is-active={isModalOpen}>
  <button type="button" on:click={closeModal} class="modal-background" aria-label="Close modal" tabindex="0"></button>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Add Option</p>
      <button on:click={closeModal} class="delete" aria-label="close"></button>
    </header>
    <section class="modal-card-body">
      <div class="field">
        <label class="label" for="option-type-select">Type</label>
        <div class="control">
          <div class="select">
            <select id="option-type-select" bind:value={optionType}>
              <option value="from">From</option>
              <option value="to">To</option>
            </select>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label" for="option-value-input">Value</label>
        <div class="control">
          <input
            id="option-value-input"
            bind:value={optionValue}
            placeholder="e.g., Cash, Bank, Wallet"
            class="input"
          />
        </div>
      </div>
    </section>
    <footer class="modal-card-foot">
      <button on:click={saveOption} class="button is-success" disabled={!optionValue.trim()}>
        <span class="icon is-small">
          <i class="fas fa-check"></i>
        </span>
        <span>Add</span>
      </button>
      <button on:click={closeModal} class="button">Cancel</button>
    </footer>
  </div>
</div>

<svelte:window on:keydown={onKeyDown} />
