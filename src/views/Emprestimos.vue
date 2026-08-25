<template>
  <div>
    <!-- ── Tabs + Novo pedido ── -->
    <div class="section-header">
      <div class="module-tabs">
        <div v-for="t in TABS" :key="t"
          :class="['module-tab', { active: tab === t }]"
          @click="mudarTab(t)">
          {{ t }}
          <span v-if="t === 'Pendentes' && nPendentes > 0" class="badge-pendente">
            {{ nPendentes }}
          </span>
        </div>
      </div>
      <button v-if="auth.perm('eac_criar')" class="btn btn-primary" @click="modalNovo = true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Novo pedido
      </button>
    </div>

    <!-- ── Busca ── -->
    <div class="busca-autocomplete">
      <div class="busca-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="busca-input" type="text" v-model="busca"
          placeholder="Buscar por conteúdo, nome, e-mail ou código…"
          @input="pagina = 1"
          autocomplete="off" />
        <button v-if="busca" type="button" @click="busca = ''" class="busca-clear">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- ── Loading / Erro ── -->
    <div v-if="loading" class="loading-full">
      <div style="text-align:center"><div style="font-size:24px;margin-bottom:8px">🔄</div>Carregando pedidos…</div>
    </div>
    <div v-else-if="error" style="color:var(--red);padding:20px">Erro: {{ error }}</div>

    <!-- ── Lista ── -->
    <template v-else>
      <!-- Empty state -->
      <div v-if="pedidosFiltrados.length === 0" class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <p>{{ busca ? 'Nenhum pedido encontrado para essa busca.' : 'Nenhum pedido' + (tab !== 'Todos' ? ' nessa categoria.' : '.') }}</p>
        <small>{{ busca ? 'Tente outros termos.' : 'Novos pedidos aparecerão aqui.' }}</small>
      </div>

      <template v-else>
        <div class="pedido-list">
          <PedidoCard
            v-for="p in pedidosPagina" :key="p.id"
            :p="p"
            :auth="auth"
            @detalhe="modalDetalhe = $event"
            @aprovar="modalAprovar = $event"
            @recusar="modalRecusar = $event"
            @devolver="modalDevolver = $event"
            @estender="modalEstender = $event"
            @editar-numero="modalEditarNumero = $event"
            @excluir="excluirPedido"
          />
        </div>

        <!-- Paginação -->
        <Paginacao
          v-if="totalPaginas > 1 || pedidosFiltrados.length > 12"
          :total="pedidosFiltrados.length"
          v-model:itensPorPagina="itensPorPagina"
          v-model:pagina="pagina"
        />
      </template>
    </template>

    <!-- ══ MODAIS ══ -->
    <ModalNovoPedido v-if="modalNovo"
      @close="modalNovo = false"
      @salvo="() => { modalNovo = false; carregar() }" />

    <ModalDetalhe v-if="modalDetalhe"
      :pedido="modalDetalhe"
      @close="modalDetalhe = null" />

    <ModalAprovar v-if="modalAprovar"
      :pedido="modalAprovar"
      @close="modalAprovar = null"
      @feito="() => { modalAprovar = null; carregar() }" />

    <ModalRecusar v-if="modalRecusar"
      :pedido="modalRecusar"
      @close="modalRecusar = null"
      @feito="() => { modalRecusar = null; carregar() }" />

    <ModalDevolver v-if="modalDevolver"
      :pedido="modalDevolver"
      @close="modalDevolver = null"
      @feito="() => { modalDevolver = null; carregar() }" />

    <ModalEstender v-if="modalEstender"
      :pedido="modalEstender"
      @close="modalEstender = null"
      @feito="() => { modalEstender = null; carregar() }" />

    <ModalEditarNumero v-if="modalEditarNumero"
      :pedido="modalEditarNumero"
      @close="modalEditarNumero = null"
      @feito="() => { modalEditarNumero = null; carregar() }" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { pedidosApi } from '@/api'
import PedidoCard      from '@/components/PedidoCard.vue'
import Paginacao       from '@/components/Paginacao.vue'
import ModalNovoPedido from '@/components/modals/ModalNovoPedido.vue'
import ModalDetalhe    from '@/components/modals/ModalDetalhe.vue'
import ModalAprovar    from '@/components/modals/ModalAprovar.vue'
import ModalRecusar    from '@/components/modals/ModalRecusar.vue'
import ModalDevolver   from '@/components/modals/ModalDevolver.vue'
import ModalEstender   from '@/components/modals/ModalEstender.vue'
import ModalEditarNumero from '@/components/modals/ModalEditarNumero.vue'

