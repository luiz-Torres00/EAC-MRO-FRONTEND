import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import './composables/useTheme' // aplica o tema salvo (claro/escuro) assim que o app inicia

// SSO: se chegou aqui vindo da Central MRO Ativa (hub), o link já traz os
// tokens de login no fragmento da URL (#sso_access=...&sso_refresh=...) —
// guarda os dois e entra direto, sem passar pela tela de login. Fragmento,
// não query string, de propósito: o navegador nunca manda o fragmento pro
// servidor, só usa ele localmente. Precisa rodar antes do router resolver
// a primeira navegação, por isso fica logo no topo, antes de criar o app.
function consumeSsoTokensFromHash() {
  const hash = window.location.hash
  const accessMatch = hash.match(/[#&]sso_access=([^&]+)/)
  const refreshMatch = hash.match(/[#&]sso_refresh=([^&]+)/)
  if (!accessMatch || !refreshMatch) return

  try {
    localStorage.setItem('access_token', decodeURIComponent(accessMatch[1]))
    localStorage.setItem('refresh_token', decodeURIComponent(refreshMatch[1]))
  } catch (e) {
    // localStorage indisponível — segue sem SSO, cai na tela de login normal.
  }

  // Limpa o fragmento da URL sem recarregar a página (senão os tokens
  // ficam visíveis ali e uma nova visita "reaplicaria" tokens antigos).
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  )
}
consumeSsoTokensFromHash()

// Registra o service worker do PWA e, se detectar que uma versão nova do
// site foi publicada enquanto o app estava aberto no celular, recarrega
// sozinho. Sem isso, quem já tinha o app aberto ficava preso rodando uma
// mistura de código antigo com arquivos novos depois de cada ajuste — foi
// o que causou a tela travada ao abrir "Novo pedido" depois do commit do
// calendário.
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload()
  },
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')