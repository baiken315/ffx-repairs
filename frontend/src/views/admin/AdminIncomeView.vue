<template>
  <div class="admin-income">
    <div class="admin-page-header">
      <h1 class="admin-page-title">Income Limits</h1>
      <p class="admin-page-subtitle">
        Edit the household income thresholds used for eligibility filtering.
        These limits are shared across all programs that use the same benchmark.
      </p>
    </div>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <template v-else>
      <!-- Benchmark selector + new benchmark -->
      <div class="card benchmark-selector">
        <div class="benchmark-top-row">
          <div class="benchmark-select-group">
            <label class="form-label" for="benchmark-select">Select Benchmark</label>
            <select
              id="benchmark-select"
              v-model="selectedBenchmarkId"
              class="form-input benchmark-select"
            >
              <option v-for="b in benchmarks" :key="b.id" :value="b.id">
                {{ b.label_en }}
              </option>
            </select>
          </div>
          <button class="btn btn--outline btn--sm new-benchmark-btn" @click="showNewBenchmark = !showNewBenchmark">
            {{ showNewBenchmark ? 'Cancel' : '+ New Benchmark' }}
          </button>
        </div>

        <!-- New benchmark form -->
        <div v-if="showNewBenchmark" class="new-benchmark-form">
          <div class="new-benchmark-fields">
            <div>
              <label class="form-label">Name (English)</label>
              <input v-model="newBenchmark.label_en" class="form-input" placeholder="e.g. 80% AMI (Custom)" />
            </div>
            <div>
              <label class="form-label">Name (Spanish)</label>
              <input v-model="newBenchmark.label_es" class="form-input" placeholder="e.g. 80% AMI (Personalizado)" />
            </div>
            <div>
              <label class="form-label">Code <span class="form-hint-inline">(auto-generated)</span></label>
              <input :value="newBenchmarkCode" class="form-input" readonly />
            </div>
          </div>
          <p v-if="newBenchmarkError" class="save-message save-message--err">{{ newBenchmarkError }}</p>
          <button class="btn btn--primary btn--sm" :disabled="!newBenchmark.label_en || creatingBenchmark" @click="createBenchmark">
            {{ creatingBenchmark ? 'Creating…' : 'Create Benchmark' }}
          </button>
        </div>

        <p v-if="selectedBenchmark" class="benchmark-desc">
          Status: <strong>{{ programsUsingBenchmark }}</strong>
        </p>
      </div>

      <!-- Threshold table -->
      <div v-if="selectedBenchmarkId" class="card threshold-card">
        <div class="threshold-header">
          <h2 class="threshold-title">{{ selectedBenchmark?.label_en }}</h2>
          <div class="threshold-year">
            <label class="form-label" for="year-select">Effective year</label>
            <select id="year-select" v-model="effectiveYear" class="form-input year-select">
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
        </div>

        <p class="form-hint" style="margin-bottom: var(--sp-4)">
          Type either monthly or annual — the other field calculates automatically (annual ÷ 12 = monthly).
          Leave blank for household sizes without a separate limit.
        </p>

        <div v-if="!yearHasData" class="no-data-banner">
          <span>No limits saved for {{ effectiveYear }} yet.</span>
          <button
            v-if="priorYearWithData"
            class="btn btn--outline btn--sm"
            @click="copyFromPriorYear"
          >
            Copy from {{ priorYearWithData }}
          </button>
        </div>

        <div class="threshold-table-wrapper">
          <table class="threshold-table">
            <thead>
              <tr>
                <th>Household Size</th>
                <th>Monthly Limit ($)</th>
                <th>Annual Limit ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in editRows" :key="row.household_size">
                <td class="size-cell">
                  <span class="size-badge">{{ row.household_size }}</span>
                  {{ row.household_size === 1 ? 'person' : 'people' }}
                </td>
                <td>
                  <input
                    type="number"
                    class="form-input threshold-input"
                    :value="row.monthly_limit ?? ''"
                    min="0"
                    step="0.01"
                    placeholder="—"
                    @input="onMonthlyInput(row, ($event.target as HTMLInputElement).value)"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    class="form-input threshold-input"
                    :value="row.annual_limit ?? ''"
                    min="0"
                    step="1"
                    placeholder="—"
                    @input="onAnnualInput(row, ($event.target as HTMLInputElement).value)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="save-bar">
          <p v-if="saveMessage" class="save-message" :class="saveOk ? 'save-message--ok' : 'save-message--err'">
            {{ saveMessage }}
          </p>
          <button class="btn btn--ghost" @click="resetRows">Discard Changes</button>
          <button class="btn btn--primary" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save Limits' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'

