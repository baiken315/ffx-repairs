<template>
  <div class="caseworker-view">
    <div class="cw-view__header">
      <div class="container">
        <div class="cw-view__title-row">
          <div>
            <p class="cw-view__label">{{ $t('ui.caseworker_toggle_on') }}</p>
            <h1 class="cw-view__title">{{ $t('ui.app_name') }}</h1>
          </div>
          <button class="btn btn--sm cw-view__print-btn" @click="print">
            🖨️ {{ $t('ui.print') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Questionnaire if no answers yet -->
    <div v-if="!started && !showResults" class="container cw-view__start">
      <div class="card">
        <h2>Walk through eligibility with a client</h2>
        <p style="color:var(--color-text-muted);margin-bottom:var(--sp-4)">
          This view shows expanded program details for in-person intake. No data is stored.
        </p>
        <button class="btn btn--primary" @click="beginQuestionnaire">
          Begin Eligibility Check →
        </button>
      </div>
    </div>

    <!-- Inline questionnaire for case worker -->
    <div v-else-if="!showResults" class="container cw-view__questionnaire">
      <ProgressBar :current="currentIdx + 1" :total="store.activeQuestions.length" />
      <div class="card" style="margin-top:var(--sp-4)">
        <Transition name="slide" mode="out-in">
          <div :key="currentQuestion?.code">
            <QuestionIncome
              v-if="currentQuestion?.question_type === 'income_input'"
              :question="currentQuestion"
              :modelValue="incomeAnswer"
              @update:modelValue="onIncomeAnswer"
            />
            <QuestionNumeric
              v-else-if="currentQuestion?.question_type === 'numeric_input'"
              :question="currentQuestion"
              :modelValue="(currentAnswer as number | undefined)"
              @update:modelValue="onAnswer"
              @submit="goNext"
            />
            <QuestionMulti
              v-else-if="currentQuestion?.question_type === 'multi_choice'"
              :question="currentQuestion"
              :modelValue="(currentAnswer as string[])"
              @update:modelValue="onAnswer"
            />
            <QuestionSingle
              v-else-if="currentQuestion"
              :question="currentQuestion"
              :modelValue="(currentAnswer as string)"
              @update:modelValue="onAnswer"
            />
          </div>
        </Transition>
        <NavigationButtons
          :show-back="currentIdx > 0"
          :is-last="currentIdx === store.activeQuestions.length - 1"
          :is-skippable="currentQuestion?.is_skippable ?? false"
          :can-advance="canAdvance"
          @back="goBack"
          @next="goNext"
          @skip="onSkip"
        />
      </div>
    </div>

    <!-- Results — always case worker expanded view -->
    <div v-else class="container cw-view__results">
      <div class="cw-results-header">
        <p class="results-count">
          <strong>{{ store.filteredPrograms.length }}</strong>
          program{{ store.filteredPrograms.length !== 1 ? 's' : '' }} matching client profile
        </p>
        <div class="cw-results-actions btn--print-hide">
          <button class="btn btn--sm btn--outline" @click="resetAndRestart">
            ← Start New Client
          </button>
        </div>
      </div>

      <div v-if="store.filteredPrograms.length > 0" class="results-list">
        <ProgramCardCW v-for="p in store.filteredPrograms" :key="p.id" :program="p" :reasons="store.matchReasons(p, store.answers)" />
      </div>
      <div v-else class="card" style="text-align:center;padding:var(--sp-12)">
        <h2>{{ $t('ui.no_results_title') }}</h2>
        <p style="color:var(--color-text-muted);margin-bottom:var(--sp-4)">
          {{ $t('ui.no_results_body') }}
        </p>
        <a href="tel:7032220880" class="btn btn--primary">📞 703-222-0880</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEligibilityStore } from '@/stores/eligibility'
import type { IncomeAnswer } from '@/components/questionnaire/QuestionIncome.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import QuestionSingle from '@/components/questionnaire/QuestionSingle.vue'
import QuestionMulti from '@/components/questionnaire/QuestionMulti.vue'
import QuestionIncome from '@/components/questionnaire/QuestionIncome.vue'
import QuestionNumeric from '@/components/questionnaire/QuestionNumeric.vue'
import NavigationButtons from '@/components/questionnaire/NavigationButtons.vue'
import ProgramCardCW from '@/components/results/ProgramCardCW.vue'

const store = useEligibilityStore()
const { locale } = useI18n()

const hasAnswers = computed(() => Object.keys(store.answers).length > 0)
const showResults = ref(false)
const started = ref(false)

const currentIdx = computed(() => store.currentQuestionIndex)
const currentQuestion = computed(() => store.activeQuestions[currentIdx.value])

const currentAnswer = computed(() => {
  const code = currentQuestion.value?.code
  if (!code) return undefined
  return (store.answers as Record<string, unknown>)[code]
})

const incomeAnswer = computed((): IncomeAnswer | undefined => {
  const hs = store.answers.household_size
  if (!hs) return undefined
  return {
    household_size: hs,
    monthly_income: store.answers.monthly_income,
    annual_income: store.answers.annual_income,
  }
})

const canAdvance = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  if (q.question_type === 'income_input') return !!incomeAnswer.value
  if (q.question_type === 'numeric_input') {
    const v = currentAnswer.value as number | undefined
    return v !== undefined && v !== null && Number.isInteger(v) && v >= 1
  }
  if (q.question_type === 'multi_choice') {
    return Array.isArray(currentAnswer.value) && (currentAnswer.value as string[]).length > 0
  }
  return currentAnswer.value !== undefined && currentAnswer.value !== null
})

