<template>
  <a href="#main-content" class="skip-link">{{ $t('ui.start_button') }}</a>
  <AppHeader />
  <main id="main-content">
    <RouterView />
  </main>
  <footer class="app-footer">
    <span class="app-footer__copy">Fairfax Home &amp; Energy Programs</span>
    <RouterLink to="/about" class="app-footer__link">About &amp; Disclaimer</RouterLink>
  </footer>
</template>

<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
</script>

<style>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  background: var(--color-primary-dark);
  color: rgba(255,255,255,0.5);
  font-size: var(--text-xs);
  border-top: 1px solid rgba(255,255,255,0.08);
}
.app-footer__link {
  color: rgba(255,255,255,0.65);
  text-decoration: none;
  transition: color 0.15s;
}
.app-footer__link:hover { color: white; text-decoration: underline; }
</style>
