<template>
  <div class="progress-wrapper">
    <div class="progress-meta">
      <span class="progress-step">{{ $t('progress.label', { current, total }) }}</span>
    </div>
    <div
      class="progress-bar"
      role="progressbar"
      :aria-valuenow="current"
      :aria-valuemin="1"
      :aria-valuemax="total"
      :aria-label="$t('progress.aria_label', { current, total })"
    >
      <div
        class="progress-bar__fill"
        :style="{ width: `${(current / total) * 100}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ current: number; total: number }>()
</script>

<style scoped>
.progress-wrapper {
  padding: var(--sp-3) var(--sp-4);
  background: var(--color-primary);
}
.progress-meta {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--sp-2);
}
.progress-step {
  font-size: var(--text-xs);
  color: rgba(255,255,255,0.85);
  font-weight: 600;
}
</style>
