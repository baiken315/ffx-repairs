<template>
  <div class="login-page">
    <div class="container login-page__container">
      <div class="card login-card">
        <h1 class="login-card__title">{{ $t('ui.admin_login_title') }}</h1>
        <p class="login-card__subtitle">Fairfax County Program Management</p>

        <form class="login-form" @submit.prevent="handleLogin" novalidate>
          <div class="form-group">
            <label class="form-label" for="username">{{ $t('ui.admin_username') }}</label>
            <input
              id="username"
              v-model="username"
              type="text"
              class="form-input"
              autocomplete="username"
              required
              :aria-invalid="!!error"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">{{ $t('ui.admin_password') }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-input"
              autocomplete="current-password"
              required
              :aria-invalid="!!error"
            />
          </div>

          <p v-if="error" class="login-error" role="alert">{{ $t('errors.auth_failed') }}</p>

          <button type="submit" class="btn btn--primary btn--full" :disabled="loading">
            <span v-if="loading">Signing in…</span>
            <span v-else>{{ $t('ui.admin_login_button') }}</span>
          </button>
        </form>

        <p class="login-card__back">
          <RouterLink to="/">← Back to public site</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref(false)
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) return
  loading.value = true
  error.value = false

  try {
    const token = btoa(`${username.value}:${password.value}`)
    // Test credentials against a protected endpoint
    await axios.get('/api/v1/admin/lookups', {
      headers: { Authorization: `Basic ${token}` },
    })
    sessionStorage.setItem('admin_token', token)
    router.push('/admin')
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: calc(100dvh - 60px);
  display: flex;
  align-items: center;
  background: var(--color-bg-muted);
}
.login-page__container { max-width: 440px; }
.login-card { padding: var(--sp-8); }
.login-card__title { font-size: var(--text-2xl); margin-bottom: var(--sp-1); }
.login-card__subtitle { color: var(--color-text-muted); font-size: var(--text-sm); margin-bottom: var(--sp-6); }
.login-form { display: flex; flex-direction: column; gap: var(--sp-4); }
.login-error {
  color: var(--color-error);
  font-size: var(--text-sm);
  background: var(--color-error-light);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--radius-md);
}
.login-card__back {
  text-align: center;
  margin-top: var(--sp-4);
  font-size: var(--text-sm);
}
</style>
