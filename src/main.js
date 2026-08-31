import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import './composables/useTheme' // aplica o tema salvo (claro/escuro) assim que o app inicia

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