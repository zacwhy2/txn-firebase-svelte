import { mount } from 'svelte'
import App from './FirebaseApp.svelte'

const target = document.getElementById('app');

if (!target) {
  throw new Error("Target element with id 'app' not found");
}

mount(App, { target });
