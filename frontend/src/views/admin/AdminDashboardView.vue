<template>
  <div class="admin-dashboard">
    <h1 class="admin-page-title">{{ $t('ui.admin_dashboard_title') }}</h1>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <div v-else class="dashboard-grid">
      <div class="stat-card card">
        <div class="stat-card__value">{{ stats.total }}</div>
        <div class="stat-card__label">Total Programs</div>
      </div>
      <div class="stat-card card">
        <div class="stat-card__value">{{ stats.active }}</div>
        <div class="stat-card__label">Active Programs</div>
      </div>
      <div class="stat-card card stat-card--success">
        <div class="stat-card__value">{{ stats.openToday }}</div>
        <div class="stat-card__label">Open Today</div>
      </div>
    </div>

    <div class="dashboard-actions">
      <RouterLink to="/admin/programs/new" class="btn btn--primary">
        + {{ $t('ui.admin_add_program') }}
      </RouterLink>
      <RouterLink to="/admin/programs" class="btn btn--outline">
        View All Programs
      </RouterLink>
    </div>

    <div v-if="!loading" class="card dashboard-tip">
      <h3>Quick Tips</h3>
      <ul>
        <li>Programs with no seasonal windows are shown as <strong>always open</strong>.</li>
        <li>Deactivating a program hides it from residents but keeps its data.</li>
        <li>Income thresholds are shared across programs that use the same benchmark (e.g., 80% AMI).</li>
        <li>Use the <strong>Bulk Import</strong> feature after updating the Excel spreadsheet.</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loading = ref(true)
const stats = ref({ total: 0, active: 0, openToday: 0 })

function authHeader() {
  const token = sessionStorage.getItem('admin_token') ?? ''
  return { Authorization: `Basic ${token}` }
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/admin/programs', { headers: authHeader() })
    const programs: Array<{ is_active: boolean }> = res.data
    const today = new Date().toISOString().slice(0, 10)

    // Fetch seasonal windows for open-today count from public endpoint
    const pubRes = await axios.get('/api/v1/programs')
    const pubPrograms: Array<{ seasonal_windows: Array<{ open_date: string; close_date: string }> }> = pubRes.data

    const openToday = pubPrograms.filter(p => {
      if (p.seasonal_windows.length === 0) return true
      return p.seasonal_windows.some(w => w.open_date <= today && w.close_date >= today)
    }).length

    stats.value = {
      total: programs.length,
      active: programs.filter(p => p.is_active).length,
      openToday,
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-page-title { font-size: var(--text-2xl); margin-bottom: var(--sp-6); }
.admin-loading { color: var(--color-text-muted); }

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--sp-4);
  margin-bottom: var(--sp-6);
}

.stat-card {
  text-align: center;
  padding: var(--sp-6);
}
.stat-card--success { border-top: 4px solid var(--color-success); }
.stat-card__value { font-size: var(--text-3xl); font-weight: 800; color: var(--color-primary); }
.stat-card__label { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--sp-1); }

.dashboard-actions {
  display: flex;
  gap: var(--sp-3);
  margin-bottom: var(--sp-6);
  flex-wrap: wrap;
}

.dashboard-tip {
  padding: var(--sp-4) var(--sp-6);
}
.dashboard-tip h3 { margin-bottom: var(--sp-3); }
.dashboard-tip ul {
  padding-left: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
