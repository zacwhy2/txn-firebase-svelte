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
  import TxnModal from "./TxnModal.svelte"
  import OptionsModal from "./OptionsModal.svelte"

  const app = initializeApp(firebaseConfig)
  const auth = getAuth()
  const db = getFirestore()

  let currentUser: User | null = null
  let currentDate = new Date().toLocaleDateString('en-CA')
  let currentTxn: Txn | null = null
  let isModalOpen = false
  let isOptionsModalOpen = false
  let txns: Txn[] = []
  let fromOptions: string[] = []
  let toOptions: string[] = []

  let unsubscribeOnSnapshot: Unsubscribe | null
  let unsubscribeFromOptions: Unsubscribe | null = null
  let unsubscribeToOptions: Unsubscribe | null = null

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

    const fromColRef = collection(db, "txns", "users", currentUser.uid, "options", "from")
    unsubscribeFromOptions = onSnapshot(fromColRef, snapshot => {
      fromOptions = snapshot.docs.map(doc => doc.id)
    })

    const toColRef = collection(db, "txns", "users", currentUser.uid, "options", "to")
    unsubscribeToOptions = onSnapshot(toColRef, snapshot => {
      toOptions = snapshot.docs.map(doc => doc.id)
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

    if (unsubscribeFromOptions) {
      unsubscribeFromOptions()
      unsubscribeFromOptions = null
    }

    if (unsubscribeToOptions) {
      unsubscribeToOptions()
      unsubscribeToOptions = null
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
        // console.log("edited", currentTxn.id)
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
      // console.log("deleted", currentTxn.id)
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

  function openOptionsModal() {
    isOptionsModalOpen = true
  }

  function closeOptionsModal() {
    isOptionsModalOpen = false
  }

  function saveOption(type: string, value: string) {
    if (!currentUser) {
      console.error("saveOption: no authenticated user")
      return
    }
    const uid = currentUser.uid

    const collectionPath = type === "from"
      ? `txns/users/${uid}/options/from`
      : `txns/users/${uid}/options/to`

    setDoc(doc(db, collectionPath, value), {
      name: value
    }).then(() => {
      console.log("Option saved:", value)
      closeOptionsModal()
    }).catch((error) => {
      console.error("Error saving option:", error)
    })
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
          <button on:click={() => editTxn(txn)} class="button is-small is-info is-rounded" aria-label="Edit transaction">
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
        <button on:click={newTxn} class="button is-primary is-rounded" aria-label="Add new transaction">
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
      <button on:click={openOptionsModal} class="button is-small is-info is-rounded" aria-label="Open options">
        <span class="icon is-small">
          <i class="fas fa-cog"></i>
        </span>
      </button>

      Logged in as <b>{currentUser.email}</b>
      <button on:click={logout} class="button is-small is-light">Log out</button>
    {/if}
  </div>
</footer>

<TxnModal
  {currentTxn}
  {isModalOpen}
  {errors}
  {fromOptions}
  {toOptions}
  onSave={saveTxn}
  onDelete={deleteTxn}
  onClose={closeModal}
/>

<OptionsModal
  isModalOpen={isOptionsModalOpen}
  onSave={saveOption}
  onClose={closeOptionsModal}
/>
