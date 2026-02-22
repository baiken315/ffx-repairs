<template>
  <a href="#main-content" class="skip-link">{{ $t('ui.start_button') }}</a>
  <AppHeader />
  <main id="main-content">
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import AppHeader from '@/components/common/AppHeader.vue'
</script>
