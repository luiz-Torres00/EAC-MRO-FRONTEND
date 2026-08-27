<template>
  <div>
    <div class="section-header">
      <h3 style="font-size:14px;font-weight:700;color:var(--text)">Relatórios</h3>
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
          <div v-if="mostrarCalendario" style="position:absolute;top:calc(100% + 6px);right:0;z-index:40;width:280px;max-width:calc(100vw - 40px)">
            <CalendarioRange v-model:inicio="dataInicio" v-model:fim="dataFim" />
            <div style="margin-top:6px;display:flex;justify-content:flex-end">
              <button class="btn btn-primary btn-sm" @click="mostrarCalendario = false">Fechar</button>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-sm" @click="carregar" :disabled="loading">
          {{ loading ? 'Carregando…' : '↺ Atualizar' }}
        </button>
        <button class="btn btn-green btn-sm" @click="baixarXlsx" :disabled="baixando">
          {{ baixando ? 'Gerando…' : '⬇ Baixar planilha (.xlsx)' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-full" style="height:200px">Carregando…</div>
    <div v-else-if="error" style="color:var(--red);padding:20px">{{ error }}</div>

    <div v-else>
      <!-- KPIs -->
      <div class="kpi-row">
        <div class="kpi-card clicavel" title="Ver todos os pedidos" @click="irEmprestimos({})">
          <div class="kpi-label">Total de pedidos</div>
          <div class="kpi-value" style="color:var(--text)">{{ stats.total }}</div>
        </div>
        <div class="kpi-card clicavel" title="Ver pedidos aprovados, aguardando devolução ou devolvidos"
          @click="irEmprestimos({ status: 'aprovado,aguardando_devolucao,devolvido' })">
          <div class="kpi-label">Aprovados</div>
          <div class="kpi-value verde">{{ stats.aprovados }}</div>
        </div>
        <div class="kpi-card clicavel" title="Ver pedidos aguardando devolução"
          @click="irEmprestimos({ status: 'aguardando_devolucao' })">
          <div class="kpi-label">Aguardando devolução</div>
          <div class="kpi-value indigo">{{ stats.aguardando }}</div>
        </div>
        <div class="kpi-card clicavel" title="Ver pedidos recusados" @click="irEmprestimos({ status: 'recusado' })">
          <div class="kpi-label">Recusados</div>
          <div class="kpi-value red">{{ stats.recusados }}</div>
        </div>
        <div class="kpi-card clicavel" title="Ver pedidos com ocorrência" @click="irEmprestimos({ ocorrencia: '1' })">
          <div class="kpi-label">Com ocorrência</div>
          <div class="kpi-value amber">{{ stats.ocorrencias }}</div>
        </div>
      </div>

      <div class="dash-grid">
        <!-- Por MG -->
        <div class="dash-card">
          <h4>Pedidos por MG (armazém concedente)</h4>
          <div v-if="!stats.porSetor.length" style="color:var(--muted);font-size:12px">Sem dados</div>
          <table v-else class="tabela">
            <thead>
              <tr>
                <th>MG</th>
                <th style="text-align:right">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in stats.porSetor" :key="s.setor" class="clicavel" title="Ver pedidos desse MG"
                @click="irEmprestimos({ mg: s.setor || '(sem MG)' })">
                <td>{{ s.setor || '—' }}</td>
                <td style="text-align:right;font-weight:700">{{ s.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Por produto -->
        <div class="dash-card">
          <h4>Materiais mais solicitados</h4>
          <div v-if="!stats.porProduto.length" style="color:var(--muted);font-size:12px">Sem dados</div>
          <table v-else class="tabela">
            <thead>
              <tr>
                <th>Material</th>
                <th style="text-align:right">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in stats.porProduto.slice(0, 10)" :key="p.produto"
                :class="{ clicavel: p.produto !== '(sem produto)' }"
                :title="p.produto !== '(sem produto)' ? 'Ver pedidos desse material' : ''"
                @click="p.produto !== '(sem produto)' && irEmprestimos({ busca: p.produto })">
                <td>{{ p.produto }}</td>
                <td style="text-align:right;font-weight:700">{{ p.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Por status -->
        <div class="dash-card">
          <h4>Distribuição por status</h4>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div
              v-for="item in statusDist"
              :key="item.label"
              class="clicavel"
              :title="'Ver pedidos ' + item.label.toLowerCase()"
              style="display:flex;align-items:center;gap:10px"
              @click="irEmprestimos({ status: item.key })"
            >
              <span :class="['status-badge', 'status-' + item.key]" style="min-width:120px;justify-content:center">
                {{ item.label }}
              </span>
              <div style="flex:1;background:var(--border);border-radius:99px;height:6px;overflow:hidden">
                <div
                  :style="{
                    width: stats.total ? ((item.valor / stats.total) * 100).toFixed(1) + '%' : '0%',
                    background: item.cor,
                    height: '100%',
                    borderRadius: '99px',
                    transition: 'width .5s var(--ease)',
                  }"
                />
              </div>
              <span style="font-size:12px;font-weight:700;min-width:28px;text-align:right;color:var(--text)">
                {{ item.valor }}
              </span>
            </div>
          </div>
        </div>

        <!-- Dash de ocorrências — visão dedicada, é o que mais precisa de controle -->
        <div class="dash-card ocorrencias-dash" style="grid-column: span 2">
          <h4>Dash de ocorrências</h4>

          <div v-if="!stats.ocorrencias" style="color:var(--muted);font-size:12px">
            Nenhuma ocorrência no período
          </div>
          <div v-else style="display:flex;flex-direction:column;gap:16px">
            <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center">
              <div>
                <div class="kpi-label" style="margin-bottom:4px">Taxa de ocorrência</div>
                <div class="kpi-value amber" style="font-size:22px">
                  {{ stats.total ? ((stats.ocorrencias / stats.total) * 100).toFixed(1) : 0 }}%
                </div>
              </div>
              <div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:8px">
                <div
                  v-for="t in stats.porTipoOcorrencia"
                  :key="t.tipo"
                  style="display:flex;align-items:center;gap:10px"
                >
                  <span style="min-width:90px;font-size:11px;font-weight:700;color:var(--text)">{{ t.tipo }}</span>
                  <div style="flex:1;background:var(--border);border-radius:99px;height:6px;overflow:hidden">
                    <div
                      :style="{
                        width: stats.ocorrencias ? ((t.total / stats.ocorrencias) * 100).toFixed(1) + '%' : '0%',
                        background: 'var(--amber)',
                        height: '100%',
                        borderRadius: '99px',
                        transition: 'width .5s var(--ease)',
                      }"
                    />
                  </div>
                  <span style="font-size:12px;font-weight:700;min-width:22px;text-align:right;color:var(--text)">
                    {{ t.total }}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div class="kpi-label" style="margin-bottom:8px">Ocorrências no período</div>
              <div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:8px">
                <div
                  v-for="o in stats.ocorrenciasRecentes"
                  :key="o.id"
                  class="ocorrencia-box clicavel"
                  title="Ver pedido"
                  style="margin-bottom:0"
                  @click="irEmprestimos({ pedido: o.id })"
                >
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                    <div>
                      <div style="font-weight:700;margin-bottom:2px">{{ o.produto }}</div>
                      <div style="font-size:11px;opacity:.8">{{ o.ocorrencia?.tipo }} · {{ o.solicitante_nome }}</div>
                    </div>
                    <div style="font-size:10px;opacity:.7;white-space:nowrap;flex-shrink:0">
                      {{ fmtData(o.devolvido_em) }}
                    </div>
                  </div>
                  <div v-if="o.ocorrencia?.descricao" style="margin-top:4px;font-size:11px;font-weight:500;opacity:.85">
                    {{ o.ocorrencia.descricao }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { pedidosApi } from '@/api'
import CalendarioRange from '@/components/CalendarioRange.vue'

const router = useRouter()

// Leva pra tela de Empréstimos já filtrada pelo critério clicado (status,
// MG, busca por nome/produto, um pedido específico ou os com ocorrência).
function irEmprestimos(query) {
  router.push({ path: '/', query })
}

const periodo  = ref('30')
const loading  = ref(false)
const baixando = ref(false)
const error    = ref(null)
const pedidos  = ref([])

// Filtro por MG — mesmas opções cadastradas no backend (Pedido.MG_CHOICES)
const MG_OPCOES = ['MG1', 'MG2', 'MG3', 'MG4', 'Cenografia', 'Arte']
const mgFiltro  = ref('')

// Filtro por intervalo de datas (calendário, igual ao do formulário de novo
// pedido) — quando preenchido, substitui o filtro de "últimos N dias".
const dataInicio      = ref('')
const dataFim         = ref('')
const mostrarCalendario = ref(false)
const intervaloAtivo  = computed(() => !!(dataInicio.value && dataFim.value))

// Mesmos tipos do select de ocorrência no ModalDevolver.vue — mantém a
// ordem fixa aqui pra o dash não "pular" de posição conforme os dados mudam.
const TIPOS_OCORRENCIA = ['Avaria', 'Perda', 'Atraso', 'Incompleto', 'Outro']

const STATUS_INFO = [
  { key: 'pendente',            label: 'Pendente',            cor: 'var(--amber)' },
  { key: 'aprovado',            label: 'Aprovado',            cor: 'var(--verde)' },
  { key: 'aguardando_devolucao',label: 'Ag. Devolução',       cor: 'var(--indigo)' },
  { key: 'devolvido',           label: 'Devolvido',           cor: '#6b82c4' },
  { key: 'recusado',            label: 'Recusado',            cor: 'var(--red)' },
  { key: 'cancelado',           label: 'Cancelado',           cor: 'var(--muted)' },
]

const stats = computed(() => {
  const lista = pedidos.value
  if (!lista.length) return {
    total: 0, aprovados: 0, aguardando: 0, recusados: 0, ocorrencias: 0,
    porSetor: [], porProduto: [], porTipoOcorrencia: [], ocorrenciasRecentes: [],
  }

  const total      = lista.length
  const aprovados  = lista.filter(p => ['aprovado', 'aguardando_devolucao', 'devolvido'].includes(p.status)).length
  const aguardando = lista.filter(p => p.status === 'aguardando_devolucao').length
  const recusados  = lista.filter(p => p.status === 'recusado').length
  const ocorrencias = lista.filter(p => p.ocorrencia).length

  // Por MG — usa o armazém concedente do pedido (quem está emprestando o
  // material), que é o que de fato identifica a "área" responsável pelo
  // empréstimo. Antes isso usava o setor cadastrado no perfil de quem pediu,
  // o que ficava vazio sempre que o solicitante não tinha setor preenchido.
  const setorMap = {}
  lista.forEach(p => {
    const s = p.mg_concedente || p.mg_solicitante || '(sem MG)'
    setorMap[s] = (setorMap[s] || 0) + 1
  })
  const porSetor = Object.entries(setorMap)
    .map(([setor, total]) => ({ setor, total }))
    .sort((a, b) => b.total - a.total)

  // Por produto
  const prodMap = {}
  lista.forEach(p => {
    const nome = p.produto || '(sem produto)'
    prodMap[nome] = (prodMap[nome] || 0) + 1
  })
  const porProduto = Object.entries(prodMap)
    .map(([produto, total]) => ({ produto, total }))
    .sort((a, b) => b.total - a.total)

  // Por tipo de ocorrência — Avaria, Perda, Atraso, Incompleto, Outro
  const tipoMap = {}
  lista.forEach(p => {
    if (!p.ocorrencia) return
    const tipo = p.ocorrencia.tipo || 'Outro'
    tipoMap[tipo] = (tipoMap[tipo] || 0) + 1
  })
  const porTipoOcorrencia = TIPOS_OCORRENCIA
    .map(tipo => ({ tipo, total: tipoMap[tipo] || 0 }))
    .filter(t => t.total > 0)
    .sort((a, b) => b.total - a.total)

  // Ocorrências no período — o dash mostra a lista inteira (com scroll
  // interno), não só as 5 mais recentes, porque é "importante demais ter em
  // controle".
  const ocorrenciasRecentes = lista
    .filter(p => p.ocorrencia && p.devolvido_em)
    .sort((a, b) => new Date(b.devolvido_em) - new Date(a.devolvido_em))

  return { total, aprovados, aguardando, recusados, ocorrencias, porSetor, porProduto, porTipoOcorrencia, ocorrenciasRecentes }
})

const statusDist = computed(() =>
  STATUS_INFO.map(s => ({
    ...s,
    valor: pedidos.value.filter(p => p.status === s.key).length,
  }))
)

function paramsFiltro() {
  const params = {}
  if (intervaloAtivo.value) {
    params.data_inicio = dataInicio.value
    params.data_fim    = dataFim.value
  } else {
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
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function fmtData(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('pt-BR') } catch { return '—' }
}

async function baixarXlsx() {
  baixando.value = true
  try {
    const res = await pedidosApi.relatorioXlsx(paramsFiltro())
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a   = document.createElement('a')
    a.href = url
    a.download = `relatorio-eac-${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    alert('Erro ao gerar planilha: ' + (e.response?.data?.detail || e.message))
  } finally {
    baixando.value = false
  }
}

watch([periodo, mgFiltro], carregar)
watch([dataInicio, dataFim], ([di, df]) => {
  // Só recarrega quando o intervalo fica completo (as duas datas escolhidas)
  // ou quando é limpo por completo (botão "Limpar" do calendário) — evita
  // disparar uma busca inválida com só uma ponta do intervalo preenchida.
  if ((di && df) || (!di && !df)) carregar()
})
onMounted(carregar)
</script>