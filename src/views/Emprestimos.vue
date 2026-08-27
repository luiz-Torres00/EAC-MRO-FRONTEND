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

    <!-- Filtro que veio de um clique no Dashboard/Relatórios (MG, atrasados,
         ocorrência ou status sem aba própria) — some sozinho ao trocar de
         aba, mas como não tem um controle visual próprio, mostra esse chip
         pra pessoa saber que a lista está filtrada e poder limpar. -->
    <div v-if="filtroExtraDescricao" style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <span style="display:inline-flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border-s);border-radius:99px;padding:4px 6px 4px 12px;font-size:11px;font-weight:600;color:var(--text)">
        Filtro: {{ filtroExtraDescricao }}
        <button type="button" @click="limparFiltroExtra"
          style="background:transparent;border:none;color:var(--muted);cursor:pointer;font-size:13px;padding:2px 6px;line-height:1">✕</button>
      </span>
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
            @confirmar-devolucao="modalConfirmarDevolucao = $event"
            @estender="modalEstender = $event"
            @ocorrencia="modalOcorrencia = $event"
            @cobrar="modalCobranca = $event"
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

    <ModalConfirmarDevolucao v-if="modalConfirmarDevolucao"
      :pedido="modalConfirmarDevolucao"
      @close="modalConfirmarDevolucao = null"
      @feito="() => { modalConfirmarDevolucao = null; carregar() }" />

    <ModalEstender v-if="modalEstender"
      :pedido="modalEstender"
      @close="modalEstender = null"
      @feito="() => { modalEstender = null; carregar() }" />

    <ModalOcorrencia v-if="modalOcorrencia"
      :pedido="modalOcorrencia"
      @close="modalOcorrencia = null"
      @feito="() => { modalOcorrencia = null; carregar() }" />

    <ModalCobranca v-if="modalCobranca"
      :pedido="modalCobranca"
      @close="modalCobranca = null"
      @feito="() => { modalCobranca = null; carregar() }" />

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
import ModalConfirmarDevolucao from '@/components/modals/ModalConfirmarDevolucao.vue'
import ModalEstender   from '@/components/modals/ModalEstender.vue'
import ModalOcorrencia from '@/components/modals/ModalOcorrencia.vue'
import ModalCobranca   from '@/components/modals/ModalCobranca.vue'
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
const modalConfirmarDevolucao = ref(null)
const modalEstender = ref(null)
const modalOcorrencia = ref(null)
const modalCobranca = ref(null)
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

// Os 4 status abaixo já têm aba própria — um clique vindo do Dashboard/
// Relatórios pra um desses só troca de aba (reaproveita o filtro que já
// existe). Os demais (aguardando_devolucao, cancelado, ou combinações tipo
// "ativos" = aprovado + aguardando_devolucao) não têm aba dedicada, então
// usam o filtro avulso abaixo.
const STATUS_PARA_ABA = {
  pendente: 'Pendentes', aprovado: 'Aprovados',
  devolvido: 'Devoluções', recusado: 'Recusados',
}
const LABEL_STATUS = {
  pendente: 'Pendente', aprovado: 'Aprovado', aguardando_devolucao: 'Ag. devolução',
  devolvido: 'Devolvido', recusado: 'Recusado', cancelado: 'Cancelado',
}

const statusFiltroExtra     = ref([])   // ?status= sem aba própria
const mgFiltroExtra         = ref('')   // ?mg=
const atrasadoFiltroExtra   = ref(false) // ?atrasado=1
const ocorrenciaFiltroExtra = ref(false) // ?ocorrencia=1

function limparFiltroExtra() {
  statusFiltroExtra.value = []
  mgFiltroExtra.value = ''
  atrasadoFiltroExtra.value = false
  ocorrenciaFiltroExtra.value = false
}

const filtroExtraDescricao = computed(() => {
  const partes = []
  if (statusFiltroExtra.value.length) {
    partes.push(statusFiltroExtra.value.map(s => LABEL_STATUS[s] || s).join(' + '))
  }
  if (mgFiltroExtra.value) partes.push('MG: ' + mgFiltroExtra.value)
  if (atrasadoFiltroExtra.value) partes.push('Atrasados')
  if (ocorrenciaFiltroExtra.value) partes.push('Com ocorrência')
  return partes.join(' · ')
})

onMounted(async () => {
  await carregar()

  const q = route.query
  let veioDeLink = false

  // Veio de um clique numa notificação (ver Notificacoes.vue) — abre o
  // detalhe do pedido relacionado direto, mesmo que ele não esteja na
  // página atual da lista. Também usado pelos links "ver pedido" do
  // Dashboard/Relatórios (ex: linha de um atraso ou de uma ocorrência).
  if (q.pedido) {
    try {
      const { data } = await pedidosApi.detalhe(q.pedido)
      modalDetalhe.value = data
    } catch { /* pedido pode ter sido removido — ignora */ }
    veioDeLink = true
  }

  // Veio de um clique no Dashboard/Relatórios — reaplica o mesmo filtro
  // aqui, contra os dados reais da lista de Empréstimos.
  if (q.busca) {
    busca.value = String(q.busca)
    veioDeLink = true
  }
  if (q.status) {
    const statuses = String(q.status).split(',').filter(Boolean)
    if (statuses.length === 1 && STATUS_PARA_ABA[statuses[0]]) {
      tab.value = STATUS_PARA_ABA[statuses[0]]
    } else if (statuses.length) {
      statusFiltroExtra.value = statuses
    }
    veioDeLink = true
  }
  if (q.mg) {
    mgFiltroExtra.value = String(q.mg)
    veioDeLink = true
  }
  if (q.atrasado) {
    atrasadoFiltroExtra.value = true
    veioDeLink = true
  }
  if (q.ocorrencia) {
    ocorrenciaFiltroExtra.value = true
    veioDeLink = true
  }

  if (veioDeLink) router.replace({ path: '/' })
})

const pedidosFiltrados = computed(() => {
  let lista = todosPedidos.value

  if (statusFiltroExtra.value.length) {
    lista = lista.filter(p => statusFiltroExtra.value.includes(p.status))
  } else {
    const statusFiltro = TAB_STATUS[tab.value]
    if (statusFiltro) lista = lista.filter(p => p.status === statusFiltro)
  }

  if (mgFiltroExtra.value) {
    lista = mgFiltroExtra.value === '(sem MG)'
      ? lista.filter(p => !p.mg_concedente && !p.mg_solicitante)
      : lista.filter(p => (p.mg_concedente || p.mg_solicitante) === mgFiltroExtra.value)
  }

  if (atrasadoFiltroExtra.value) {
    const agora = new Date()
    lista = lista.filter(p =>
      ['aprovado', 'aguardando_devolucao'].includes(p.status) &&
      p.dev_iso && new Date(p.dev_iso) < agora
    )
  }

  if (ocorrenciaFiltroExtra.value) {
    lista = lista.filter(p => !!p.ocorrencia)
  }

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
  // Troca manual de aba encerra qualquer filtro que tenha vindo de um link
  // do Dashboard/Relatórios — evita um filtro invisível ficar preso na lista.
  limparFiltroExtra()
}

watch([busca, itensPorPagina], () => { pagina.value = 1 })
</script>