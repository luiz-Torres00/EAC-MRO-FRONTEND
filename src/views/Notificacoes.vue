<template>
  <div>
    <div class="section-header">
      <h3 style="font-size:14px;font-weight:700;color:var(--text)">Notificações</h3>
      <button
        v-if="notifs.some(n => !n.lida)"
        class="btn btn-ghost btn-sm"
        @click="marcarTodas"
        :disabled="marcando"
      >
        {{ marcando ? 'Marcando…' : '✓ Marcar todas como lidas' }}
      </button>
    </div>

    <div v-if="loading" class="loading-full" style="height:200px">Carregando…</div>
    <div v-else-if="error" style="color:var(--red);padding:20px">{{ error }}</div>

    <div v-else>
      <div v-if="!notifs.length" class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p>Sem notificações</p>
        <small>Você está em dia por aqui.</small>
      </div>

      <div v-else class="notif-list">
        <div
          v-for="n in notifs"
          :key="n.id"
          :class="['notif-item', { unread: !n.lida }]"
          @click="abrir(n)"
          style="cursor:pointer"
          title="Clique para ver o pedido relacionado"
        >
          <div :class="['notif-icon', iconClass(n.tipo)]">
            {{ iconEmoji(n.tipo) }}
          </div>
          <div class="notif-body">
            <div class="notif-title">{{ n.titulo }}</div>
            <div class="notif-sub">{{ n.mensagem }}</div>
          </div>
          <div class="notif-time">{{ fmtTempo(n.criado_em) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notifApi } from '@/api'

const router  = useRouter()
const notifs  = ref([])
const loading = ref(false)
const error   = ref(null)
const marcando = ref(false)

async function carregar() {
  loading.value = true
  error.value   = null
  try {
    const res = await notifApi.listar()
    notifs.value = res.data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function marcarLida(n) {
  if (n.lida) return
  try {
    await notifApi.marcarLida(n.id)
    n.lida = true
  } catch { /* silencia */ }
}

async function abrir(n) {
  await marcarLida(n)
  if (n.pedido_id) {
    router.push({ path: '/', query: { pedido: n.pedido_id } })
  }
}

async function marcarTodas() {
  marcando.value = true
  try {
    await notifApi.marcarTodas()
    notifs.value.forEach(n => { n.lida = true })
  } catch (e) {
    alert('Erro: ' + e.message)
  } finally {
    marcando.value = false
  }
}

function iconClass(tipo) {
  const map = {
    pedido_aprovado:  'ok',
    pedido_recusado:  'no',
    pedido_devolvido: 'devol',
    atraso:           'alerta',
    pedido_novo:      'pedido',
    sistema:          'pedido',
  }
  return map[tipo] || 'pedido'
}

function iconEmoji(tipo) {
  const map = {
    pedido_aprovado:  '✅',
    pedido_recusado:  '❌',
    pedido_devolvido: '📦',
    atraso:           '⏰',
    pedido_novo:      '📋',
    sistema:          '🔔',
  }
  return map[tipo] || '🔔'
}

function fmtTempo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const agora = new Date()
  const diff = Math.floor((agora - d) / 1000)
  if (diff < 60)   return 'Agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('pt-BR')
}

onMounted(carregar)
</script>
