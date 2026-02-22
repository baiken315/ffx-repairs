<template>
  <div class="question-income">
    <h2 class="question-prompt">{{ $t(question.i18n_key) }}</h2>
    <p class="form-hint question-hint">{{ $t(hintKey) }}</p>

    <!-- Household size -->
    <div class="form-group">
      <label class="form-label" for="household-size">
        {{ $t('ui.household_size_label') }}
      </label>
      <input
        id="household-size"
        type="number"
        inputmode="numeric"
        class="form-input form-input--narrow"
        min="1"
        max="8"
        :value="householdSize"
        @input="onHouseholdInput"
        :aria-describedby="householdError ? 'household-error' : undefined"
        :aria-invalid="!!householdError"
      />
      <p v-if="householdError" id="household-error" class="form-error" role="alert">
        {{ $t(householdError) }}
      </p>
    </div>

    <!-- Income mode toggle -->
    <div class="income-toggle" role="group" :aria-label="'Income period'">
      <button
        type="button"
        class="toggle-btn"
        :class="{ 'is-active': mode === 'monthly' }"
        @click="mode = 'monthly'"
        :aria-pressed="mode === 'monthly'"
      >
        {{ $t('ui.income_toggle_monthly') }}
      </button>
      <button
        type="button"
        class="toggle-btn"
        :class="{ 'is-active': mode === 'annual' }"
        @click="mode = 'annual'"
        :aria-pressed="mode === 'annual'"
      >
        {{ $t('ui.income_toggle_annual') }}
      </button>
    </div>

    <!-- Income amount -->
    <div class="form-group">
      <label class="form-label" for="income-amount">
        {{ mode === 'monthly' ? $t('ui.income_monthly') : $t('ui.income_annual') }}
      </label>
      <div class="input-dollar">
        <span class="input-dollar__prefix" aria-hidden="true">$</span>
        <input
          id="income-amount"
          type="number"
          inputmode="decimal"
          class="form-input"
          min="0"
          step="1"
          :value="incomeAmount"
          @input="onIncomeInput"
          :aria-describedby="incomeError ? 'income-error' : undefined"
          :aria-invalid="!!incomeError"
          placeholder="0"
        />
      </div>
      <p v-if="incomeError" id="income-error" class="form-error" role="alert">
        {{ $t(incomeError) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DecisionTreeQuestion } from '@/stores/eligibility'

export interface IncomeAnswer {
  household_size: number
  monthly_income?: number
  annual_income?: number
}

const props = defineProps<{
  question: DecisionTreeQuestion
  modelValue?: IncomeAnswer
}>()

const emit = defineEmits<{ 'update:modelValue': [value: IncomeAnswer | undefined] }>()

const hintKey = props.question.i18n_key.replace('.prompt', '.hint')
const mode = ref<'monthly' | 'annual'>('monthly')
const householdSize = ref<number | undefined>(props.modelValue?.household_size)
const incomeAmount = ref<number | undefined>(
  props.modelValue?.monthly_income ?? props.modelValue?.annual_income
)
const householdError = ref<string | null>(null)
const incomeError = ref<string | null>(null)

function onHouseholdInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  householdError.value = null
  if (isNaN(val) || val < 1) {
    householdError.value = 'errors.min_1'
    householdSize.value = undefined
  } else if (val > 8) {
    householdError.value = 'errors.max_8'
    householdSize.value = undefined
  } else {
    householdSize.value = val
  }
  emitValue()
}

function onIncomeInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  incomeError.value = null
  if (isNaN(val) || val < 0) {
    incomeError.value = 'errors.invalid_income'
    incomeAmount.value = undefined
  } else {
    incomeAmount.value = val
  }
  emitValue()
}

function emitValue() {
  if (householdSize.value === undefined || incomeAmount.value === undefined) {
    emit('update:modelValue', undefined)
    return
  }
  emit('update:modelValue', {
    household_size: householdSize.value,
    ...(mode.value === 'monthly'
      ? { monthly_income: incomeAmount.value }
      : { annual_income: incomeAmount.value }
    ),
  })
}

watch(mode, () => emitValue())
</script>

<style scoped>
.question-prompt {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--sp-2);
  line-height: 1.3;
}
.question-hint { margin-bottom: var(--sp-4); }
.form-input--narrow { max-width: 120px; }

.income-toggle {
  display: flex;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: white;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  min-height: 40px;
}

.toggle-btn.is-active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.input-dollar {
  position: relative;
  display: flex;
  align-items: center;
}

.input-dollar__prefix {
  position: absolute;
  left: var(--sp-3);
  color: var(--color-text-muted);
  font-weight: 600;
  pointer-events: none;
}

.input-dollar .form-input {
  padding-left: 1.75rem;
}

.form-error {
  font-size: var(--text-sm);
  color: var(--color-error);
  margin-top: var(--sp-1);
  font-weight: 500;
}
</style>