interface Benchmark { id: number; code: string; label_en: string; label_es: string }
interface ThresholdRow {
  benchmark_id: number
  household_size: number
  monthly_limit: number | null
  annual_limit: number | null
  effective_year: number
}
interface EditRow {
  household_size: number
  monthly_limit: number | null
  annual_limit: number | null
}

const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const saveOk = ref(false)
const yearHasData = ref(true)
const priorYearWithData = ref<number | null>(null)

const benchmarks = ref<Benchmark[]>([])
const allThresholds = ref<ThresholdRow[]>([])
const selectedBenchmarkId = ref<number | null>(null)
const effectiveYear = ref(new Date().getFullYear())
const editRows = ref<EditRow[]>([])

// New benchmark form state
const showNewBenchmark = ref(false)
const creatingBenchmark = ref(false)
const newBenchmarkError = ref('')
const newBenchmark = ref({ label_en: '', label_es: '' })
const newBenchmarkCode = computed(() =>
  newBenchmark.value.label_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'custom'
)

const CURRENT_YEAR = new Date().getFullYear()
const availableYears = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

function bestYearForBenchmark(benchmarkId: number): number {
  const years = allThresholds.value
    .filter(t => t.benchmark_id === benchmarkId)
    .map(t => t.effective_year)
  if (years.length === 0) return CURRENT_YEAR
  return Math.max(...years)
}

function authHeader() {
  return { Authorization: `Basic ${sessionStorage.getItem('admin_token') ?? ''}` }
}

const selectedBenchmark = computed(() =>
  benchmarks.value.find(b => b.id === selectedBenchmarkId.value) ?? null
)

const programsUsingBenchmark = computed(() => {
  if (!selectedBenchmarkId.value) return '—'
  const rows = allThresholds.value.filter(t => t.benchmark_id === selectedBenchmarkId.value)
  return rows.length > 0 ? 'has thresholds defined' : 'no thresholds yet'
})

function yearsWithData(benchmarkId: number): number[] {
  return [...new Set(
    allThresholds.value
      .filter(t => t.benchmark_id === benchmarkId)
      .map(t => t.effective_year)
  )].sort((a, b) => b - a)
}

function buildEditRows(benchmarkId: number, year: number, sourceYear?: number): EditRow[] {
  const resolvedYear = sourceYear ?? year
  return Array.from({ length: 8 }, (_, i) => {
    const size = i + 1
    const match = allThresholds.value.find(
      t => t.benchmark_id === benchmarkId && t.household_size === size && t.effective_year === resolvedYear
    )
    return {
      household_size: size,
      monthly_limit: match?.monthly_limit ?? null,
      annual_limit: match?.annual_limit ?? null,
    }
  })
}

function resetRows() {
  if (!selectedBenchmarkId.value) return
  const id = selectedBenchmarkId.value
  const year = effectiveYear.value
  const hasExact = allThresholds.value.some(
    t => t.benchmark_id === id && t.effective_year === year
  )
  yearHasData.value = hasExact
  const prior = yearsWithData(id).find(y => y < year) ?? null
  priorYearWithData.value = prior
  editRows.value = buildEditRows(id, year)
  saveMessage.value = ''
}

function copyFromPriorYear() {
  if (!selectedBenchmarkId.value || !priorYearWithData.value) return
  editRows.value = buildEditRows(selectedBenchmarkId.value, effectiveYear.value, priorYearWithData.value)
  saveMessage.value = ''
}

watch(selectedBenchmarkId, (newId) => {
  if (newId !== null) effectiveYear.value = bestYearForBenchmark(newId)
  resetRows()
})

watch(effectiveYear, () => { resetRows() })

function onMonthlyInput(row: EditRow, val: string) {
  const n = parseFloat(val)
  if (isNaN(n) || val === '') {
    row.monthly_limit = null
    row.annual_limit = null
  } else {
    row.monthly_limit = Math.round(n * 100) / 100
    row.annual_limit = Math.round(n * 12)
  }
}

function onAnnualInput(row: EditRow, val: string) {
  const n = parseFloat(val)
  if (isNaN(n) || val === '') {
    row.annual_limit = null
    row.monthly_limit = null
  } else {
    row.annual_limit = Math.round(n)
    row.monthly_limit = Math.round((n / 12) * 100) / 100
  }
}

