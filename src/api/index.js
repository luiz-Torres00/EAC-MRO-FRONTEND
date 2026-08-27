import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o token JWT em cada requisição
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Renova o token automaticamente em 401
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh/`,
            { refresh }
          )
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Funções auxiliares por domínio ────────────────────────────────────────
export const authApi = {
  login:   (email, senha) => api.post('/auth/login/', { email, password: senha }),
  me:      ()             => api.get('/auth/me/'),
  solicitar: (dados)      => api.post('/auth/solicitar/', dados),
  usuarios:  ()           => api.get('/auth/usuarios/'),
  solicitacoes: ()        => api.get('/auth/solicitacoes/'),
  aprovarSolic:  id       => api.post(`/auth/solicitacoes/${id}/aprovar/`),
  recusarSolic:  id       => api.post(`/auth/solicitacoes/${id}/recusar/`),
  atualizarUsuario: (id, dados) => api.patch(`/auth/usuarios/${id}/`, dados),
  criarUsuario: (dados)   => api.post('/auth/usuarios/criar/', dados),
  cargos:       ()        => api.get('/auth/cargos/'),
  criarCargo:   (dados)   => api.post('/auth/cargos/', dados),
  atualizarCargo: (id, dados) => api.patch(`/auth/cargos/${id}/`, dados),
  deletarCargo: id        => api.delete(`/auth/cargos/${id}/`),
}

export const pedidosApi = {
  listar:   (params)     => api.get('/pedidos/', { params }),
  criar:    (dados)      => api.post('/pedidos/', dados),
  detalhe:  id           => api.get(`/pedidos/${id}/`),
  atualizar: (id, dados) => api.patch(`/pedidos/${id}/`, dados),
  deletar:  id            => api.delete(`/pedidos/${id}/`),
  aprovar:  (id, dados)  => api.patch(`/pedidos/${id}/aprovar/`, dados),
  recusar:  (id, dados)  => api.patch(`/pedidos/${id}/recusar/`, dados),
  devolver: (id, dados)  => api.patch(`/pedidos/${id}/devolver/`, dados),
  confirmarDevolucao: (id, dados) => api.patch(`/pedidos/${id}/confirmar-devolucao/`, dados),
  estender: (id, dados)  => api.patch(`/pedidos/${id}/estender/`, dados),
  abrirOcorrencia: (id, dados) => api.patch(`/pedidos/${id}/ocorrencia/`, dados),
  cobrarDevolucao: (id, dados) => api.post(`/pedidos/${id}/cobrar/`, dados),
  relatorioXlsx: (params) => api.get('/pedidos/relatorio/', { params, responseType: 'blob' }),
}

export const produtosApi = {
  listar: () => api.get('/produtos/'),
}

export const notifApi = {
  listar:       ()  => api.get('/notificacoes/'),
  marcarLida:   id  => api.patch(`/notificacoes/${id}/lida/`),
  marcarTodas:  ()  => api.patch('/notificacoes/marcar-todas/'),
}