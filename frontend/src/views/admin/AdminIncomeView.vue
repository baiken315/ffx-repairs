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
      <!-- Benchmark selector -->
      <div class="card benchmark-selector">
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
        <p v-if="selectedBenchmark" class="benchmark-desc">
          Programs using this benchmark:
          <strong>{{ programsUsingBenchmark }}</strong>
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
          Enter 0 or leave blank for a household size that doesn't have a separate limit.
          Monthly and annual limits should be consistent (annual ÷ 12 = monthly).
        </p>

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

const benchmarks = ref<Benchmark[]>([])
const allThresholds = ref<ThresholdRow[]>([])
const selectedBenchmarkId = ref<number | null>(null)
const effectiveYear = ref(new Date().getFullYear())
const editRows = ref<EditRow[]>([])

const CURRENT_YEAR = new Date().getFullYear()
const availableYears = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

// Pick the most recent year that has data for a given benchmark, falling back to current year
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

// Count programs using this benchmark (placeholder — would need a separate API call)
const programsUsingBenchmark = computed(() => {
  if (!selectedBenchmarkId.value) return '—'
  const rows = allThresholds.value.filter(t => t.benchmark_id === selectedBenchmarkId.value)
  return rows.length > 0 ? 'has thresholds defined' : 'no thresholds yet'
})

function buildEditRows(benchmarkId: number, year: number): EditRow[] {
  return Array.from({ length: 8 }, (_, i) => {
    const size = i + 1
    // Prefer exact year match; fall back to any row for this benchmark+size
    const exactMatch = allThresholds.value.find(
      t => t.benchmark_id === benchmarkId && t.household_size === size && t.effective_year === year
    )
    const anyMatch = allThresholds.value.find(
      t => t.benchmark_id === benchmarkId && t.household_size === size
    )
    const existing = exactMatch ?? anyMatch
    return {
      household_size: size,
      monthly_limit: existing?.monthly_limit ?? null,
      annual_limit: existing?.annual_limit ?? null,
    }
  })
}

function resetRows() {
  if (selectedBenchmarkId.value) {
    editRows.value = buildEditRows(selectedBenchmarkId.value, effectiveYear.value)
    saveMessage.value = ''
  }
}

watch(selectedBenchmarkId, (newId) => {
  if (newId !== null) {
    // Auto-select the year that has actual data when switching benchmarks
    effectiveYear.value = bestYearForBenchmark(newId)
  }
  resetRows()
})

watch(effectiveYear, () => {
  resetRows()
})

function onMonthlyInput(row: EditRow, val: string) {
  const n = parseFloat(val)
  row.monthly_limit = isNaN(n) || val === '' ? null : Math.round(n * 100) / 100
}

function onAnnualInput(row: EditRow, val: string) {
  const n = parseFloat(val)
  row.annual_limit = isNaN(n) || val === '' ? null : Math.round(n * 100) / 100
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
    // Refresh local cache
    const res = await axios.get('/api/v1/admin/income-thresholds', { headers: authHeader() })
    allThresholds.value = res.data.thresholds
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
      // Auto-select the year that actually has data, then build rows
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
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}
.benchmark-select { max-width: 420px; }
.benchmark-desc { font-size: var(--text-sm); color: var(--color-text-muted); }

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
