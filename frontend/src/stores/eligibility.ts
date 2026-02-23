import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface Geography { id: number; code: string; label: string }
export interface AgeGroup { id: number; code: string; label: string }
export interface HousingType { id: number; code: string; label: string }
export interface NeedType { id: number; code: string; label: string }
export interface HelpType { id: number; code: string; label: string; category: string }
export interface Administrator {
  id: number; code: string; name: string
  website: string | null; phone: string | null; email: string | null
  notes: string | null; is_primary: boolean
}
export interface IncomeThreshold {
  household_size: number; monthly_limit: number | null; annual_limit: number | null
}
export interface SeasonalWindow {
  open_date: string; close_date: string; notes: string | null
}
export interface Program {
  id: number; slug: string; name: string
  short_description: string | null
  full_description: string | null
  how_to_apply: string | null
  income_benchmark: { code: string; label: string } | null
  income_note: string | null
  requires_legal_status: boolean | null
  geographies: Geography[]
  age_groups: AgeGroup[]
  housing_types: HousingType[]
  need_types: NeedType[]
  help_types: HelpType[]
  administrators: Administrator[]
  income_thresholds: IncomeThreshold[]
  seasonal_windows: SeasonalWindow[]
  is_active: boolean
}

export interface DecisionTreeOption {
  id: number; code: string; i18n_key: string; sort_order: number; lookup_id: number | null
}
export interface DecisionTreeQuestion {
  id: number; code: string
  question_type: 'single_choice' | 'multi_choice' | 'income_input' | 'numeric_input'
  is_skippable: boolean; sort_order: number; i18n_key: string
  filter_field: string | null
  options: DecisionTreeOption[]
}

export interface Answers {
  geography?: string
  household_size?: number
  monthly_income?: number
  annual_income?: number
  age_group?: string
  legal_status?: string | null  // null = skipped
  ownership_type?: string       // renter | owner
  home_type?: string            // manufactured | single_family | townhome | multi_family | condo
  need_types?: string[]
}

