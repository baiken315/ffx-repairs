import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    {
      path: '/questionnaire',
      component: () => import('@/views/QuestionnaireView.vue'),
    },
    {
      path: '/results',
      component: () => import('@/views/ResultsView.vue'),
    },
    {
      path: '/caseworker',
      component: () => import('@/views/CaseWorkerView.vue'),
    },
    {
      path: '/services',
      component: () => import('@/views/AllServicesView.vue'),
    },
    {
      path: '/admin/login',
      component: () => import('@/views/admin/AdminLoginView.vue'),
    },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayoutView.vue'),
      meta: { requiresAdminAuth: true },
      children: [
        {
          path: '',
          component: () => import('@/views/admin/AdminDashboardView.vue'),
        },
        {
          path: 'programs',
          component: () => import('@/views/admin/AdminProgramsView.vue'),
        },
        {
          path: 'programs/new',
          component: () => import('@/views/admin/AdminProgramEditView.vue'),
        },
        {
          path: 'programs/:id',
          component: () => import('@/views/admin/AdminProgramEditView.vue'),
        },
        {
          path: 'seasonal',
          component: () => import('@/views/admin/AdminSeasonalView.vue'),
        },
        {
          path: 'income',
          component: () => import('@/views/admin/AdminIncomeView.vue'),
        },
        {
          path: 'administrators',
          component: () => import('@/views/admin/AdminAdministratorsView.vue'),
        },
      ],
    },
    {
      path: '/about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAdminAuth) {
    const token = sessionStorage.getItem('admin_token')
    if (!token) {
      return { path: '/admin/login' }
    }
  }
})

export default router
