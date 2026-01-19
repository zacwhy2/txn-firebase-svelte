<script lang="ts">
  import { initializeApp } from "firebase/app"
  import {
    onAuthStateChanged,
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    // signInWithRedirect,
    signOut,
    type User,
  } from "firebase/auth"
  import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getFirestore,
    onSnapshot,
    setDoc,
    type Unsubscribe,
  } from "firebase/firestore"
  import { firebaseConfig } from "./lib/firebaseConfig"
  import Txn from "./lib/Txn";
  import TxnErrors from "./lib/TxnErrors"

  const fromOptions = ["cash", "card", "card2"]
  const toOptions = ["breakfast", "lunch", "dinner"]

  const app = initializeApp(firebaseConfig)
  const auth = getAuth()
  const db = getFirestore()

  let currentUser: User | null = null
  let currentDate = new Date().toLocaleDateString('en-CA')
  let currentTxn: Txn | null = null
  let isModalOpen = false
  let unsubscribeOnSnapshot: Unsubscribe | null
  let txns: Txn[] = []

  const errors = new TxnErrors()

  function subscribeToDate(date: string) {
    if (!currentUser) return
    if (unsubscribeOnSnapshot) {
      unsubscribeOnSnapshot()
      unsubscribeOnSnapshot = null
    }
    const colRef = collection(db, "txns", "users", currentUser.uid, "dates", date)
    unsubscribeOnSnapshot = onSnapshot(colRef, snapshot => {
      txns = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Txn[]
    })
  }

  function changeDate(delta: number) {
    const d = new Date(currentDate + "T00:00:00")
    d.setDate(d.getDate() + delta)
    currentDate = d.toLocaleDateString("en-CA")
    if (currentUser) {
      subscribeToDate(currentDate)
    }
  }

  onAuthStateChanged(auth, user => {
    currentUser = user
    if (unsubscribeOnSnapshot) {
      unsubscribeOnSnapshot()
      unsubscribeOnSnapshot = null
    }
    if (currentUser) {
      subscribeToDate(currentDate)
    } else {
      txns = []
    }
  })

  function login() {
    signInWithPopup(auth, new GoogleAuthProvider())

    /*
     * signInWithRedirect is not signing in (need to use signInWithPopup instead)
     * https://www.reddit.com/r/Firebase/comments/1doskev/signinwithredirect_is_not_signing_in_but/
     */
    // signInWithRedirect(auth, new GoogleAuthProvider())
  }

  function logout() {
    signOut(auth)
  }

  function newTxn() {
    currentTxn = new Txn()
    currentTxn.date = new Date().toLocaleDateString('en-CA')
    openModal()
  }

  function editTxn(txn: Txn) {
    currentTxn = txn
    openModal()
  }

  function saveTxn() {
    console.log("currentTxn", currentTxn)

    if (!currentTxn) {
      console.error("saveTxn: currentTxn is null")
      return
    }

    const hasErrors = errors.validate(currentTxn)
    if (hasErrors) {
      return
    }

    if (!currentUser) {
      console.error("saveTxn: no authenticated user")
      return
    }
    const uid = currentUser.uid

    if (!currentTxn.id) { // new txn
      addDoc(collection(db, "txns", "users", uid, "dates", currentTxn.date), {
        date: currentTxn.date,
        amount: currentTxn.amount,
        from: currentTxn.from,
        to: currentTxn.to,
        description: currentTxn.description,
      }).then(docRef => {
        console.log("Document written with ID: ", docRef.id)
      })
    } else { // existing txn
      setDoc(doc(db, "txns", currentTxn.id), {
        date: currentTxn.date,
        amount: currentTxn.amount,
        from: currentTxn.from,
        to: currentTxn.to,
        description: currentTxn.description,
      }).then(() => {
        console.log("edited", currentTxn.id)
      })
    }
    closeModal()
  }

  function deleteTxn() {
    if (!currentTxn || !currentTxn.id) {
      console.error("deleteTxn: no currentTxn or id")
      closeModal()
      return
    }
    deleteDoc(doc(db, "txns", currentTxn.id)).then(() => {
      console.log("deleted", currentTxn.id)
    })
    closeModal()
  }

  function openModal() {
    isModalOpen = true
  }

  function closeModal() {
    errors.reset()
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
        <div>
          <button on:click={() => changeDate(-1)}>&lt;</button>
          {currentDate}
          <button on:click={() => changeDate(1)}>&gt;</button>
        </div>
      </div>
      {#each txns as txn}
        <div class="block">
          <button on:click={() => editTxn(txn)} class="button is-small is-info is-rounded">
            <span class="icon is-small">
              <i class="fas fa-pen"></i>
            </span>
          </button>
          <span class="tag is-warning is-light">${txn.amount}</span>
          <span class="tag is-danger is-light">{txn.from}</span>
          <span class="tag is-info is-light">{txn.to}</span>
          <span class="tag is-primary is-light">{txn.description}</span>
        </div>
      {:else}
        <div class="box">No records</div>
      {/each}
      <div class="block">
        <button on:click={newTxn} class="button is-primary is-rounded">
          <span class="icon is-small">
            <i class="fas fa-plus"></i>
          </span>
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
          {#if errors.from}
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
