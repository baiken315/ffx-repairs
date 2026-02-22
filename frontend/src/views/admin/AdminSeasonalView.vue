<template>
  <div class="admin-seasonal">
    <h1 class="admin-page-title">Seasonal Windows</h1>
    <p class="form-hint" style="margin-bottom:var(--sp-4)">
      Overview of application windows for all programs. Programs with no windows are open year-round.
    </p>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <template v-else>
      <!-- Year selector -->
      <div class="form-group year-selector">
        <label class="form-label" for="year-select">Year</label>
        <select id="year-select" v-model="selectedYear" class="form-input" style="width:120px">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>

      <!-- Month grid -->
      <div class="seasonal-calendar">
        <div class="cal-header">
          <div class="cal-program-col">Program</div>
          <div
            v-for="m in months"
            :key="m.num"
            class="cal-month-col"
            :aria-label="m.label"
          >
            {{ m.short }}
          </div>
        </div>

        <div
          v-for="program in programs"
          :key="program.id"
          class="cal-row"
        >
          <div class="cal-program-col">
            <RouterLink :to="`/admin/programs/${program.id}`" class="cal-program-link">
              {{ program.name }}
            </RouterLink>
          </div>
          <div
            v-for="m in months"
            :key="m.num"
            class="cal-month-col"
          >
            <div
              class="cal-cell"
              :class="getMonthStatus(program.id, m.num)"
              :title="getMonthTitle(program.id, m.num)"
              :aria-label="`${program.name} ${m.label}: ${getMonthStatus(program.id, m.num) === 'open' ? 'Open' : getMonthStatus(program.id, m.num) === 'always' ? 'Always open' : 'Closed'}`"
            ></div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="cal-legend">
        <span class="legend-item">
          <span class="cal-cell open"></span> Open
        </span>
        <span class="legend-item">
          <span class="cal-cell always"></span> Year-round
        </span>
        <span class="legend-item">
          <span class="cal-cell closed"></span> Closed
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

interface WindowData { open_date: string; close_date: string }
interface ProgramData { id: number; name: string; seasonal_windows: WindowData[] }

const loading = ref(true)
const programs = ref<ProgramData[]>([])
const selectedYear = ref(new Date().getFullYear())

const years = [selectedYear.value - 1, selectedYear.value, selectedYear.value + 1]

const months = [
  { num: 1, label: 'January', short: 'Jan' },
  { num: 2, label: 'February', short: 'Feb' },
  { num: 3, label: 'March', short: 'Mar' },
  { num: 4, label: 'April', short: 'Apr' },
  { num: 5, label: 'May', short: 'May' },
  { num: 6, label: 'June', short: 'Jun' },
  { num: 7, label: 'July', short: 'Jul' },
  { num: 8, label: 'August', short: 'Aug' },
  { num: 9, label: 'September', short: 'Sep' },
  { num: 10, label: 'October', short: 'Oct' },
  { num: 11, label: 'November', short: 'Nov' },
  { num: 12, label: 'December', short: 'Dec' },
]

function getMonthStatus(programId: number, monthNum: number): 'open' | 'closed' | 'always' {
  const prog = programs.value.find(p => p.id === programId)
  if (!prog) return 'closed'
  if (prog.seasonal_windows.length === 0) return 'always'

  const monthStart = new Date(selectedYear.value, monthNum - 1, 1)
  const monthEnd = new Date(selectedYear.value, monthNum, 0)

  const isOpen = prog.seasonal_windows.some(w => {
    const open = new Date(w.open_date + 'T00:00:00')
    const close = new Date(w.close_date + 'T23:59:59')
    return open <= monthEnd && close >= monthStart
  })
  return isOpen ? 'open' : 'closed'
}

function getMonthTitle(programId: number, monthNum: number): string {
  const status = getMonthStatus(programId, monthNum)
  if (status === 'always') return 'Open year-round'
  if (status === 'open') return 'Open this month'
  return 'Closed this month'
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/programs')
    programs.value = res.data.map((p: { id: number; name: string; seasonal_windows: WindowData[] }) => ({
      id: p.id,
      name: p.name,
      seasonal_windows: p.seasonal_windows,
    }))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-page-title { font-size: var(--text-2xl); margin-bottom: var(--sp-2); }
.admin-loading { color: var(--color-text-muted); }
.year-selector { margin-bottom: var(--sp-4); }

.seasonal-calendar {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  margin-bottom: var(--sp-4);
}

.cal-header,
.cal-row {
  display: grid;
  grid-template-columns: 260px repeat(12, 1fr);
  min-width: 700px;
  border-bottom: 1px solid var(--color-border);
}
.cal-row:last-child { border-bottom: none; }

.cal-header {
  background: var(--color-bg-muted);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.cal-program-col {
  padding: var(--sp-2) var(--sp-3);
  display: flex;
  align-items: center;
  border-right: 1px solid var(--color-border);
}

.cal-month-col {
  padding: var(--sp-2) var(--sp-1);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-right: 1px solid var(--color-border);
  font-size: var(--text-xs);
}
.cal-month-col:last-child { border-right: none; }

.cal-program-link {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cal-program-link:hover { text-decoration: underline; }

.cal-cell {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
}
.cal-cell.open { background: var(--color-success); }
.cal-cell.always { background: var(--color-accent); }
.cal-cell.closed { background: var(--color-border); }

.cal-legend {
  display: flex;
  gap: var(--sp-4);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.legend-item .cal-cell { flex-shrink: 0; }
</style>
