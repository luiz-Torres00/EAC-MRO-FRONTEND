<template>
  <div class="app">
    <!-- ══ SIDEBAR ══ -->
    <aside :class="['sidebar', { collapsed }]">
      <!-- Botão recolher -->
      <button class="sidebar-toggle-btn" @click="collapsed = !collapsed"
        :title="collapsed ? 'Expandir menu' : 'Recolher menu'">
        <IconChevron />
      </button>

      <!-- Marca -->
      <div class="sidebar-brand">
        <LogoMRO />
        <div class="sidebar-collapsible">
          <div class="logo-tagline">nós ativamos a <span>eficiência</span></div>
        </div>
      </div>

      <!-- Nav -->
      <div class="sidebar-app-label sidebar-collapsible">Sistema</div>

      <nav class="nav-list">
        <RouterLink to="/" end class="nav-item" :class="{ active: route.path === '/' }" title="Controle EAC">
          <IconEAC />
          <span class="nav-label sidebar-collapsible">EAC</span>
        </RouterLink>

        <RouterLink v-if="auth.perm('notif_ver')" to="/notificacoes"
          class="nav-item" :class="{ active: route.path === '/notificacoes' }" title="Notificações">
          <IconNotif />
          <span class="nav-label sidebar-collapsible">Notificações</span>
          <span v-if="unreadCount" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </RouterLink>

        <RouterLink v-if="auth.perm('dash_ver')" to="/dashboard"
          class="nav-item" :class="{ active: route.path === '/dashboard' }" title="Dashboard">
          <IconRelatorios />
          <span class="nav-label sidebar-collapsible">Dashboard</span>
        </RouterLink>

        <RouterLink v-if="auth.perm('rel_ver')" to="/relatorios"
          class="nav-item" :class="{ active: route.path === '/relatorios' }" title="Relatórios">
          <IconRelatorios />
          <span class="nav-label sidebar-collapsible">Relatórios</span>
        </RouterLink>

        <RouterLink v-if="auth.perm('usr_ver')" to="/usuarios"
          class="nav-item" :class="{ active: route.path === '/usuarios' }" title="Usuários">
          <IconUsuarios />
          <span class="nav-label sidebar-collapsible">Usuários</span>
        </RouterLink>
      </nav>

      <!-- Footer com usuário -->
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">{{ iniciais }}</div>
          <template v-if="!collapsed">
            <div style="flex:1;min-width:0">
              <div class="user-name">{{ auth.user?.nome || auth.user?.email }}</div>
              <div class="user-role">{{ auth.user?.cargo || 'Usuário' }}</div>
            </div>
          </template>
          <button @click="handleLogout" title="Sair" class="logout-btn">
            <IconSair />
          </button>
        </div>
      </div>
    </aside>

    <!-- ══ MAIN ══ -->
    <div class="main">
      <!-- Topbar -->
      <div class="topbar">
        <h2>{{ pageTitle }}</h2>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="theme-toggle-btn" @click="alternarTema" :title="theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'">
            <IconSol v-if="theme === 'dark'" />
            <IconLua v-else />
          </button>
          <span class="topbar-date">{{ hoje }}</span>
        </div>
      </div>

      <div class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { notifApi } from '@/api'

const auth     = useAuthStore()
const route    = useRoute()
const router   = useRouter()
const collapsed = ref(false)

const { theme, alternar: alternarTema } = useTheme()

const TITLES = {
  '/':             'Controle EAC — Empréstimos',
  '/relatorios':   'Relatórios',
  '/dashboard':    'Dashboard',
  '/usuarios':     'Usuários & Permissões',
  '/notificacoes': 'Notificações',
}
const pageTitle = computed(() => TITLES[route.path] || 'MRO — Controle')

const hoje = new Date().toLocaleDateString('pt-BR', {
  weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
})

const iniciais = computed(() => {
  const nome = auth.user?.nome || auth.user?.email || '?'
  return nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ── Notificações: badge com contagem + som quando chega algo novo ─────────
const unreadCount = ref(0)
let poller = null

function tocarBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    // navegador pode bloquear áudio antes de qualquer interação do usuário — ok ignorar
  }
}

async function checarNotificacoes() {
  if (!auth.isAuthenticated) return
  try {
    const res = await notifApi.listar()
    const naoLidas = res.data.filter(n => !n.lida).length
    if (naoLidas > unreadCount.value) tocarBeep()
    unreadCount.value = naoLidas
  } catch {
    // silencioso — não quebra a navegação por causa do polling
  }
}

onMounted(() => {
  checarNotificacoes()
  poller = setInterval(checarNotificacoes, 20000)
})
onUnmounted(() => {
  if (poller) clearInterval(poller)
})
</script>

