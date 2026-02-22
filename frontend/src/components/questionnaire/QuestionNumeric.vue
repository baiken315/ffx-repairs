<template>
  <div class="question-numeric">
    <label class="question-prompt" :for="`input-${question.code}`">
      {{ $t(question.i18n_key) }}
    </label>
    <p v-if="hintKey" class="form-hint question-hint">{{ $t(hintKey) }}</p>
    <input
      :id="`input-${question.code}`"
      type="number"
      class="form-input numeric-input"
      :value="modelValue ?? ''"
      min="1"
      max="20"
      step="1"
      inputmode="numeric"
      autocomplete="off"
      @input="onInput"
      @keydown.enter.prevent="$emit('submit')"
    />
  </div>
</template>

<script setup lang="ts">
import type { DecisionTreeQuestion } from '@/stores/eligibility'

const props = defineProps<{
  question: DecisionTreeQuestion
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'submit': []
}>()

const hintKey = props.question.i18n_key.replace('.prompt', '.hint')

function onInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10)
  if (!isNaN(val) && val >= 1) {
    emit('update:modelValue', val)
  }
}
</script>

<style scoped>
.question-numeric { display: flex; flex-direction: column; }

.question-prompt {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--sp-2);
  line-height: 1.3;
}

.question-hint { margin-bottom: var(--sp-4); }

.numeric-input {
  width: 140px;
  font-size: var(--text-2xl);
  font-weight: 700;
  text-align: center;
  padding: var(--sp-3) var(--sp-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-top: var(--sp-4);
}

.numeric-input:focus {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  border-color: var(--color-primary);
}

/* Hide browser spinner arrows — cleaner on mobile */
.numeric-input::-webkit-inner-spin-button,
.numeric-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.numeric-input[type=number] { -moz-appearance: textfield; }
</style>
