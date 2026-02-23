<template>
  <article class="program-card-cw card" :aria-label="program.name">
    <!-- Header -->
    <div class="cw-header">
      <div class="cw-title-row">
        <h3 class="cw-name">{{ program.name }}</h3>
        <span class="badge" :class="isOpen ? 'badge--success' : 'badge--warning'">
          {{ isOpen ? $t('ui.currently_open') : $t('ui.currently_closed') }}
        </span>
      </div>
      <div class="cw-badges">
        <span v-for="nt in program.need_types" :key="nt.code" class="badge badge--primary">
          {{ nt.label }}
        </span>
        <span v-for="ht in program.help_types" :key="ht.code" class="badge badge--neutral">
          {{ ht.label }}
        </span>
      </div>
    </div>

    <!-- Descriptions -->
    <div v-if="program.full_description || program.short_description" class="cw-section">
      <p>{{ program.full_description || program.short_description }}</p>
    </div>

    <!-- How to apply -->
    <div v-if="program.how_to_apply" class="cw-section">
      <h4 class="cw-section-title">{{ $t('ui.apply_instructions') }}</h4>
      <p class="cw-pre">{{ program.how_to_apply }}</p>
    </div>

    <div class="cw-grid">
      <!-- Eligibility -->
      <div>
        <h4 class="cw-section-title">{{ $t('ui.eligibility_details') }}</h4>

        <div class="cw-detail-row">
          <span class="cw-label">Geographies</span>
          <span>{{ program.geographies.map(g => g.label).join(', ') || 'All areas' }}</span>
        </div>

        <div class="cw-detail-row">
          <span class="cw-label">Housing types</span>
          <span>{{ program.housing_types.map(h => h.label).join(', ') || 'All types' }}</span>
        </div>

        <div class="cw-detail-row">
          <span class="cw-label">Age groups</span>
          <span>{{ program.age_groups.map(a => a.label).join(', ') || 'All ages' }}</span>
        </div>

        <div class="cw-detail-row">
          <span class="cw-label">Legal status</span>
          <span>
            {{
              program.requires_legal_status === true
                ? $t('ui.legal_status_required')
                : program.requires_legal_status === false
                  ? $t('ui.legal_status_not_required')
                  : 'Not specified'
            }}
          </span>
        </div>

        <!-- Income -->
        <div v-if="program.income_benchmark" class="cw-detail-row">
          <span class="cw-label">Income limit</span>
          <span>{{ program.income_benchmark.label }}</span>
        </div>
        <div v-else class="cw-detail-row">
          <span class="cw-label">Income limit</span>
          <span>{{ $t('ui.any_income') }}</span>
        </div>
      </div>

      <!-- Income threshold table -->
      <div v-if="program.income_thresholds.length > 0">
        <h4 class="cw-section-title">{{ $t('ui.income_limits_table') }}</h4>
        <table class="data-table cw-income-table">
          <thead>
            <tr>
              <th>{{ $t('ui.household_size_header') }}</th>
              <th>{{ $t('ui.monthly_limit_header') }}</th>
              <th>{{ $t('ui.annual_limit_header') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in program.income_thresholds" :key="t.household_size">
              <td>{{ t.household_size }}</td>
              <td>{{ t.monthly_limit ? formatCurrency(t.monthly_limit) : '—' }}</td>
              <td>{{ t.annual_limit ? formatCurrency(t.annual_limit) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Administrators -->
    <div v-if="program.administrators.length > 0" class="cw-section">
      <h4 class="cw-section-title">{{ $t('ui.contact_info') }}</h4>
      <div class="cw-admins">
        <div v-for="admin in program.administrators" :key="admin.code" class="cw-admin">
          <strong>{{ admin.name }}</strong>
          <span v-if="admin.is_primary" class="badge badge--primary" style="font-size:0.625rem">Primary</span>
          <a v-if="admin.phone" :href="`tel:${admin.phone}`">📞 {{ admin.phone }}</a>
          <a v-if="admin.email" :href="`mailto:${admin.email}`">✉ {{ admin.email }}</a>
          <a v-if="admin.website" :href="admin.website" target="_blank" rel="noopener">🌐 Website</a>
        </div>
      </div>
    </div>

    <!-- Eligibility reasoning -->
    <div v-if="reasons && reasons.length > 0" class="cw-section cw-reasons">
      <h4 class="cw-section-title">Why eligible</h4>
      <ul class="reasons-list">
        <li v-for="(r, i) in reasons" :key="i">
          <span class="reason-check">✓</span> {{ r }}
        </li>
      </ul>
    </div>

    <!-- Seasonal windows -->
    <div v-if="program.seasonal_windows.length > 0" class="cw-section">
      <h4 class="cw-section-title">Application Windows</h4>
      <ul class="cw-windows">
        <li v-for="(w, i) in program.seasonal_windows" :key="i">
          {{ formatDate(w.open_date) }} – {{ formatDate(w.close_date) }}
          <span v-if="w.notes" class="cw-note">{{ w.notes }}</span>
        </li>
      </ul>
    </div>
    <div v-else class="cw-section cw-section--inline">
      <span class="label">Availability:</span> Open year-round (no seasonal restrictions)
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Program } from '@/stores/eligibility'

const props = defineProps<{ program: Program; reasons?: string[] }>()

const today = new Date()
const isOpen = computed(() => {
  if (props.program.seasonal_windows.length === 0) return true
  return props.program.seasonal_windows.some(w => {
    const open = new Date(w.open_date + 'T00:00:00')
    const close = new Date(w.close_date + 'T23:59:59')
    return today >= open && today <= close
  })
})

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.program-card-cw { margin-bottom: var(--sp-4); }
.cw-header { margin-bottom: var(--sp-4); }
.cw-title-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: var(--sp-2); flex-wrap: wrap; margin-bottom: var(--sp-2);
}
.cw-name { font-size: var(--text-xl); color: var(--color-primary); font-weight: 700; flex: 1; }
.cw-badges { display: flex; flex-wrap: wrap; gap: var(--sp-1); }

.cw-section { margin-bottom: var(--sp-4); font-size: var(--text-sm); color: var(--color-text); }
.cw-section--inline { color: var(--color-text-muted); }
.cw-section-title {
  font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--color-text-muted); margin-bottom: var(--sp-2); font-weight: 700;
}
.cw-pre { white-space: pre-line; line-height: 1.7; }

.cw-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-6);
  margin-bottom: var(--sp-4);
}
@media (max-width: 600px) { .cw-grid { grid-template-columns: 1fr; } }

.cw-detail-row {
  display: flex; gap: var(--sp-2); font-size: var(--text-sm);
  padding: var(--sp-1) 0; border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.cw-label { font-weight: 600; min-width: 120px; color: var(--color-text-muted); font-size: var(--text-xs); }

.cw-income-table { font-size: var(--text-xs); }

.cw-admins { display: flex; flex-direction: column; gap: var(--sp-3); }
.cw-admin {
  display: flex; flex-direction: column; gap: 2px;
  font-size: var(--text-sm); padding: var(--sp-2);
  background: var(--color-bg-muted); border-radius: var(--radius-md);
}
.cw-admin a { color: var(--color-accent); text-decoration: none; }
.cw-admin a:hover { text-decoration: underline; }

.cw-windows { padding-left: var(--sp-4); font-size: var(--text-sm); }
.cw-windows li { margin-bottom: var(--sp-1); }
.cw-note { color: var(--color-text-muted); font-style: italic; margin-left: var(--sp-2); }

.cw-reasons {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: var(--radius);
  padding: var(--sp-3) var(--sp-4);
}
.reasons-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  font-size: var(--text-sm);
}
.reason-check { color: #16a34a; font-weight: 700; margin-right: var(--sp-1); }

.label { font-weight: 600; }
</style>