const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()

const TABS = ['Todos', 'Pendentes', 'Aprovados', 'Devoluções', 'Recusados']
const TAB_STATUS = {
  'Todos': '', 'Pendentes': 'pendente', 'Aprovados': 'aprovado',
  'Devoluções': 'devolvido', 'Recusados': 'recusado',
}

const tab             = ref('Todos')
const busca           = ref('')
const pagina          = ref(1)
const itensPorPagina  = ref(12)

const todosPedidos    = ref([])
const loading         = ref(false)
const error           = ref(null)

// Modais
const modalNovo     = ref(false)
const modalDetalhe  = ref(null)
const modalAprovar  = ref(null)
const modalRecusar  = ref(null)
const modalDevolver = ref(null)
const modalEstender = ref(null)
const modalEditarNumero = ref(null)

async function carregar() {
  loading.value = true
  error.value   = null
  try {
    const { data } = await pedidosApi.listar({ page_size: 500 })
    todosPedidos.value = Array.isArray(data) ? data : (data.results || [])
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function excluirPedido(p) {
  if (!confirm(`Excluir o pedido "${p.produto}" (${p.codigo})? Essa ação não pode ser desfeita.`)) return
  try {
    await pedidosApi.deletar(p.id)
    await carregar()
  } catch (e) {
    alert('Erro ao excluir: ' + (e.response?.data?.detail || e.message))
  }
}

onMounted(async () => {
  await carregar()
  // Veio de um clique numa notificação (ver Notificacoes.vue) — abre o
  // detalhe do pedido relacionado direto, mesmo que ele não esteja na
  // página atual da lista.
  const pedidoId = route.query.pedido
  if (pedidoId) {
    try {
      const { data } = await pedidosApi.detalhe(pedidoId)
      modalDetalhe.value = data
    } catch { /* pedido pode ter sido removido — ignora */ }
    router.replace({ path: '/' })
  }
})

const pedidosFiltrados = computed(() => {
  let lista = todosPedidos.value
  const statusFiltro = TAB_STATUS[tab.value]
  if (statusFiltro) lista = lista.filter(p => p.status === statusFiltro)
  if (busca.value) {
    const q = busca.value.toLowerCase()
    lista = lista.filter(p =>
      (p.produto              || '').toLowerCase().includes(q) ||
      (p.solicitante_nome     || '').toLowerCase().includes(q) ||
      (p.solicitante_email    || '').toLowerCase().includes(q) ||
      (p.concedente_nome      || '').toLowerCase().includes(q) ||
      (p.concedente_email     || '').toLowerCase().includes(q) ||
      String(p.numero_pedido  || '').toLowerCase().includes(q) ||
      (p.codigo               || '').toLowerCase().includes(q)
    )
  }
  // Ordena por urgência: quem tem prazo de devolução mais próximo (ou já
  // vencido) aparece primeiro. Pedidos ativos sem prazo ou já encerrados
  // (devolvido/recusado/cancelado) ficam depois, dos mais recentes pros
  // mais antigos.
  const ATIVOS = ['pendente', 'aprovado', 'aguardando_devolucao']
  return [...lista].sort((a, b) => {
    const aUrgente = ATIVOS.includes(a.status) && a.dev_iso
    const bUrgente = ATIVOS.includes(b.status) && b.dev_iso
    if (aUrgente && bUrgente) return new Date(a.dev_iso) - new Date(b.dev_iso)
    if (aUrgente && !bUrgente) return -1
    if (!aUrgente && bUrgente) return 1
    return new Date(b.criado_em) - new Date(a.criado_em)
  })
})

const nPendentes   = computed(() => todosPedidos.value.filter(p => p.status === 'pendente').length)
const totalPaginas = computed(() => Math.max(1, Math.ceil(pedidosFiltrados.value.length / itensPorPagina.value)))
const pedidosPagina = computed(() => {
  const start = (pagina.value - 1) * itensPorPagina.value
  return pedidosFiltrados.value.slice(start, start + itensPorPagina.value)
})

function mudarTab(t) {
  tab.value   = t
  pagina.value = 1
}

watch([busca, itensPorPagina], () => { pagina.value = 1 })
</script>
