<template>
  <header class="app-header" role="banner">
    <RouterLink to="/" class="app-header__brand" :aria-label="$t('ui.app_name')">
      <span class="app-header__title">{{ $t('ui.app_name') }}</span>
      <span class="app-header__subtitle">Not an Official Fairfax County Application</span>
    </RouterLink>
    <nav class="app-header__nav" aria-label="Site navigation">
      <RouterLink to="/services" class="app-header__nav-link">All Programs</RouterLink>
    </nav>
    <LanguageToggle />
  </header>
</template>

<script setup lang="ts">
import LanguageToggle from './LanguageToggle.vue'
</script>
