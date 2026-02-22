<template>
  <div class="nav-buttons">
    <button
      v-if="showBack"
      type="button"
      class="btn btn--ghost"
      @click="$emit('back')"
    >
      ← {{ $t('ui.back') }}
    </button>
    <div class="nav-buttons__right">
      <button
        v-if="isSkippable"
        type="button"
        class="btn btn--ghost btn--skip"
        @click="$emit('skip')"
        :title="$t('ui.skip_hint')"
      >
        {{ $t('ui.skip') }}
      </button>
      <button
        type="button"
        class="btn"
        :class="isLast ? 'btn--accent' : 'btn--primary'"
        :disabled="!canAdvance"
        @click="$emit('next')"
      >
        {{ isLast ? $t('ui.submit') : $t('ui.next') }} →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showBack: boolean
  isLast: boolean
  isSkippable: boolean
  canAdvance: boolean
}>()

defineEmits<{
  back: []
  next: []
  skip: []
}>()
</script>

<style scoped>
.nav-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4) 0;
  border-top: 1px solid var(--color-border);
  margin-top: var(--sp-6);
  flex-wrap: wrap;
}

.nav-buttons__right {
  display: flex;
  gap: var(--sp-2);
  align-items: center;
  margin-left: auto;
}

.btn--skip {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (max-width: 480px) {
  .nav-buttons { flex-direction: column-reverse; }
  .nav-buttons__right { width: 100%; flex-direction: column-reverse; }
  .btn { width: 100%; }
}
</style>
