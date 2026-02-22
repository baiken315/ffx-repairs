<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <nav class="admin-sidebar" aria-label="Admin navigation">
      <div class="admin-sidebar__brand">
        <p class="admin-sidebar__label">Admin</p>
        <p class="admin-sidebar__title">FFX Programs</p>
      </div>

      <ul class="admin-nav" role="list">
        <li>
          <RouterLink to="/admin" end class="admin-nav__link" active-class="is-active">
            📊 {{ $t('ui.admin_dashboard_title') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/programs" class="admin-nav__link" active-class="is-active">
            📋 {{ $t('ui.admin_programs') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/seasonal" class="admin-nav__link" active-class="is-active">
            📅 {{ $t('ui.admin_seasonal') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/income" class="admin-nav__link" active-class="is-active">
            💰 Income Limits
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/admin/administrators" class="admin-nav__link" active-class="is-active">
            🏢 Administrators
          </RouterLink>
        </li>
      </ul>

      <div class="admin-sidebar__footer">
        <RouterLink to="/" class="admin-nav__link">← Public site</RouterLink>
        <button class="btn btn--ghost btn--sm" style="width:100%;margin-top:0.5rem" @click="logout">
          {{ $t('ui.admin_logout') }}
        </button>
      </div>
    </nav>

    <!-- Main content -->
    <main class="admin-main" id="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  sessionStorage.removeItem('admin_token')
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: calc(100dvh - 60px);
}

.admin-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--color-primary-dark);
  color: white;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 60px;
  height: calc(100dvh - 60px);
  overflow-y: auto;
}

.admin-sidebar__brand {
  padding: var(--sp-6) var(--sp-4) var(--sp-4);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.admin-sidebar__label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255,255,255,0.5);
  margin-bottom: 2px;
}
.admin-sidebar__title { font-weight: 700; font-size: var(--text-base); color: white; }

.admin-nav {
  list-style: none;
  padding: var(--sp-3) 0;
  flex: 1;
}

.admin-nav__link {
  display: block;
  padding: var(--sp-3) var(--sp-4);
  color: rgba(255,255,255,0.75);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background var(--transition), color var(--transition);
  border-left: 3px solid transparent;
}

.admin-nav__link:hover {
  background: rgba(255,255,255,0.08);
  color: white;
}

.admin-nav__link.is-active {
  background: rgba(255,255,255,0.12);
  color: white;
  border-left-color: #63b3ed;
}

.admin-sidebar__footer {
  padding: var(--sp-4);
  border-top: 1px solid rgba(255,255,255,0.1);
}

.admin-main {
  flex: 1;
  min-width: 0;
  padding: var(--sp-6);
  background: var(--color-bg-muted);
}

@media (max-width: 768px) {
  .admin-layout { flex-direction: column; }
  .admin-sidebar {
    width: 100%;
    height: auto;
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .admin-sidebar__brand { display: none; }
  .admin-nav { display: flex; flex-direction: row; padding: 0; flex: none; }
  .admin-nav__link { padding: var(--sp-3); font-size: var(--text-xs); border-left: none; border-bottom: 3px solid transparent; }
  .admin-nav__link.is-active { border-bottom-color: #63b3ed; border-left: none; }
  .admin-sidebar__footer { padding: var(--sp-2); }
}
</style>
