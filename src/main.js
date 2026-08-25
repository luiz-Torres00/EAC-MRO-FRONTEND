import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import './composables/useTheme' // aplica o tema salvo (claro/escuro) assim que o app inicia

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
