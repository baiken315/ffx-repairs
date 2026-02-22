<template>
  <button
    class="btn btn--sm language-toggle"
    :aria-label="`Switch to ${nextLocaleName}`"
    @click="toggle"
  >
    {{ $t('ui.language_toggle') }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const nextLocaleName = computed(() => locale.value === 'en' ? 'Spanish' : 'English')

function toggle() {
  locale.value = locale.value === 'en' ? 'es' : 'en'
  localStorage.setItem('locale', locale.value)
  document.documentElement.lang = locale.value
}
</script>

<style scoped>
.language-toggle {
  background: rgba(255,255,255,0.15);
  color: white;
  border-color: rgba(255,255,255,0.4);
  font-size: 0.8125rem;
  padding: 0.4rem 0.875rem;
  min-height: 36px;
}
.language-toggle:hover {
  background: rgba(255,255,255,0.25);
  color: white;
  border-color: white;
}
</style>