async function createBenchmark() {
  newBenchmarkError.value = ''
  creatingBenchmark.value = true
  try {
    const res = await axios.post('/api/v1/admin/income-benchmarks', {
      code: newBenchmarkCode.value,
      label_en: newBenchmark.value.label_en,
      label_es: newBenchmark.value.label_es || newBenchmark.value.label_en,
    }, { headers: authHeader() })
    benchmarks.value.push(res.data.benchmark)
    selectedBenchmarkId.value = res.data.benchmark.id
    newBenchmark.value = { label_en: '', label_es: '' }
    showNewBenchmark.value = false
    effectiveYear.value = CURRENT_YEAR
    resetRows()
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
    newBenchmarkError.value = msg ?? 'Failed to create benchmark.'
  } finally {
    creatingBenchmark.value = false
  }
}

async function save() {
  if (!selectedBenchmarkId.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    const payload = editRows.value.map(r => ({
      household_size: r.household_size,
      monthly_limit: r.monthly_limit,
      annual_limit: r.annual_limit,
      effective_year: effectiveYear.value,
    }))
    await axios.put(`/api/v1/admin/income-thresholds/${selectedBenchmarkId.value}`, payload, {
      headers: authHeader(),
    })
    const res = await axios.get('/api/v1/admin/income-thresholds', { headers: authHeader() })
    allThresholds.value = res.data.thresholds
    yearHasData.value = true
    saveOk.value = true
    saveMessage.value = 'Saved successfully.'
  } catch {
    saveOk.value = false
    saveMessage.value = 'Save failed. Please try again.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/admin/income-thresholds', { headers: authHeader() })
    benchmarks.value = res.data.benchmarks
    allThresholds.value = res.data.thresholds
    if (benchmarks.value.length > 0) {
      const firstId = benchmarks.value[0].id
      selectedBenchmarkId.value = firstId
      effectiveYear.value = bestYearForBenchmark(firstId)
      resetRows()
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-income { max-width: 860px; }

.admin-page-header { margin-bottom: var(--sp-6); }
.admin-page-subtitle { color: var(--color-text-muted); font-size: var(--text-sm); margin-top: var(--sp-1); }

.benchmark-selector {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}
.benchmark-top-row {
  display: flex;
  align-items: flex-end;
  gap: var(--sp-4);
  flex-wrap: wrap;
}
.benchmark-select-group { display: flex; flex-direction: column; gap: var(--sp-1); flex: 1; }
.benchmark-select { max-width: 420px; }
.new-benchmark-btn { white-space: nowrap; align-self: flex-end; }
.benchmark-desc { font-size: var(--text-sm); color: var(--color-text-muted); }

.new-benchmark-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-4);
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.new-benchmark-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 200px;
  gap: var(--sp-3);
}
@media (max-width: 640px) {
  .new-benchmark-fields { grid-template-columns: 1fr; }
}
.form-hint-inline { font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 400; }

.threshold-card { }
.threshold-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-4);
  margin-bottom: var(--sp-4);
  flex-wrap: wrap;
}
.threshold-title { font-size: var(--text-lg); font-weight: 700; color: var(--color-primary); }
.threshold-year { display: flex; flex-direction: column; gap: var(--sp-1); }
.year-select { width: 120px; }

.no-data-banner {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: #fffbeb;
  border: 1px solid #f59e0b;
  border-radius: var(--radius);
  color: #92400e;
  font-size: var(--text-sm);
  margin-bottom: var(--sp-4);
}
.no-data-banner span { flex: 1; }

.threshold-table-wrapper { overflow-x: auto; }
.threshold-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}
.threshold-table th {
  text-align: left;
  padding: var(--sp-2) var(--sp-3);
  background: var(--color-bg-muted);
  font-weight: 600;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 2px solid var(--color-border);
}
.threshold-table td {
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.threshold-table tr:last-child td { border-bottom: none; }
.threshold-table tr:hover td { background: #f8fafc; }

.size-cell { font-weight: 500; white-space: nowrap; }
.size-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-size: var(--text-sm);
  font-weight: 700;
  margin-right: var(--sp-2);
}

.threshold-input {
  width: 150px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-3);
  margin-top: var(--sp-5);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.save-message { font-size: var(--text-sm); flex: 1; }
.save-message--ok { color: var(--color-success); }
.save-message--err { color: var(--color-error); }
</style>
