import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user         = ref(null)
  const accessToken  = ref(localStorage.getItem('access_token')  || null)
  const refreshToken = ref(localStorage.getItem('refresh_token') || null)
  const loading      = ref(false)

  const isAuthenticated = computed(() => !!accessToken.value)

  /** Verifica se o usuário tem uma permissão específica */
  function perm(key) {
    if (!user.value) return false
    if (user.value.is_staff) return true
    return !!(user.value.perms?.[key])
  }

  async function login(email, senha) {
    loading.value = true
    try {
      const { data } = await authApi.login(email, senha)
      accessToken.value  = data.access
      refreshToken.value = data.refresh
      localStorage.setItem('access_token',  data.access)
      localStorage.setItem('refresh_token', data.refresh)
      await fetchMe()
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    try {
      const { data } = await authApi.me()
      user.value = data
    } catch {
      logout()
    }
  }

  function logout() {
    user.value         = null
    accessToken.value  = null
    refreshToken.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // Restaura sessão no reload
  if (accessToken.value && !user.value) {
    fetchMe()
  }

  return { user, accessToken, isAuthenticated, loading, perm, login, logout, fetchMe }
})