<!-- Ícones como componentes locais (SVG inline) -->
<script>
// Componentes de ícone registrados globalmente via provide ou localmente
import { defineComponent, h } from 'vue'
import { useTheme } from '@/composables/useTheme'
import logoMroDarkUrl from '@/assets/logo-mro.png'
import logoMroLightUrl from '@/assets/logo-mro-light.png'

// Fundo transparente nas duas versões: a escura (texto branco) é usada no
// modo escuro, a clara (texto azul-marinho da marca) no modo claro — senão
// o texto branco some numa sidebar clara. O "O" verde é igual nas duas.
const { theme: temaLogo } = useTheme()

const IconEAC = defineComponent({
  render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.5', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('path',{ d:'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
    h('polyline',{ points:'3.27 6.96 12 12.01 20.73 6.96' }),
    h('line',{ x1:'12', y1:'22.08', x2:'12', y2:'12' }),
  ])
})
const IconRelatorios = defineComponent({
  render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.5', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('line',{ x1:'18', y1:'20', x2:'18', y2:'10' }),
    h('line',{ x1:'12', y1:'20', x2:'12', y2:'4' }),
    h('line',{ x1:'6',  y1:'20', x2:'6',  y2:'14' }),
  ])
})
const IconUsuarios = defineComponent({
  render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.5', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('path',{ d:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
    h('circle',{ cx:'9', cy:'7', r:'4' }),
    h('path',{ d:'M23 21v-2a4 4 0 0 0-3-3.87' }),
    h('path',{ d:'M16 3.13a4 4 0 0 1 0 7.75' }),
  ])
})
const IconNotif = defineComponent({
  render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.5', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('path',{ d:'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
    h('path',{ d:'M13.73 21a2 2 0 0 1-3.46 0' }),
  ])
})
const IconSair = defineComponent({
  render: () => h('svg', { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.5', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('path',{ d:'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }),
    h('polyline',{ points:'16 17 21 12 16 7' }),
    h('line',{ x1:'21', y1:'12', x2:'9', y2:'12' }),
  ])
})
const IconChevron = defineComponent({
  render: () => h('svg', { width:'14', height:'14', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'2.2', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('polyline',{ points:'15 18 9 12 15 6' }),
  ])
})
const IconSol = defineComponent({
  render: () => h('svg', { width:'16', height:'16', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.8', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('circle',{ cx:'12', cy:'12', r:'4.5' }),
    h('line',{ x1:'12', y1:'2',  x2:'12', y2:'4.5' }),
    h('line',{ x1:'12', y1:'19.5', x2:'12', y2:'22' }),
    h('line',{ x1:'2',  y1:'12', x2:'4.5', y2:'12' }),
    h('line',{ x1:'19.5', y1:'12', x2:'22', y2:'12' }),
    h('line',{ x1:'4.9',  y1:'4.9',  x2:'6.6',  y2:'6.6' }),
    h('line',{ x1:'17.4', y1:'17.4', x2:'19.1', y2:'19.1' }),
    h('line',{ x1:'4.9',  y1:'19.1', x2:'6.6',  y2:'17.4' }),
    h('line',{ x1:'17.4', y1:'6.6',  x2:'19.1', y2:'4.9' }),
  ])
})
const IconLua = defineComponent({
  render: () => h('svg', { width:'16', height:'16', viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:'1.8', strokeLinecap:'round', strokeLinejoin:'round' }, [
    h('path',{ d:'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' }),
  ])
})
const LogoMRO = defineComponent({
  render: () => h('div', { class:'logo-mro' }, [
    h('img', {
      class: 'logo-mro-img',
      src: temaLogo.value === 'light' ? logoMroLightUrl : logoMroDarkUrl,
      alt: 'MRO',
    }),
  ])
})

export { IconEAC, IconRelatorios, IconUsuarios, IconNotif, IconSair, IconChevron, IconSol, IconLua, LogoMRO }
</script>

<style scoped>
.logout-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color .15s;
  flex-shrink: 0;
}
/* Sem isso, o <svg> do ícone não tem width/height definidos e o navegador
   usa o tamanho padrão (300x150) — o botão ficava enorme e cortado pelo
   overflow:hidden da sidebar, então na prática "sumia" da tela. */
.logout-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
.logout-btn:hover { color: var(--red); }

.theme-toggle-btn {
  background: transparent;
  border: 1px solid var(--border-s);
  color: var(--muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .15s, border-color .15s, background .15s;
}
.theme-toggle-btn svg { width: 15px; height: 15px; }
.theme-toggle-btn:hover { color: var(--verde); border-color: var(--verde); background: var(--verde-dim); }

.page-fade-enter-active, .page-fade-leave-active { transition: opacity .18s ease, transform .18s ease; }
.page-fade-enter-from { opacity: 0; transform: translateY(6px); }
.page-fade-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
