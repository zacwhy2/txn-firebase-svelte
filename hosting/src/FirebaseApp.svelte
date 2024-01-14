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

  const app = initializeApp(firebaseConfig)
  const auth = getAuth()

  let currentUser

  onAuthStateChanged(auth, user => {
    currentUser = user
  })

  function login() {
    signInWithRedirect(auth, new GoogleAuthProvider())
  }

  function logout() {
    signOut(auth)
  }
</script>


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
