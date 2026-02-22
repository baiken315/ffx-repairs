import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import axios from 'axios'
import router from './router'
import App from './App.vue'
import en from './locales/en.json'
import es from './locales/es.json'
import './assets/main.css'

// In production, VITE_API_BASE_URL points to the deployed backend (e.g. Railway).
// In dev, it's empty and the Vite proxy handles /api/* → localhost:3001.
if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
}

const savedLocale = localStorage.getItem('locale') ?? 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, es },
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')
