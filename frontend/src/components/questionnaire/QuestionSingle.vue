<template>
  <fieldset class="question-fieldset">
    <legend class="question-prompt" :id="`legend-${question.code}`">
      {{ $t(question.i18n_key) }}
    </legend>
    <p v-if="hintKey" class="form-hint question-hint">{{ $t(hintKey) }}</p>
    <div class="option-list" role="radiogroup" :aria-labelledby="`legend-${question.code}`">
      <label
        v-for="opt in question.options"
        :key="opt.code"
        class="option-item"
        :class="{ 'is-selected': modelValue === opt.code }"
      >
        <input
          type="radio"
          :name="question.code"
          :value="opt.code"
          :checked="modelValue === opt.code"
          @change="$emit('update:modelValue', opt.code)"
        />
        <span class="option-label">{{ $t(opt.i18n_key) }}</span>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import type { DecisionTreeQuestion } from '@/stores/eligibility'

const props = defineProps<{
  question: DecisionTreeQuestion
  modelValue?: string
}>()

const hintKey = props.question.i18n_key.replace('.prompt', '.hint')
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<style scoped>
.question-fieldset { border: none; padding: 0; }
.question-prompt {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--sp-2);
  line-height: 1.3;
}
.question-hint { margin-bottom: var(--sp-4); }
</style>
