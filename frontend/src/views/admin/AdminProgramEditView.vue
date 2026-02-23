<template>
  <div class="admin-program-edit">
    <div class="edit-header">
      <RouterLink to="/admin/programs" class="btn btn--ghost btn--sm">← Programs</RouterLink>
      <h1 class="admin-page-title">
        {{ isNew ? $t('ui.admin_add_program') : $t('ui.admin_edit_program') }}
      </h1>
    </div>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <template v-else>
      <!-- Tab nav -->
      <div class="tab-nav" role="tablist" aria-label="Program edit sections">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          role="tab"
          class="tab-btn"
          :class="{ 'is-active': activeTab === tab.key }"
          :aria-selected="activeTab === tab.key"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <form @submit.prevent="save" novalidate>
        <!-- Tab: Basic Info -->
        <div v-show="activeTab === 'basic'" class="card tab-panel" role="tabpanel">
          <!-- Translate bar -->
          <div class="translate-bar">
            <span class="translate-bar__label">Spanish fields</span>
            <button
              type="button"
              class="btn btn--outline btn--sm"
              :disabled="translating"
              @click="autoTranslateBasic"
            >
              {{ translating ? 'Translating…' : '✨ Auto-translate EN → ES' }}
            </button>
            <span v-if="translateError" class="translate-error">{{ translateError }}</span>
          </div>

          <div class="field-grid-2">
            <div class="form-group">
              <label class="form-label" for="name_en">Program Name (English) *</label>
              <input id="name_en" v-model="form.name_en" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="name_es">Program Name (Spanish)</label>
              <input id="name_es" v-model="form.name_es" type="text" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="slug">URL Slug *</label>
            <input id="slug" v-model="form.slug" type="text" class="form-input" required />
            <p class="form-hint">Unique identifier, e.g. "dominion-energy-share". Auto-generated from name.</p>
          </div>

          <div class="field-grid-2">
            <div class="form-group">
              <label class="form-label">Short Description (English)</label>
              <textarea v-model="form.short_description_en" class="form-input" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Short Description (Spanish)</label>
              <textarea v-model="form.short_description_es" class="form-input" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Full Description (English)</label>
              <textarea v-model="form.full_description_en" class="form-input" rows="5"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Full Description (Spanish)</label>
              <textarea v-model="form.full_description_es" class="form-input" rows="5"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">How to Apply (English)</label>
              <textarea v-model="form.how_to_apply_en" class="form-input" rows="4"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">How to Apply (Spanish)</label>
              <textarea v-model="form.how_to_apply_es" class="form-input" rows="4"></textarea>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="form.is_active" style="margin-right:0.5rem" />
              Program is active (visible to residents)
            </label>
          </div>

          <div class="notes-section">
            <p class="notes-section__title">Admin Notes <span class="notes-section__tag">Case worker view only</span></p>
            <p class="form-hint" style="margin-bottom:var(--sp-3)">Freeform notes for edge cases, limitations, or context not captured elsewhere (e.g. "Limited service for renters only").</p>
            <div class="field-grid-2">
              <div class="form-group">
                <label class="form-label">Notes (English)</label>
                <textarea v-model="form.notes_en" class="form-input" rows="3" placeholder="Optional. Visible to case workers only."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Notes (Spanish)</label>
                <textarea v-model="form.notes_es" class="form-input" rows="3" placeholder="Optional."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Eligibility -->
        <div v-show="activeTab === 'eligibility'" class="card tab-panel" role="tabpanel">
          <div class="eligibility-grid">
            <CheckboxGroup
              title="Geographies"
              :options="lookups.geographies"
              v-model="form.geography_ids"
              label-key="label_en"
            />
            <CheckboxGroup
              title="Age Groups"
              :options="lookups.age_groups"
              v-model="form.age_group_ids"
              label-key="label_en"
            />
            <CheckboxGroup
              title="Housing Types"
              :options="lookups.housing_types"
              v-model="form.housing_type_ids"
              label-key="label_en"
            />
            <CheckboxGroup
              title="Need Types"
              :options="lookups.need_types"
              v-model="form.need_type_ids"
              label-key="label_en"
            />
          </div>

          <div class="form-group" style="margin-top:var(--sp-4)">
            <label class="form-label">Help Types</label>
            <div
              v-for="cat in lookups.help_categories"
              :key="cat.id"
              style="margin-bottom:var(--sp-3)"
            >
              <p class="help-cat-title">{{ cat.label_en }}</p>
              <div class="help-types-grid">
                <label
                  v-for="ht in lookups.help_types.filter((h: LookupItem) => h.category_id === cat.id)"
                  :key="ht.id"
                  class="checkbox-item"
                >
                  <input
                    type="checkbox"
                    :value="ht.id"
                    :checked="form.help_type_ids.includes(ht.id)"
                    @change="toggleId(form.help_type_ids, ht.id)"
                  />
                  {{ ht.label_en }}
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Legal Status Requirement</label>
            <div class="legal-status-options">
              <label class="option-item">
                <input type="radio" name="legal_status" :value="null" v-model="form.requires_legal_status" />
                <span class="option-label">Not specified / irrelevant</span>
              </label>
              <label class="option-item">
                <input type="radio" name="legal_status" :value="true" v-model="form.requires_legal_status" />
                <span class="option-label">Legal status required</span>
              </label>
              <label class="option-item">
                <input type="radio" name="legal_status" :value="false" v-model="form.requires_legal_status" />
                <span class="option-label">Available regardless of immigration status</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Tab: Income -->
        <div v-show="activeTab === 'income'" class="card tab-panel" role="tabpanel">
          <!-- Translate bar -->
          <div class="translate-bar">
            <span class="translate-bar__label">Spanish fields</span>
            <button
              type="button"
              class="btn btn--outline btn--sm"
              :disabled="translating"
              @click="autoTranslateIncome"
            >
              {{ translating ? 'Translating…' : '✨ Auto-translate EN → ES' }}
            </button>
            <span v-if="translateError" class="translate-error">{{ translateError }}</span>
          </div>

          <div class="form-group">
            <label class="form-label" for="benchmark">Income Benchmark</label>
            <select id="benchmark" v-model="form.income_benchmark_id" class="form-input">
              <option :value="null">No income limit</option>
              <option v-for="b in lookups.income_benchmarks" :key="b.id" :value="b.id">
                {{ b.label_en }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Income Note Override (English)</label>
            <input v-model="form.income_note_en" type="text" class="form-input" placeholder="Optional override label" />
          </div>
          <div class="form-group">
            <label class="form-label">Income Note Override (Spanish)</label>
            <input v-model="form.income_note_es" type="text" class="form-input" />
          </div>
          <p class="form-hint" style="margin-top:var(--sp-2)">
            Income thresholds are shared per benchmark and managed globally.
            To edit threshold amounts, contact your database administrator.
          </p>
        </div>

        <!-- Tab: Seasonal -->
        <div v-show="activeTab === 'seasonal'" class="card tab-panel" role="tabpanel">
          <p class="form-hint" style="margin-bottom:var(--sp-4)">
            Leave empty for programs that are open year-round. Add windows for programs with specific open/close dates.
          </p>
          <div class="seasonal-list">
            <div
              v-for="(w, i) in form.seasonal_windows"
              :key="i"
              class="seasonal-row"
            >
              <div class="field-grid-2">
                <div class="form-group">
                  <label class="form-label">Open Date</label>
                  <input type="date" v-model="w.open_date" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Close Date</label>
                  <input type="date" v-model="w.close_date" class="form-input" />
                </div>
              </div>
              <div class="field-grid-2">
                <div class="form-group">
                  <label class="form-label">Notes (English)</label>
                  <input type="text" v-model="w.notes_en" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Notes (Spanish)</label>
                  <input type="text" v-model="w.notes_es" class="form-input" />
                </div>
              </div>
              <div class="seasonal-row-actions">
                <button
                  type="button"
                  class="btn btn--outline btn--sm"
                  :disabled="translating || !w.notes_en"
                  @click="autoTranslateWindow(i)"
                >
                  {{ translating ? 'Translating…' : '✨ Translate notes' }}
                </button>
                <button type="button" class="btn btn--sm btn--ghost" @click="removeWindow(i)">
                  🗑 Remove window
                </button>
              </div>
            </div>
          </div>
          <button type="button" class="btn btn--outline btn--sm" @click="addWindow" style="margin-top:var(--sp-3)">
            + Add Window
          </button>
        </div>

        <!-- Tab: Administrators -->
        <div v-show="activeTab === 'admins'" class="card tab-panel" role="tabpanel">
          <div class="admins-list">
            <label
              v-for="admin in lookups.administrators"
              :key="admin.id"
              class="admin-item"
            >
              <input
                type="checkbox"
                :value="admin.id"
                :checked="form.administrator_ids.some((a: AdminRef) => a.id === admin.id)"
                @change="toggleAdmin(admin.id)"
              />
              <div class="admin-item__info">
                <span class="admin-item__name">{{ admin.name }}</span>
                <span v-if="admin.phone" class="admin-item__phone">{{ admin.phone }}</span>
              </div>
              <label
                v-if="form.administrator_ids.some((a: AdminRef) => a.id === admin.id)"
                class="admin-item__primary"
              >
                <input
                  type="checkbox"
                  :checked="form.administrator_ids.find((a: AdminRef) => a.id === admin.id)?.is_primary ?? false"
                  @change="togglePrimary(admin.id)"
                />
                Primary
              </label>
            </label>
          </div>
        </div>

        <!-- Save bar -->
        <div class="save-bar">
          <p v-if="saveMessage" class="save-message" :class="saveSuccess ? 'save-message--ok' : 'save-message--err'">
            {{ saveMessage }}
          </p>
          <RouterLink to="/admin/programs" class="btn btn--ghost">Cancel</RouterLink>
          <button type="submit" class="btn btn--primary" :disabled="saving">
            {{ saving ? 'Saving…' : $t('ui.admin_save') }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useTranslate } from '@/composables/useTranslate'

// Inline CheckboxGroup component
import { defineComponent, h } from 'vue'

interface LookupItem { id: number; label_en: string; [key: string]: unknown }
interface AdminRef { id: number; is_primary: boolean }

const CheckboxGroup = defineComponent({
  props: { title: String, options: Array, modelValue: Array, labelKey: { type: String, default: 'label_en' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function toggle(id: number) {
      const cur: number[] = (props.modelValue as number[]) ?? []
      const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
      emit('update:modelValue', next)
    }
    return () => h('div', { class: 'form-group' }, [
      h('p', { class: 'form-label' }, props.title),
      h('div', { class: 'check-grid' },
        ((props.options ?? []) as LookupItem[]).map(opt =>
          h('label', { key: opt.id, class: 'checkbox-item' }, [
            h('input', {
              type: 'checkbox',
              value: opt.id,
              checked: ((props.modelValue as number[]) ?? []).includes(opt.id),
              onChange: () => toggle(opt.id),
            }),
            String(opt[(props.labelKey as string) ?? 'label_en']),
          ])
        )
      ),
    ])
  },
})

const { translating, translateError, translateToSpanish } = useTranslate()

async function autoTranslateBasic() {
  const originals = [
    form.name_en,
    form.short_description_en,
    form.full_description_en,
    form.how_to_apply_en,
    form.income_note_en,
    form.notes_en,
  ]
  const results = await translateToSpanish(originals)
  if (results[0]) form.name_es = results[0]
  if (results[1]) form.short_description_es = results[1]
  if (results[2]) form.full_description_es = results[2]
  if (results[3]) form.how_to_apply_es = results[3]
  if (results[4]) form.income_note_es = results[4]
  if (results[5]) form.notes_es = results[5]
}

async function autoTranslateIncome() {
  const originals = [form.income_note_en]
  const results = await translateToSpanish(originals)
  if (results[0]) form.income_note_es = results[0]
}

async function autoTranslateWindow(i: number) {
  const w = form.seasonal_windows[i]
  const originals = [w.notes_en]
  const results = await translateToSpanish(originals)
  if (results[0]) w.notes_es = results[0]
}

const route = useRoute()
const router = useRouter()

const isNew = !route.params.id
const loading = ref(!isNew)
const saving = ref(false)
const saveMessage = ref('')
const saveSuccess = ref(false)
const activeTab = ref('basic')

const tabs = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'income', label: 'Income' },
  { key: 'seasonal', label: 'Seasonal' },
  { key: 'admins', label: 'Administrators' },
]

