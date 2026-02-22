<template>
  <article class="program-card card" :aria-label="program.name">
    <!-- Header -->
    <div class="program-card__header">
      <div class="program-card__title-row">
        <h3 class="program-card__name">{{ program.name }}</h3>
        <span
          class="badge"
          :class="isOpen ? 'badge--success' : 'badge--warning'"
          :aria-label="isOpen ? $t('ui.currently_open') : $t('ui.currently_closed')"
        >
          {{ isOpen ? $t('ui.currently_open') : $t('ui.currently_closed') }}
        </span>
      </div>

      <!-- Need type pills -->
      <div class="program-card__badges" aria-label="Program types">
        <span
          v-for="nt in program.need_types"
          :key="nt.code"
          class="badge badge--primary"
        >
          {{ nt.label }}
        </span>
      </div>
    </div>

    <!-- Short description -->
    <p v-if="program.short_description" class="program-card__desc">
      {{ program.short_description }}
    </p>

    <!-- Primary administrator -->
    <div v-if="primaryAdmin" class="program-card__contact">
      <strong>{{ primaryAdmin.name }}</strong>
      <a v-if="primaryAdmin.phone" :href="`tel:${primaryAdmin.phone}`" class="program-card__phone">
        📞 {{ primaryAdmin.phone }}
      </a>
      <a v-if="primaryAdmin.email" :href="`mailto:${primaryAdmin.email}`" class="program-card__email">
        ✉ {{ primaryAdmin.email }}
      </a>
      <a v-if="primaryAdmin.website" :href="primaryAdmin.website" target="_blank" rel="noopener" class="program-card__website">
        🌐 Website
      </a>
    </div>

    <!-- Income note -->
    <p v-if="program.income_benchmark" class="program-card__income">
      <span class="label">Income limit:</span> {{ program.income_benchmark.label }}
    </p>
    <p v-else class="program-card__income program-card__income--none">
      No income limit
    </p>

    <!-- How to apply (collapsible) -->
    <details v-if="program.how_to_apply" class="program-card__apply">
      <summary class="program-card__apply-summary">
        {{ $t('ui.apply_instructions') }}
      </summary>
      <p class="program-card__apply-body">{{ program.how_to_apply }}</p>
    </details>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Program } from '@/stores/eligibility'

const props = defineProps<{ program: Program }>()

const today = new Date()
const isOpen = computed(() => {
  if (props.program.seasonal_windows.length === 0) return true
  return props.program.seasonal_windows.some(w => {
    const open = new Date(w.open_date + 'T00:00:00')
    const close = new Date(w.close_date + 'T23:59:59')
    return today >= open && today <= close
  })
})

const primaryAdmin = computed(() =>
  props.program.administrators.find(a => a.is_primary) ?? props.program.administrators[0] ?? null
)
</script>

<style scoped>
.program-card {
  transition: box-shadow var(--transition);
}
.program-card:focus-within {
  box-shadow: var(--shadow-md);
}

.program-card__header {
  margin-bottom: var(--sp-3);
}

.program-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
  flex-wrap: wrap;
}

.program-card__name {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1.3;
  flex: 1;
}

.program-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
}

.program-card__desc {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--sp-3);
}

.program-card__contact {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  margin-bottom: var(--sp-3);
  font-size: var(--text-sm);
}

.program-card__phone,
.program-card__email,
.program-card__website {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
}
.program-card__phone:hover,
.program-card__email:hover,
.program-card__website:hover { text-decoration: underline; }

.program-card__income {
  font-size: var(--text-sm);
  margin-bottom: var(--sp-3);
  color: var(--color-text-muted);
}
.program-card__income .label {
  font-weight: 600;
  color: var(--color-text);
}
.program-card__income--none {
  font-style: italic;
}

.program-card__apply summary {
  cursor: pointer;
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-accent);
  padding: var(--sp-2) 0;
  list-style: none;
}
.program-card__apply summary::-webkit-details-marker { display: none; }
.program-card__apply summary::before { content: '▶ '; }
.program-card__apply[open] summary::before { content: '▼ '; }

.program-card__apply-body {
  font-size: var(--text-sm);
  padding: var(--sp-2) 0 0 var(--sp-3);
  color: var(--color-text-muted);
  line-height: 1.7;
  white-space: pre-line;
}
</style>
