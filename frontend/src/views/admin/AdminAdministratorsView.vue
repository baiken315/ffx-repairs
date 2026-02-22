<template>
  <div class="admin-administrators">
    <h1 class="admin-page-title">Administrators</h1>
    <p class="form-hint" style="margin-bottom:var(--sp-4)">
      Edit contact information for each administering organization. Changes appear immediately on program cards.
    </p>

    <div v-if="loading" class="admin-loading">Loading…</div>

    <template v-else>
      <div class="admins-table card">
        <div v-for="admin in administrators" :key="admin.id" class="admin-row">
          <div v-if="editingId !== admin.id" class="admin-row__view">
            <div class="admin-row__name">{{ admin.name }}</div>
            <div class="admin-row__contacts">
              <span v-if="admin.phone" class="contact-chip">📞 {{ admin.phone }}</span>
              <span v-if="admin.email" class="contact-chip">✉ {{ admin.email }}</span>
              <span v-if="admin.website" class="contact-chip">🌐 {{ admin.website }}</span>
              <span v-if="!admin.phone && !admin.email && !admin.website" class="contact-chip contact-chip--empty">
                No contact info
              </span>
            </div>
            <button class="btn btn--sm btn--outline" @click="startEdit(admin)">Edit</button>
          </div>

          <form v-else class="admin-row__edit" @submit.prevent="saveAdmin(admin.id)">
            <div class="admin-edit-name">{{ admin.name }}</div>
            <div class="edit-fields">
              <div class="form-group">
                <label class="form-label" :for="`phone-${admin.id}`">Phone</label>
                <input
                  :id="`phone-${admin.id}`"
                  v-model="editForm.phone"
                  type="tel"
                  class="form-input"
                  placeholder="703-555-0100"
                />
              </div>
              <div class="form-group">
                <label class="form-label" :for="`email-${admin.id}`">Email</label>
                <input
                  :id="`email-${admin.id}`"
                  v-model="editForm.email"
                  type="email"
                  class="form-input"
                  placeholder="info@organization.org"
                />
              </div>
              <div class="form-group">
                <label class="form-label" :for="`website-${admin.id}`">Website</label>
                <input
                  :id="`website-${admin.id}`"
                  v-model="editForm.website"
                  type="url"
                  class="form-input"
                  placeholder="https://www.organization.org"
                />
              </div>
            </div>
            <div class="edit-actions">
              <button type="button" class="btn btn--ghost btn--sm" @click="editingId = null">Cancel</button>
              <button type="submit" class="btn btn--primary btn--sm" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
            <p v-if="saveError" class="save-error">{{ saveError }}</p>
          </form>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

interface Administrator {
  id: number
  code: string
  name: string
  phone: string | null
  email: string | null
  website: string | null
}

const loading = ref(true)
const saving = ref(false)
const saveError = ref('')
const editingId = ref<number | null>(null)
const administrators = ref<Administrator[]>([])

const editForm = reactive({ phone: '', email: '', website: '' })

function authHeader() {
  return { Authorization: `Basic ${sessionStorage.getItem('admin_token') ?? ''}` }
}

function startEdit(admin: Administrator) {
  editingId.value = admin.id
  editForm.phone = admin.phone ?? ''
  editForm.email = admin.email ?? ''
  editForm.website = admin.website ?? ''
  saveError.value = ''
}

async function saveAdmin(id: number) {
  saving.value = true
  saveError.value = ''
  try {
    const res = await axios.put(`/api/v1/admin/administrators/${id}`, {
      phone: editForm.phone || null,
      email: editForm.email || null,
      website: editForm.website || null,
    }, { headers: authHeader() })
    const idx = administrators.value.findIndex(a => a.id === id)
    if (idx !== -1) administrators.value[idx] = res.data
    editingId.value = null
  } catch {
    saveError.value = 'Save failed. Please try again.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/v1/admin/administrators', {
      headers: authHeader(),
    })
    administrators.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-page-title { font-size: var(--text-2xl); margin-bottom: var(--sp-2); }
.admin-loading { color: var(--color-text-muted); }

.admins-table { padding: 0; overflow: hidden; }

.admin-row {
  border-bottom: 1px solid var(--color-border);
}
.admin-row:last-child { border-bottom: none; }

.admin-row__view {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-3) var(--sp-4);
  flex-wrap: wrap;
}
.admin-row__name {
  font-weight: 700;
  font-size: var(--text-sm);
  min-width: 220px;
  flex-shrink: 0;
}
.admin-row__contacts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  flex: 1;
}
.contact-chip {
  font-size: var(--text-xs);
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  padding: 2px var(--sp-2);
  color: var(--color-text-muted);
}
.contact-chip--empty { font-style: italic; }

.admin-row__edit {
  padding: var(--sp-4);
  background: #f8fafc;
}
.admin-edit-name {
  font-weight: 700;
  font-size: var(--text-sm);
  margin-bottom: var(--sp-3);
}
.edit-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}
.edit-actions {
  display: flex;
  gap: var(--sp-2);
}
.save-error {
  color: var(--color-error, #c0392b);
  font-size: var(--text-sm);
  margin-top: var(--sp-2);
}
</style>