interface Lookups {
  geographies: LookupItem[]
  age_groups: LookupItem[]
  housing_types: LookupItem[]
  need_types: LookupItem[]
  help_categories: LookupItem[]
  help_types: LookupItem[]
  income_benchmarks: LookupItem[]
  administrators: Array<LookupItem & { phone?: string }>
}

const lookups = reactive<Lookups>({
  geographies: [], age_groups: [], housing_types: [], need_types: [],
  help_categories: [], help_types: [], income_benchmarks: [], administrators: [],
})

interface FormData {
  slug: string
  name_en: string
  name_es: string
  short_description_en: string
  short_description_es: string
  full_description_en: string
  full_description_es: string
  how_to_apply_en: string
  how_to_apply_es: string
  income_benchmark_id: number | null
  income_note_en: string
  income_note_es: string
  notes_en: string
  notes_es: string
  requires_legal_status: boolean | null
  is_active: boolean
  geography_ids: number[]
  age_group_ids: number[]
  housing_type_ids: number[]
  need_type_ids: number[]
  help_type_ids: number[]
  administrator_ids: AdminRef[]
  seasonal_windows: Array<{ year: number; open_date: string; close_date: string; notes_en: string; notes_es: string }>
}

const form = reactive<FormData>({
  slug: '', name_en: '', name_es: '',
  short_description_en: '', short_description_es: '',
  full_description_en: '', full_description_es: '',
  how_to_apply_en: '', how_to_apply_es: '',
  income_benchmark_id: null, income_note_en: '', income_note_es: '',
  notes_en: '', notes_es: '',
  requires_legal_status: null, is_active: true,
  geography_ids: [], age_group_ids: [], housing_type_ids: [],
  need_type_ids: [], help_type_ids: [],
  administrator_ids: [], seasonal_windows: [],
})

