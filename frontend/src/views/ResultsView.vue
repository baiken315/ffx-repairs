<template>
  <div class="results">
    <div class="results__header">
      <div class="container">
        <div class="results__title-row">
          <div>
            <h1 class="results__title">
              {{ store.filteredPrograms.length > 0 ? $t('ui.results_title') : $t('ui.no_results_title') }}
            </h1>
            <p v-if="store.filteredPrograms.length > 0" class="results__subtitle">
              {{ $t('ui.results_subtitle') }}
            </p>
          </div>
          <div class="results__actions">
            <button
              class="btn btn--sm btn--ghost caseworker-toggle"
              @click="store.caseworkerMode = !store.caseworkerMode"
              :aria-pressed="store.caseworkerMode"
            >
              {{ store.caseworkerMode ? $t('ui.caseworker_toggle_off') : $t('ui.caseworker_toggle_on') }}
            </button>
            <button class="btn btn--sm btn--ghost btn--print-hide" @click="print">
              🖨️ {{ $t('ui.print') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container results__body">
      <!-- Count -->
      <p v-if="store.filteredPrograms.length > 0" class="results__count">
        <strong>{{ store.filteredPrograms.length }}</strong>
        program{{ store.filteredPrograms.length !== 1 ? 's' : '' }} found
      </p>

      <!-- Program list -->
      <div v-if="store.filteredPrograms.length > 0" class="results__list">
        <component
          :is="store.caseworkerMode ? ProgramCardCW : ProgramCard"
          v-for="program in store.filteredPrograms"
          :key="program.id"
          :program="program"
        />
      </div>

      <!-- No results -->
      <div v-else class="card results__no-results">
        <h2>{{ $t('ui.no_results_title') }}</h2>
        <p>{{ $t('ui.no_results_body') }}</p>
        <a href="tel:7032220880" class="btn btn--primary">
          📞 {{ $t('ui.no_results_contact') }}
        </a>
      </div>

      <!-- Start over -->
      <div class="results__footer btn--print-hide">
        <RouterLink to="/" class="btn btn--outline" @click="store.resetAnswers()">
          ← {{ $t('ui.start_over') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useEligibilityStore } from '@/stores/eligibility'
import ProgramCard from '@/components/results/ProgramCard.vue'
import ProgramCardCW from '@/components/results/ProgramCardCW.vue'

const store = useEligibilityStore()
const router = useRouter()
const { locale } = useI18n()

function print() { window.print() }

onMounted(async () => {
  if (store.allPrograms.length === 0) {
    await store.loadData(locale.value)
    // No answers → redirect to questionnaire
    if (Object.keys(store.answers).length === 0) {
      router.replace('/questionnaire')
    }
  }
})
</script>

<style scoped>
.results__header {
  background: var(--color-primary);
  color: white;
  padding: var(--sp-6) 0;
}

.results__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-4);
  flex-wrap: wrap;
}

.results__title { color: white; font-size: var(--text-2xl); margin-bottom: var(--sp-1); }
.results__subtitle { color: rgba(255,255,255,0.85); font-size: var(--text-sm); }

.results__actions {
  display: flex;
  gap: var(--sp-2);
  align-items: flex-start;
  flex-wrap: wrap;
}

.results__actions .btn {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.4);
  color: white;
  font-size: var(--text-xs);
}
.results__actions .btn:hover {
  background: rgba(255,255,255,0.25);
  border-color: white;
  color: white;
}

.results__body {
  padding-top: var(--sp-6);
  padding-bottom: var(--sp-12);
}

.results__count {
  margin-bottom: var(--sp-4);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.results__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.results__no-results {
  text-align: center;
  padding: var(--sp-12) var(--sp-6);
}
.results__no-results h2 { margin-bottom: var(--sp-3); }
.results__no-results p { color: var(--color-text-muted); margin-bottom: var(--sp-6); }

.results__footer {
  margin-top: var(--sp-8);
  display: flex;
  justify-content: center;
}
</style>
