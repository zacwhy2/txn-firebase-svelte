<script lang="ts">
  import Txn from "./lib/Txn";
  import TxnErrors from "./lib/TxnErrors"

  export let currentTxn: Txn | null
  export let isModalOpen: boolean
  export let errors: TxnErrors
  export let fromOptions: string[]
  export let toOptions: string[]
  export let onSave: () => void
  export let onDelete: () => void
  export let onClose: () => void

  function saveTxn() {
    onSave()
  }

  function deleteTxn() {
    onDelete()
  }

  function closeModal() {
    onClose()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code == "Escape") {
      closeModal()
    }
  }
</script>

{#if currentTxn}
  <div class="modal" class:is-active={isModalOpen}>
    <div on:click={closeModal} class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Txn</p>
        <button on:click={closeModal} class="delete" aria-label="close"></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">Amount</label>
          <div class="field has-addons">
            <div class="control">
              <a class="button is-static">$</a>
            </div>
            <div class="control">
              <input bind:value={currentTxn.amount}
                type="number"
                placeholder="amount"
                class="input"
                class:is-danger={errors.amount}
              />
            </div>
          </div>
          {#if errors.amount}
            <p class="help is-danger">Amount is required</p>
          {/if}
        </div>
        <div class="field">
          <label class="label">From</label>
          <div class="control">
            <div class="select" class:is-danger={errors.from}>
              <select bind:value={currentTxn.from}>
                <option></option>
                {#each fromOptions as fromOption}
                  <option>{fromOption}</option>
                {/each}
              </select>
            </div>
          </div>
          {#if errors.from}
            <p class="help is-danger">From is required</p>
          {/if}
        </div>
        <div class="field">
          <label class="label">To</label>
          <div class="control">
            <div class="select" class:is-danger={errors.to}>
              <select bind:value={currentTxn.to}>
                <option></option>
                {#each toOptions as toOption}
                  <option>{toOption}</option>
                {/each}
              </select>
            </div>
          </div>
          {#if errors.to}
            <p class="help is-danger">To is required</p>
          {/if}
        </div>
        <div class="field">
          <label class="label">Description</label>
          <div class="control">
            <input bind:value={currentTxn.description}
              placeholder="description"
              class="input"
              class:is-danger={errors.description}
            />
          </div>
          {#if errors.description}
            <p class="help is-danger">Description is required</p>
          {/if}
        </div>
        <div class="field">
          <label class="label" for="txn-date">Date</label>
          <div class="control">
            <input id="txn-date" bind:value={currentTxn.date}
              type="date"
              placeholder="Date"
              class="input"
              class:is-danger={errors.date}
            />
          </div>
          {#if errors.date}
            <p class="help is-danger">Date is required</p>
          {/if}
        </div>
      </section>
      <footer class="modal-card-foot">
        <button on:click={saveTxn} class="button is-success">
          <span class="icon is-small">
            <i class="fas fa-check"></i>
          </span>
          <span>Save</span>
        </button>
        <button on:click={closeModal} class="button">Cancel</button>
        {#if currentTxn.id}
          <button on:click={deleteTxn} class="button is-danger is-outlined">
            <span>Delete</span>
            <span class="icon is-small">
              <i class="fas fa-times"></i>
            </span>
          </button>
        {/if}
      </footer>
    </div>
  </div>
{/if}

<svelte:window on:keydown={onKeyDown} />
