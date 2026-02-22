<template>
  <div class="admin-programs">
    <div class="admin-programs__header">
      <h1 class="admin-page-title">Programs</h1>
      <RouterLink to="/admin/programs/new" class="btn btn--primary btn--sm">
        + Add Program
      </RouterLink>
    </div>

    <!-- Search -->
    <div class="form-group" style="max-width:320px">
      <input
        v-model="search"
        type="search"
        class="form-input"
        placeholder="Search programs…"
        aria-label="Search programs"
      />
    </div>

    <div v-if="loading" class="admin-loading">Loading programs…</div>

    <div v-else class="programs-table-wrap">
      <table class="data-table programs-table" aria-label="Programs list">
        <thead>
          <tr>
            <th>Program Name</th>
            <th>Geographies</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredPrograms" :key="p.id" :class="{ 'row--inactive': !p.is_active }">
            <td>
              <RouterLink :to="`/admin/programs/${p.id}`" class="program-link">
                {{ p.name }}
              </RouterLink>
            </td>
            <td>{{ p.geo_count }} area{{ p.geo_count !== 1 ? 's' : '' }}</td>
            <td>
              <span class="badge" :class="p.is_active ? 'badge--success' : 'badge--neutral'">
                {{ p.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="programs-table__actions">
              <RouterLink :to="`/admin/programs/${p.id}`" class="btn btn--sm btn--ghost">Edit</RouterLink>
              <button
                class="btn btn--sm btn--ghost"
                @click="toggleActive(p)"
                :title="p.is_active ? 'Deactivate' : 'Activate'"
              >
                {{ p.is_active ? '🚫 Deactivate' : '✅ Activate' }}
              </button>
            </td>
          </tr>
          <tr v-if="filteredPrograms.length === 0">
            <td colspan="4" style="text-align:center;padding:2rem;color:var(--color-text-muted)">
              No programs found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

interface Program {
  id: number
  name: string
  is_active: boolean
  geo_count: number
  updated_at: string
}

const loading = ref(true)
const programs = ref<Program[]>([])
const search = ref('')

function authHeader() {
  return { Authorization: `Basic ${sessionStorage.getItem('admin_token') ?? ''}` }
}

const filteredPrograms = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return programs.value
  return programs.value.filter(p => p.name.toLowerCase().includes(q))
})

async function load() {
  loading.value = true
  try {
    const res = await axios.get('/api/v1/admin/programs', { headers: authHeader() })
    programs.value = res.data
  } finally {
    loading.value = false
  }
}

async function toggleActive(p: Program) {
  await axios.patch(`/api/v1/admin/programs/${p.id}/active`,
    { is_active: !p.is_active },
    { headers: authHeader() }
  )
  p.is_active = !p.is_active
}

onMounted(load)
</script>

<style scoped>
.admin-programs__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  margin-bottom: var(--sp-4);
  flex-wrap: wrap;
}
.admin-page-title { font-size: var(--text-2xl); }
.admin-loading { color: var(--color-text-muted); margin: var(--sp-4) 0; }

.programs-table-wrap {
  overflow-x: auto;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}
.programs-table { min-width: 600px; }

.program-link {
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}
.program-link:hover { text-decoration: underline; }

.programs-table__actions {
  display: flex;
  gap: var(--sp-2);
  white-space: nowrap;
}

.row--inactive td { opacity: 0.55; }
</style>