export const useEligibilityStore = defineStore('eligibility', () => {
  const allPrograms = ref<Program[]>([])
  const questions = ref<DecisionTreeQuestion[]>([])
  const answers = ref<Answers>({})
  const currentQuestionIndex = ref(0)
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)
  const caseworkerMode = ref(false)

  const activeQuestions = computed(() => {
    // Start with full question list
    const all = questions.value
    if (all.length === 0) return []

    // For answered questions, always include them
    // For unanswered, check if they add filtering value
    const result: DecisionTreeQuestion[] = []
    const answeredCodes = new Set(Object.keys(answers.value))

    for (const q of all) {
      if (answeredCodes.has(q.code)) {
        result.push(q)
        continue
      }
      // Check if this question has discriminating power
      if (hasDiscriminatingPower(q, filteredPrograms.value)) {
        result.push(q)
      }
    }

    return result
  })

  function hasDiscriminatingPower(q: DecisionTreeQuestion, candidates: Program[]): boolean {
    if (candidates.length === 0) return false
    const field = q.filter_field
    if (!field) return true // income_input / numeric_input always shown

    if (field === 'income_thresholds') return true
    if (field === 'geographies') {
      const allSameGeos = candidates.every(p =>
        p.geographies.length === candidates[0].geographies.length &&
        p.geographies.every(g => candidates[0].geographies.some(og => og.code === g.code))
      )
      return !allSameGeos
    }
    if (field === 'age_groups') {
      const codes = new Set(candidates.flatMap(p => p.age_groups.map(ag => ag.code)))
      return codes.size > 1 || candidates.some(p => p.age_groups.length < 5)
    }
    if (field === 'housing_types') {
      const codes = new Set(candidates.flatMap(p => p.housing_types.map(ht => ht.code)))
      return codes.size > 1 || candidates.some(p => p.housing_types.length < 7)
    }
    if (field === 'legal_status') {
      return candidates.some(p => p.requires_legal_status === true)
    }
    if (field === 'need_types') {
      const codes = new Set(candidates.flatMap(p => p.need_types.map(nt => nt.code)))
      return codes.size > 1
    }
    return true
  }

  const filteredPrograms = computed((): Program[] => {
    const today = new Date()
    return allPrograms.value.filter(p => filterProgram(p, answers.value, today))
  })

  function filterProgram(p: Program, ans: Answers, today: Date): boolean {
    // Geography
    if (ans.geography) {
      if (!p.geographies.some(g => g.code === ans.geography)) return false
    }

    // Income
    if (
      ans.household_size !== undefined &&
      (ans.monthly_income !== undefined || ans.annual_income !== undefined) &&
      p.income_benchmark !== null &&
      p.income_thresholds.length > 0
    ) {
      const threshold = p.income_thresholds.find(t => t.household_size === ans.household_size)
      if (threshold) {
        const userMonthly = ans.monthly_income ?? (ans.annual_income! / 12)
        if (threshold.monthly_limit !== null && userMonthly > threshold.monthly_limit) return false
      }
    }

    // Age group
    if (ans.age_group) {
      if (!p.age_groups.some(ag => ag.code === ans.age_group)) return false
    }

    // Legal status (null = skipped)
    if (ans.legal_status !== null && ans.legal_status !== undefined) {
      if (ans.legal_status === 'without_status' && p.requires_legal_status === true) return false
    }

    // Housing (ownership_type + home_type both map to the housing_types junction)
    // A program passes if at least one of the user's answered housing codes is in the program's list.
    const selectedHousingCodes: string[] = []
    if (ans.ownership_type) selectedHousingCodes.push(ans.ownership_type)
    if (ans.home_type) selectedHousingCodes.push(ans.home_type)
    if (selectedHousingCodes.length > 0) {
      if (!p.housing_types.some(ht => selectedHousingCodes.includes(ht.code))) return false
    }

    // Need type (multi)
    if (ans.need_types && ans.need_types.length > 0) {
      if (!p.need_types.some(nt => ans.need_types!.includes(nt.code))) return false
    }

    // Seasonal
    if (p.seasonal_windows.length > 0) {
      const isOpen = p.seasonal_windows.some(w => {
        const open = new Date(w.open_date + 'T00:00:00')
        const close = new Date(w.close_date + 'T23:59:59')
        return today >= open && today <= close
      })
      if (!isOpen) return false
    }

    return true
  }

  function matchReasons(p: Program, ans: Answers): string[] {
    const reasons: string[] = []
    const today = new Date()
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

    if (ans.geography) {
      const geo = p.geographies.find(g => g.code === ans.geography)
      reasons.push(`Geography: ${geo?.label ?? ans.geography}`)
    }

    if (
      ans.household_size !== undefined &&
      (ans.monthly_income !== undefined || ans.annual_income !== undefined)
    ) {
      if (p.income_benchmark === null) {
        reasons.push('Income: no income limit for this program')
      } else if (p.income_thresholds.length > 0) {
        const threshold = p.income_thresholds.find(t => t.household_size === ans.household_size)
        const userMonthly = ans.monthly_income ?? (ans.annual_income! / 12)
        if (threshold?.monthly_limit) {
          reasons.push(`Income: ${fmt(userMonthly)}/mo ≤ ${fmt(threshold.monthly_limit)}/mo limit (${p.income_benchmark.label}, household of ${ans.household_size})`)
        } else {
          reasons.push(`Income: within ${p.income_benchmark.label} (household of ${ans.household_size})`)
        }
      }
    }

    if (ans.age_group) {
      const ag = p.age_groups.find(a => a.code === ans.age_group)
      reasons.push(`Age group: ${ag?.label ?? ans.age_group}`)
    }

    if (ans.legal_status !== undefined && ans.legal_status !== null) {
      if (p.requires_legal_status === null || p.requires_legal_status === false) {
        reasons.push('Legal status: open regardless of immigration status')
      }
    }

    const selectedHousingCodes: string[] = []
    if (ans.ownership_type) selectedHousingCodes.push(ans.ownership_type)
    if (ans.home_type) selectedHousingCodes.push(ans.home_type)
    if (selectedHousingCodes.length > 0) {
      const matched = p.housing_types.filter(ht => selectedHousingCodes.includes(ht.code))
      if (matched.length > 0) reasons.push(`Housing: ${matched.map(h => h.label).join(', ')}`)
    }

    if (ans.need_types && ans.need_types.length > 0) {
      const matched = p.need_types.filter(nt => ans.need_types!.includes(nt.code))
      if (matched.length > 0) reasons.push(`Need: ${matched.map(n => n.label).join(', ')}`)
    }

    if (p.seasonal_windows.length === 0) {
      reasons.push('Availability: open year-round')
    } else {
      const openWindow = p.seasonal_windows.find(w => {
        const open = new Date(w.open_date + 'T00:00:00')
        const close = new Date(w.close_date + 'T23:59:59')
        return today >= open && today <= close
      })
      if (openWindow) {
        const closeStr = new Date(openWindow.close_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        reasons.push(`Availability: open now (through ${closeStr})`)
      }
    }

    return reasons
  }

  async function loadData(lang: string, view = 'resident') {
    isLoading.value = true
    loadError.value = null
    try {
      const [programsRes, questionsRes] = await Promise.all([
        axios.get('/api/v1/programs', {
          headers: { 'Accept-Language': lang },
          params: view === 'caseworker' ? { view: 'caseworker' } : {},
        }),
        axios.get('/api/v1/questions', {
          headers: { 'Accept-Language': lang },
        }),
      ])
      allPrograms.value = programsRes.data
      questions.value = questionsRes.data.questions
    } catch {
      loadError.value = 'load_failed'
    } finally {
      isLoading.value = false
    }
  }

  function setAnswer(code: string, value: unknown) {
    answers.value = { ...answers.value, [code]: value }
  }

  function resetAnswers() {
    answers.value = {}
    currentQuestionIndex.value = 0
  }

  return {
    allPrograms, questions, answers, currentQuestionIndex,
    isLoading, loadError, caseworkerMode,
    activeQuestions, filteredPrograms,
    loadData, setAnswer, resetAnswers, matchReasons,
  }
})
