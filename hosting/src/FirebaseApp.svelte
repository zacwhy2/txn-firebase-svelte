<script lang="ts">
  import { initializeApp } from "firebase/app"
  import {
    onAuthStateChanged,
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    signOut,
  } from "firebase/auth"
  import { firebaseConfig } from "./lib/firebaseConfig"

  const fromOptions = ["cash", "card"]
  const toOptions = ["breakfast", "lunch", "dinner"]

  const app = initializeApp(firebaseConfig)
  const auth = getAuth()

  let currentUser
  let currentTxn
  let isModalOpen = false

  onAuthStateChanged(auth, user => {
    currentUser = user
  })

  function login() {
    signInWithRedirect(auth, new GoogleAuthProvider())
  }

  function logout() {
    signOut(auth)
  }

  function newTxn() {
    currentTxn = {}
    currentTxn.date = new Date().toLocaleDateString('en-CA')
    openModal()
  }

  function saveTxn() {
    console.log("currentTxn", currentTxn)
  }

  function openModal() {
    isModalOpen = true
  }

  function closeModal() {
    isModalOpen = false
  }

  function onKeyDown(e) {
    if (e.code == "Escape") {
      closeModal()
    }
  }
</script>

{#if currentUser}
  <section class="section">
    <div class="container">
      <div class="block">
        <button on:click={newTxn} class="button is-primary is-rounded">
          <span class="icon is-small">
            <i class="fas fa-plus"></i>
          </span>
          <span>New</span>
        </button>
      </div>
    </div>
  </section>
{/if}

<footer class="footer">
  <div class="content">
    {#if !currentUser}
      <button on:click={login} class="button is-small is-light">Log in</button>
    {:else}
      Logged in as <b>{currentUser.email}</b>
      <button on:click={logout} class="button is-small is-light">Log out</button>
    {/if}
  </div>
</footer>

{#if currentTxn}
  <div class="modal"  class:is-active={isModalOpen}>
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
              <input bind:value={currentTxn.amount} type="number" class="input" placeholder="amount" />
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label">From</label>
          <div class="control">
            <div class="select">
              <select bind:value={currentTxn.from}>
                <option></option>
                {#each fromOptions as fromOption}
                  <option>{fromOption}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label">To</label>
          <div class="control">
            <div class="select">
              <select bind:value={currentTxn.to}>
                <option></option>
                {#each toOptions as toOption}
                  <option>{toOption}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label">Description</label>
          <div class="control">
            <input bind:value={currentTxn.description} class="input" placeholder="description" />
          </div>
        </div>
        <div class="field">
          <label class="label">Date</label>
          <div class="control">
            <input bind:value={currentTxn.date} type="date" class="input" placeholder="Date" />
          </div>
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