function authHeader() {
  return { Authorization: `Basic ${sessionStorage.getItem('admin_token') ?? ''}` }
}

function toggleId(arr: number[], id: number) {
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

function toggleAdmin(id: number) {
  const idx = form.administrator_ids.findIndex(a => a.id === id)
  if (idx === -1) form.administrator_ids.push({ id, is_primary: form.administrator_ids.length === 0 })
  else form.administrator_ids.splice(idx, 1)
}

function togglePrimary(id: number) {
  const a = form.administrator_ids.find(a => a.id === id)
  if (a) a.is_primary = !a.is_primary
}

function addWindow() {
  form.seasonal_windows.push({
    year: new Date().getFullYear(),
    open_date: '', close_date: '',
    notes_en: '', notes_es: '',
  })
}

function removeWindow(i: number) {
  form.seasonal_windows.splice(i, 1)
}

// Auto-slug from name
watch(() => form.name_en, (val) => {
  if (isNew) {
    form.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
  }
})

async function save() {
  saving.value = true
  saveMessage.value = ''
  try {
    const headers = authHeader()
    if (isNew) {
      const res = await axios.post('/api/v1/admin/programs', form, { headers })
      saveMessage.value = `Program created (ID: ${res.data.id})`
      saveSuccess.value = true
      router.push(`/admin/programs/${res.data.id}`)
    } else {
      // Save seasonal separately
      await axios.put(`/api/v1/admin/programs/${route.params.id}/seasonal`,
        form.seasonal_windows, { headers })
      await axios.put(`/api/v1/admin/programs/${route.params.id}`, form, { headers })
      saveMessage.value = 'Saved successfully.'
      saveSuccess.value = true
    }
  } catch {
    saveMessage.value = 'Save failed. Please check your inputs.'
    saveSuccess.value = false
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const headers = authHeader()
  const lookupsRes = await axios.get('/api/v1/admin/lookups', { headers })
  Object.assign(lookups, lookupsRes.data)

  if (!isNew) {
    const res = await axios.get(`/api/v1/admin/programs/${route.params.id}`, { headers })
    const data = res.data
    Object.assign(form, {
      slug: data.slug,
      name_en: data.name_en ?? '',
      name_es: data.name_es ?? '',
      short_description_en: data.short_description_en ?? '',
      short_description_es: data.short_description_es ?? '',
      full_description_en: data.full_description_en ?? '',
      full_description_es: data.full_description_es ?? '',
      how_to_apply_en: data.how_to_apply_en ?? '',
      how_to_apply_es: data.how_to_apply_es ?? '',
      income_benchmark_id: data.income_benchmark_id ?? null,
      income_note_en: data.income_note_en ?? '',
      income_note_es: data.income_note_es ?? '',
      notes_en: data.notes_en ?? '',
      notes_es: data.notes_es ?? '',
      requires_legal_status: data.requires_legal_status ?? null,
      is_active: data.is_active,
      geography_ids: data.geography_ids ?? [],
      age_group_ids: data.age_group_ids ?? [],
      housing_type_ids: data.housing_type_ids ?? [],
      need_type_ids: data.need_type_ids ?? [],
      help_type_ids: data.help_type_ids ?? [],
      administrator_ids: data.administrator_ids ?? [],
      seasonal_windows: (data.seasonal_windows ?? []).map((w: { year: number; open_date: string; close_date: string; notes_en?: string; notes_es?: string }) => ({
        year: w.year, open_date: w.open_date, close_date: w.close_date,
        notes_en: w.notes_en ?? '', notes_es: w.notes_es ?? '',
      })),
    })
    loading.value = false
  }
})
</script>

<style>
.admin-program-edit { max-width: 900px; }
.edit-header {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin-bottom: var(--sp-4);
  flex-wrap: wrap;
}
.admin-page-title { font-size: var(--text-2xl); }
.admin-loading { color: var(--color-text-muted); }

.tab-nav {
  display: flex;
  gap: 2px;
  background: var(--color-border);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  overflow-x: auto;
}
.tab-btn {
  padding: 0.75rem 1.25rem;
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-bg-muted);
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: all var(--transition);
  min-height: 44px;
}
.tab-btn.is-active {
  background: white;
  color: var(--color-primary);
}
.tab-btn:first-child { border-radius: var(--radius-md) 0 0 0; }

