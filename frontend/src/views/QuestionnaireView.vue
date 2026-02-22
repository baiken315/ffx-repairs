<template>
  <div class="questionnaire">
    <!-- Loading state -->
    <div v-if="store.isLoading" class="questionnaire__loading" aria-live="polite">
      <div class="container questionnaire__loading-inner">
        <div class="spinner" aria-hidden="true"></div>
        <p>Loading programs…</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="store.loadError" class="questionnaire__error" role="alert">
      <div class="container">
        <div class="card">
          <h2>{{ $t('errors.load_failed') }}</h2>
          <button class="btn btn--primary" @click="store.loadData(locale)">Try Again</button>
        </div>
      </div>
    </div>

    <!-- Questionnaire -->
    <template v-else-if="store.activeQuestions.length > 0">
      <ProgressBar :current="currentIdx + 1" :total="store.activeQuestions.length" />

      <div class="container questionnaire__content">
        <Transition name="slide" mode="out-in">
          <div :key="currentQuestion.code" class="card questionnaire__card">
            <!-- Income question -->
            <QuestionIncome
              v-if="currentQuestion.question_type === 'income_input'"
              :question="currentQuestion"
              :modelValue="incomeAnswer"
              @update:modelValue="onIncomeAnswer"
            />
            <!-- Numeric input (household size) -->
            <QuestionNumeric
              v-else-if="currentQuestion.question_type === 'numeric_input'"
              :question="currentQuestion"
              :modelValue="(currentAnswer as number | undefined)"
              @update:modelValue="onAnswer"
              @submit="goNext"
            />
            <!-- Multi-select -->
            <QuestionMulti
              v-else-if="currentQuestion.question_type === 'multi_choice'"
              :question="currentQuestion"
              :modelValue="(currentAnswer as string[])"
              @update:modelValue="onAnswer"
            />
            <!-- Single select (default) -->
            <QuestionSingle
              v-else
              :question="currentQuestion"
              :modelValue="(currentAnswer as string)"
              @update:modelValue="onAnswer"
            />

            <NavigationButtons
              :show-back="currentIdx > 0"
              :is-last="currentIdx === store.activeQuestions.length - 1"
              :is-skippable="currentQuestion.is_skippable"
              :can-advance="canAdvance"
              @back="goBack"
              @next="goNext"
              @skip="onSkip"
            />
          </div>
        </Transition>

        <!-- Live candidate count -->
        <p class="candidate-hint" aria-live="polite" aria-atomic="true">
          <template v-if="currentAnswer || (currentQuestion.question_type === 'income_input' && incomeAnswer)">
            {{ store.filteredPrograms.length }} program{{ store.filteredPrograms.length !== 1 ? 's' : '' }} match so far
          </template>
        </p>
      </div>
    </template>

    <!-- No questions loaded -->
    <div v-else class="container" style="padding-top: 2rem">
      <div class="card">
        <p>No questions available. Please try again.</p>
        <RouterLink to="/" class="btn btn--primary">Home</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useEligibilityStore } from '@/stores/eligibility'
import type { IncomeAnswer } from '@/components/questionnaire/QuestionIncome.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import QuestionSingle from '@/components/questionnaire/QuestionSingle.vue'
import QuestionMulti from '@/components/questionnaire/QuestionMulti.vue'
import QuestionIncome from '@/components/questionnaire/QuestionIncome.vue'
import QuestionNumeric from '@/components/questionnaire/QuestionNumeric.vue'
import NavigationButtons from '@/components/questionnaire/NavigationButtons.vue'

const store = useEligibilityStore()
const router = useRouter()
const { locale } = useI18n()

const currentIdx = computed(() => store.currentQuestionIndex)
const currentQuestion = computed(() => store.activeQuestions[currentIdx.value])

const currentAnswer = computed(() => {
  const code = currentQuestion.value?.code
  if (!code) return undefined
  return (store.answers as Record<string, unknown>)[code]
})

const incomeAnswer = computed((): IncomeAnswer | undefined => {
  const hs = store.answers.household_size
  const mi = store.answers.monthly_income
  const ai = store.answers.annual_income
  if (!hs) return undefined
  return { household_size: hs, monthly_income: mi, annual_income: ai }
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
  return currentAnswer.value !== undefined && currentAnswer.value !== null && currentAnswer.value !== ''
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
    router.push('/results')
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

onMounted(async () => {
  if (store.questions.length === 0) {
    await store.loadData(locale.value)
  }
  store.currentQuestionIndex = 0
})
</script>

<style scoped>
.questionnaire__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
.questionnaire__loading-inner {
  text-align: center;
}
.questionnaire__error {
  padding: var(--sp-8) 0;
}
.questionnaire__content {
  padding-top: var(--sp-6);
  padding-bottom: var(--sp-12);
}
.questionnaire__card {
  margin-bottom: var(--sp-4);
}
.candidate-hint {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  min-height: 1.5em;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto var(--sp-3);
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
