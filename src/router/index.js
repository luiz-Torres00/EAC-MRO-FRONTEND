import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Emprestimos',
        component: () => import('@/views/Emprestimos.vue'),
      },
      {
        path: 'relatorios',
        name: 'Relatorios',
        component: () => import('@/views/Relatorios.vue'),
        meta: { perm: 'rel_ver' },
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { perm: 'dash_ver' },
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('@/views/Usuarios.vue'),
        meta: { perm: 'usr_ver' },
      },
      {
        path: 'notificacoes',
        name: 'Notificacoes',
        component: () => import('@/views/Notificacoes.vue'),
        meta: { perm: 'notif_ver' },
      },
    ],
  },
  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Guard global
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.public) return next()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (to.meta.perm && !auth.perm(to.meta.perm)) {
    return next({ name: 'Emprestimos' })
  }

  // Redireciona da login se já autenticado
  if (to.name === 'Login' && auth.isAuthenticated) {
    return next({ name: 'Emprestimos' })
  }

  next()
})

export default router