.tab-panel {
  border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg);
  margin-bottom: var(--sp-4);
}

.field-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-4);
}
@media (max-width: 640px) { .field-grid-2 { grid-template-columns: 1fr; } }

.eligibility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--sp-4);
}

.check-grid {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
  transition: border-color 0.15s, background 0.15s;
  user-select: none;
}
.checkbox-item:hover { border-color: var(--color-primary); background: #f0f4f9; }
.checkbox-item:has(input:checked) { border-color: var(--color-primary); background: #e8eef7; }
.checkbox-item input { width: 16px; height: 16px; accent-color: var(--color-primary); flex-shrink: 0; }

.help-cat-title {
  font-weight: 700;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: var(--sp-2);
}
.help-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--sp-1);
}

.legal-status-options { display: flex; flex-direction: column; gap: var(--sp-2); margin-top: var(--sp-2); }

.seasonal-list { display: flex; flex-direction: column; gap: var(--sp-4); }
.seasonal-row {
  padding: var(--sp-4);
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.seasonal-row-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.admins-list { display: flex; flex-direction: column; gap: var(--sp-2); }
.admin-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: white;
  flex-wrap: wrap;
}
.admin-item input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--color-primary); }
.admin-item__info { display: flex; flex-direction: column; flex: 1; }
.admin-item__name { font-weight: 600; font-size: var(--text-sm); }
.admin-item__phone { font-size: var(--text-xs); color: var(--color-text-muted); }
.admin-item__primary { display: flex; align-items: center; gap: var(--sp-1); font-size: var(--text-xs); }

.save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-6);
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.save-message { font-size: var(--text-sm); flex: 1; }
.save-message--ok { color: var(--color-success); }
.save-message--err { color: var(--color-error); }

.notes-section {
  margin-top: var(--sp-5);
  padding: var(--sp-4);
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-md);
}
.notes-section__title {
  font-weight: 700;
  font-size: var(--text-sm);
  color: var(--color-text);
  margin-bottom: var(--sp-1);
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.notes-section__tag {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #d97706;
  color: white;
  border-radius: 4px;
  padding: 1px 6px;
}

.translate-bar {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-5);
  padding: var(--sp-3) var(--sp-4);
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}
.translate-bar__label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-primary);
  flex: 1;
}
.translate-error {
  font-size: var(--text-sm);
  color: var(--color-error);
  width: 100%;
}
</style>