function onAnswer(value: unknown) {
  store.setAnswer(currentQuestion.value.code, value)
}

function onIncomeAnswer(value: IncomeAnswer | undefined) {
  if (!value) return
  store.setAnswer('household_size', value.household_size)
  if (value.monthly_income !== undefined) store.setAnswer('monthly_income', value.monthly_income)
  if (value.annual_income !== undefined) store.setAnswer('annual_income', value.annual_income)
}

function goNext() {
  if (!canAdvance.value) return
  if (currentIdx.value >= store.activeQuestions.length - 1) {
    showResults.value = true
  } else {
    store.currentQuestionIndex++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function goBack() {
  if (currentIdx.value > 0) {
    store.currentQuestionIndex--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function onSkip() {
  store.setAnswer(currentQuestion.value.code, null)
  goNext()
}

function beginQuestionnaire() {
  store.resetAnswers()
  showResults.value = false
  started.value = true
}

function resetAndRestart() {
  store.resetAnswers()
  showResults.value = false
  started.value = false
}

function print() { window.print() }

onMounted(async () => {
  if (store.questions.length === 0 || store.allPrograms.length === 0) {
    await store.loadData(locale.value, 'caseworker')
  }
  store.resetAnswers()
})
</script>

<style scoped>
.cw-view__header {
  background: var(--color-primary-dark);
  color: white;
  padding: var(--sp-4) 0;
}
.cw-view__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
}
.cw-view__label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.65);
  margin-bottom: var(--sp-1);
}
.cw-view__title { color: white; font-size: var(--text-xl); }
.cw-view__print-btn {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.4);
  color: white;
}
.cw-view__print-btn:hover { background: rgba(255,255,255,0.25); color: white; }

.cw-view__start { padding: var(--sp-8) 0; }
.cw-view__questionnaire { padding: var(--sp-4) 0 var(--sp-12); }
.cw-view__results { padding: var(--sp-6) 0 var(--sp-12); }

.cw-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  margin-bottom: var(--sp-4);
  flex-wrap: wrap;
}
.results-count { font-size: var(--text-sm); color: var(--color-text-muted); }
.results-list { display: flex; flex-direction: column; gap: var(--sp-4); }
</style>
