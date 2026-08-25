<template>
  <div class="dash-compact">
    <div class="section-header">
      <h3 style="font-size:14px;font-weight:700;color:var(--text)">Dashboard — Visão executiva</h3>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select v-model="mgFiltro" class="paginacao-select" style="padding:6px 10px">
          <option value="">Todos os MGs</option>
          <option v-for="mg in MG_OPCOES" :key="mg" :value="mg">{{ mg }}</option>
        </select>

        <select v-model="periodo" class="paginacao-select" style="padding:6px 10px" :disabled="intervaloAtivo">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
          <option value="">Tudo</option>
        </select>

        <div style="position:relative">
          <button
            class="btn btn-sm"
            :class="intervaloAtivo ? 'btn-primary' : ''"
            :style="intervaloAtivo ? '' : 'border:1px solid var(--border);background:var(--card);color:var(--text)'"
            @click="mostrarCalendario = !mostrarCalendario"
          >
            📅 {{ intervaloAtivo ? fmtData(dataInicio) + ' – ' + fmtData(dataFim) : 'Selecionar data' }}
          </button>
          <div v-if="mostrarCalendario" style="position:absolute;top:calc(100% + 6px);left:0;z-index:40;width:280px">
            <CalendarioRange v-model:inicio="dataInicio" v-model:fim="dataFim" />
            <div style="margin-top:6px;display:flex;justify-content:flex-end">
              <button class="btn btn-primary btn-sm" @click="mostrarCalendario = false">Fechar</button>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-sm" @click="carregar" :disabled="loading">
          {{ loading ? 'Carregando…' : '↺ Atualizar' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-full" style="height:200px">Carregando…</div>
    <div v-else-if="error" style="color:var(--red);padding:20px">{{ error }}</div>

    <div v-else>
      <!-- KPIs -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Total de pedidos</div>
          <div class="kpi-value" style="color:var(--text)">{{ kpi.total }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Empréstimos ativos</div>
          <div class="kpi-value indigo">{{ kpi.ativos }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Atrasados agora</div>
          <div class="kpi-value red">{{ kpi.atrasados }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Taxa de aprovação</div>
          <div class="kpi-value verde">{{ kpi.taxaAprovacao }}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tempo médio de devolução</div>
          <div class="kpi-value amber">{{ kpi.tempoMedioDias }}d</div>
        </div>
      </div>

      <div class="dash-grid dash-grid-compact">
        <div class="dash-card" style="grid-column: span 2">
          <h4>Pedidos ao longo do tempo</h4>
          <div style="position:relative;height:130px">
            <canvas ref="canvasLinha"></canvas>
          </div>
        </div>

        <div class="dash-card">
          <h4>Distribuição por status</h4>
          <div style="position:relative;height:130px">
            <canvas ref="canvasStatus"></canvas>
          </div>
        </div>

        <div class="dash-card">
          <h4>Pedidos por MG</h4>
          <div style="position:relative;height:130px">
            <canvas ref="canvasMg"></canvas>
          </div>
        </div>

        <div class="dash-card">
          <h4>Top 10 materiais mais solicitados</h4>
          <div style="position:relative;height:150px">
            <canvas ref="canvasMateriais"></canvas>
          </div>
        </div>

        <div class="dash-card">
          <h4>Ranking — quem mais solicita</h4>
          <div v-if="!ranking.solicitantes.length" style="color:var(--muted);font-size:12px">Sem dados</div>
          <div v-else style="max-height:150px;overflow-y:auto">
            <table class="tabela">
              <thead><tr><th>Solicitante</th><th style="text-align:right">Pedidos</th></tr></thead>
              <tbody>
                <tr v-for="r in ranking.solicitantes" :key="r.nome">
                  <td>{{ r.nome }}</td>
                  <td style="text-align:right;font-weight:700">{{ r.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dash-card">
          <h4>Ranking — quem mais empresta</h4>
          <div v-if="!ranking.concedentes.length" style="color:var(--muted);font-size:12px">Sem dados</div>
          <div v-else style="max-height:150px;overflow-y:auto">
            <table class="tabela">
              <thead><tr><th>Concedente</th><th style="text-align:right">Pedidos</th></tr></thead>
              <tbody>
                <tr v-for="r in ranking.concedentes" :key="r.nome">
                  <td>{{ r.nome }}</td>
                  <td style="text-align:right;font-weight:700">{{ r.total }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dash-card" style="grid-column: span 2">
          <h4>Empréstimos atrasados</h4>
          <div v-if="!atrasados.length" style="color:var(--muted);font-size:12px">Nenhum atraso no momento 🎉</div>
          <div v-else style="max-height:150px;overflow-y:auto">
            <table class="tabela">
              <thead>
                <tr>
                  <th>Material</th><th>Solicitante → Concedente</th><th>MG</th>
                  <th>Devolução prevista</th><th style="text-align:right">Dias em atraso</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in atrasados" :key="p.id">
                  <td>{{ p.produto }}</td>
                  <td>{{ p.solicitante_nome }} → {{ p.concedente_nome }}</td>
                  <td>{{ p.mg_concedente || p.mg_solicitante || '—' }}</td>
                  <td>{{ fmtData(p.dev_iso) }}</td>
                  <td style="text-align:right;font-weight:700;color:var(--red)">{{ diasAtraso(p.dev_iso) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { pedidosApi } from '@/api'
import Chart from 'chart.js/auto'
import CalendarioRange from '@/components/CalendarioRange.vue'

const periodo  = ref('30')
const loading  = ref(false)
const error    = ref(null)
const pedidos  = ref([])

// Mesmos filtros de MG e intervalo de datas usados em Relatórios — para que
// o dashboard reflita a mesma fatia de dados que a pessoa está analisando lá.
const MG_OPCOES = ['MG1', 'MG2', 'MG3', 'MG4', 'Cenografia', 'Arte']
const mgFiltro  = ref('')
const dataInicio       = ref('')
const dataFim          = ref('')
const mostrarCalendario = ref(false)
const intervaloAtivo   = computed(() => !!(dataInicio.value && dataFim.value))

const kpi = ref({ total: 0, ativos: 0, atrasados: 0, taxaAprovacao: 0, tempoMedioDias: 0 })
const ranking   = ref({ solicitantes: [], concedentes: [] })
const atrasados = ref([])

const canvasLinha     = ref(null)
const canvasStatus    = ref(null)
const canvasMg        = ref(null)
const canvasMateriais = ref(null)
let chartLinha = null, chartStatus = null, chartMg = null, chartMateriais = null

const CORES_STATUS = {
  pendente:              '#f5a524',
  aprovado:              '#00ce7c',
  aguardando_devolucao:  '#6b82c4',
  devolvido:             '#8b93a7',
  recusado:              '#e5484d',
  cancelado:             '#5c6270',
}
const LABEL_STATUS = {
  pendente: 'Pendente', aprovado: 'Aprovado', aguardando_devolucao: 'Ag. Devolução',
  devolvido: 'Devolvido', recusado: 'Recusado', cancelado: 'Cancelado',
}

function fmtData(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

function diasAtraso(devIso) {
  if (!devIso) return 0
  const hoje = new Date()
  const dev  = new Date(devIso)
  const diff = Math.floor((hoje - dev) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function paramsFiltro() {
  const params = {}
  if (intervaloAtivo.value) {
    params.data_inicio = dataInicio.value
    params.data_fim    = dataFim.value
  } else if (periodo.value) {
    params.periodo = periodo.value
  }
  if (mgFiltro.value) params.mg = mgFiltro.value
  return params
}

async function carregar() {
  loading.value = true
  error.value   = null
  try {
    const res = await pedidosApi.listar(paramsFiltro())
    pedidos.value = res.data
    calcular()
    // Os canvases só existem no DOM depois que `loading` vira false (ficam
    // dentro do v-else) — precisa soltar o loading ANTES do nextTick, senão
    // os refs dos <canvas> ainda estão null quando o Chart.js tenta usá-los.
    loading.value = false
    await nextTick()
    desenharGraficos()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function calcular() {
  const lista = pedidos.value
  const total = lista.length
  const ativos = lista.filter(p => ['aprovado', 'aguardando_devolucao'].includes(p.status)).length
  const atrasadosLista = lista.filter(p =>
    ['aprovado', 'aguardando_devolucao'].includes(p.status) &&
    p.dev_iso && new Date(p.dev_iso) < new Date()
  )
  const aprovados = lista.filter(p => ['aprovado', 'aguardando_devolucao', 'devolvido'].includes(p.status)).length
  const taxaAprovacao = total ? Math.round((aprovados / total) * 100) : 0

  const devolvidos = lista.filter(p => p.status === 'devolvido' && p.devolvido_em && p.criado_em)
  const tempoMedioDias = devolvidos.length
    ? Math.round(
        devolvidos.reduce((acc, p) => acc + (new Date(p.devolvido_em) - new Date(p.criado_em)) / 86400000, 0)
        / devolvidos.length
      )
    : 0

  kpi.value = { total, ativos, atrasados: atrasadosLista.length, taxaAprovacao, tempoMedioDias }
  atrasados.value = atrasadosLista.sort((a, b) => new Date(a.dev_iso) - new Date(b.dev_iso)).slice(0, 20)

  // Rankings
  const porSolic = {}, porConced = {}
  lista.forEach(p => {
    const sn = p.solicitante_nome || '(sem nome)'
    const cn = p.concedente_nome  || '(sem nome)'
    porSolic[sn]  = (porSolic[sn]  || 0) + 1
    porConced[cn] = (porConced[cn] || 0) + 1
  })
  ranking.value = {
    solicitantes: Object.entries(porSolic).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total).slice(0, 10),
    concedentes:  Object.entries(porConced).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total).slice(0, 10),
  }
}

function desenharGraficos() {
  const lista = pedidos.value

  // Linha: pedidos por dia
  const porDia = {}
  lista.forEach(p => {
    const d = p.criado_em ? new Date(p.criado_em).toLocaleDateString('pt-BR') : '—'
    porDia[d] = (porDia[d] || 0) + 1
  })
  const diasOrdenados = Object.keys(porDia).sort((a, b) => {
    const [da, ma, ya] = a.split('/'); const [db, mb, yb] = b.split('/')
    return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`)
  })

  chartLinha?.destroy()
  chartLinha = new Chart(canvasLinha.value, {
    type: 'line',
    data: {
      labels: diasOrdenados,
      datasets: [{
        label: 'Pedidos', data: diasOrdenados.map(d => porDia[d]),
        borderColor: '#00ce7c', backgroundColor: 'rgba(0,206,124,.15)',
        tension: .3, fill: true, pointRadius: 3,
      }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  })

  // Status
  const statusKeys = Object.keys(LABEL_STATUS)
  const statusData  = statusKeys.map(k => lista.filter(p => p.status === k).length)
  chartStatus?.destroy()
  chartStatus = new Chart(canvasStatus.value, {
    type: 'doughnut',
    data: {
      labels: statusKeys.map(k => LABEL_STATUS[k]),
      datasets: [{ data: statusData, backgroundColor: statusKeys.map(k => CORES_STATUS[k]) }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } },
  })

  // Por MG
  const porMg = {}
  lista.forEach(p => {
    const mg = p.mg_concedente || p.mg_solicitante || '(sem MG)'
    porMg[mg] = (porMg[mg] || 0) + 1
  })
  const mgKeys = Object.keys(porMg).sort((a, b) => porMg[b] - porMg[a])
  chartMg?.destroy()
  chartMg = new Chart(canvasMg.value, {
    type: 'bar',
    data: { labels: mgKeys, datasets: [{ label: 'Pedidos', data: mgKeys.map(k => porMg[k]), backgroundColor: '#6b82c4' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  })

  // Top materiais
  const porProd = {}
  lista.forEach(p => { porProd[p.produto || '(sem produto)'] = (porProd[p.produto || '(sem produto)'] || 0) + 1 })
  const topProd = Object.entries(porProd).sort((a, b) => b[1] - a[1]).slice(0, 10)
  chartMateriais?.destroy()
  chartMateriais = new Chart(canvasMateriais.value, {
    type: 'bar',
    data: { labels: topProd.map(p => p[0]), datasets: [{ label: 'Pedidos', data: topProd.map(p => p[1]), backgroundColor: '#00ce7c' }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  })
}

onUnmounted(() => {
  chartLinha?.destroy(); chartStatus?.destroy(); chartMg?.destroy(); chartMateriais?.destroy()
})

watch([periodo, mgFiltro], carregar)
watch([dataInicio, dataFim], ([di, df]) => {
  // Só recarrega quando o intervalo fica completo (as duas datas escolhidas)
  // ou quando é limpo por completo — evita disparar uma busca inválida com
  // só uma ponta do intervalo preenchida (mesmo padrão do Relatórios).
  if ((di && df) || (!di && !df)) carregar()
})
onMounted(carregar)
</script>

<style scoped>
/* Dashboard é uma tela de controle: a ideia é bater o olho e ver tudo sem
   precisar rolar a página, então tudo aqui é mais compacto que o padrão
   usado nas outras telas (Relatórios etc.), sem alterar o global.css. */
.dash-compact .kpi-row { gap: 10px; margin-bottom: 12px; }
.dash-compact .kpi-card { padding: 10px 12px; }
.dash-compact .kpi-label { font-size: 8px; margin-bottom: 4px; }
.dash-compact .kpi-value { font-size: 20px; }

.dash-compact .dash-grid-compact { gap: 10px; margin-bottom: 0; }
.dash-compact .dash-card { padding: 10px 12px; }
.dash-compact .dash-card h4 { font-size: 10px; margin-bottom: 6px; }

.dash-compact .tabela th { padding: 4px 8px; font-size: 8px; }
.dash-compact .tabela td { padding: 4px 8px; font-size: 11px; }
</style>
