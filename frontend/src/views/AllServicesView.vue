<template>
  <div class="all-services">
    <div class="container">
      <div class="all-services__header">
        <div>
          <h1 class="all-services__title">All Assistance Programs</h1>
          <p class="all-services__subtitle">
            {{ filteredPrograms.length }} program{{ filteredPrograms.length !== 1 ? 's' : '' }} available
            — <RouterLink to="/questionnaire" class="all-services__check-link">
              Check your eligibility →
            </RouterLink>
          </p>
        </div>
        <button
          class="view-toggle-btn"
          :class="{ 'is-expanded': viewMode === 'caseworker' }"
          @click="toggleViewMode"
        >
          {{ viewMode === 'caseworker' ? '📋 Summary View' : '👤 Detailed View' }}
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="filter-bar__search">
          <input
            v-model="searchQuery"
            type="search"
            class="form-input"
            placeholder="Search programs…"
            aria-label="Search programs"
          />
        </div>
        <div class="filter-bar__chips">
          <button
            v-for="nt in needTypes"
            :key="nt.code"
            class="filter-chip"
            :class="{ 'is-active': activeNeedFilter === nt.code }"
            @click="toggleNeedFilter(nt.code)"
          >
            {{ nt.label }}
          </button>
          <button
            class="filter-chip"
            :class="{ 'is-active': openOnly }"
            @click="openOnly = !openOnly"
          >
            Open now
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.isLoading" class="all-services__loading" aria-live="polite">
        Loading programs…
      </div>

      <!-- No results -->
      <div v-else-if="filteredPrograms.length === 0" class="card all-services__empty">
        <p>No programs match your filters. <button class="link-btn" @click="clearFilters">Clear filters</button></p>
      </div>

      <!-- Program list -->
      <div v-else class="all-services__list">
        <ProgramCard
          v-for="program in filteredPrograms"
          :key="program.id"
          :program="program"
          :is-expanded="viewMode === 'caseworker'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEligibilityStore } from '@/stores/eligibility'
import type { Program } from '@/stores/eligibility'
import ProgramCard from '@/components/results/ProgramCard.vue'

const { locale } = useI18n()
const store = useEligibilityStore()
const searchQuery = ref('')
const activeNeedFilter = ref<string | null>(null)
const openOnly = ref(false)
const viewMode = ref<'summary' | 'caseworker'>('summary')
const today = new Date()

// Watch for language changes and reload programs
watch(() => locale.value, () => {
  loadPrograms()
})

const needTypes = computed(() => {
  const seen = new Map<string, string>()
  for (const p of store.allPrograms) {
    for (const nt of p.need_types) {
      seen.set(nt.code, nt.label)
    }
  }
  return Array.from(seen.entries()).map(([code, label]) => ({ code, label }))
})

const filteredPrograms = computed(() => {
  let list = [...store.allPrograms]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((p: Program) =>
      p.name.toLowerCase().includes(q) ||
      (p.short_description ?? '').toLowerCase().includes(q)
    )
  }

  if (activeNeedFilter.value) {
    list = list.filter((p: Program) => p.need_types.some((nt) => nt.code === activeNeedFilter.value))
  }

  if (openOnly.value) {
    list = list.filter((p: Program) => {
      if (p.seasonal_windows.length === 0) return true
      return p.seasonal_windows.some((w) => {
        const open = new Date(w.open_date + 'T00:00:00')
        const close = new Date(w.close_date + 'T23:59:59')
        return today >= open && today <= close
      })
    })
  }

  // Sort by program name (consistent across languages)
  list.sort((a: Program, b: Program) => a.name.localeCompare(b.name))

  return list
})

function toggleNeedFilter(code: string) {
  activeNeedFilter.value = activeNeedFilter.value === code ? null : code
}

function clearFilters() {
  searchQuery.value = ''
  activeNeedFilter.value = null
  openOnly.value = false
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'summary' ? 'caseworker' : 'summary'
  loadPrograms()
}

async function loadPrograms() {
  const view = viewMode.value === 'caseworker' ? 'caseworker' : 'resident'
  await store.loadData(locale.value, view)
}

onMounted(loadPrograms)
</script>

<style scoped>
.all-services { padding: var(--sp-8) 0 var(--sp-12); }

.all-services__header {
  margin-bottom: var(--sp-6);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-4);
  flex-wrap: wrap;
}
.all-services__title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--sp-1);
}
.all-services__subtitle {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.view-toggle-btn {
  padding: var(--sp-2) var(--sp-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  color: var(--color-text-muted);
  white-space: nowrap;
  height: fit-content;
}
.view-toggle-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.view-toggle-btn.is-expanded {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
.all-services__check-link {
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
}
.all-services__check-link:hover { text-decoration: underline; }

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-bottom: var(--sp-6);
  align-items: center;
}
.filter-bar__search { flex: 1; min-width: 200px; max-width: 360px; }
.filter-bar__chips { display: flex; flex-wrap: wrap; gap: var(--sp-2); }

.filter-chip {
  padding: var(--sp-1) var(--sp-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: white;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.15s;
  color: var(--color-text-muted);
  font-weight: 500;
}
.filter-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.filter-chip.is-active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.all-services__loading { color: var(--color-text-muted); padding: var(--sp-8) 0; text-align: center; }
.all-services__empty { text-align: center; color: var(--color-text-muted); }

.link-btn {
  background: none;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-weight: 600;
  padding: 0;
  text-decoration: underline;
}

.all-services__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}
</style>
