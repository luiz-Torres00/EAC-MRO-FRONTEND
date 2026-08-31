<template>
  <div class="cal">
    <div class="cal-header">
      <button type="button" class="cal-nav" @click="mesAnterior">‹</button>
      <div class="cal-titulo">{{ nomeMes }} {{ anoAtual }}</div>
      <button type="button" class="cal-nav" @click="mesSeguinte">›</button>
    </div>

    <div class="cal-semana">
      <span v-for="d in DIAS_SEMANA" :key="d">{{ d }}</span>
    </div>

    <div class="cal-grid" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
      <Transition :name="slideDir === 'esq' ? 'cal-slide-esq' : 'cal-slide-dir'" mode="out-in">
        <div class="cal-grid-inner" :key="anoAtual + '-' + mesAtual">
          <button
            v-for="(dia, i) in dias" :key="i"
            type="button"
            class="cal-dia"
            :class="{
              'fora-do-mes': !dia.noMes,
              'in-range': dia.emIntervalo,
              'is-inicio': dia.ehInicio,
              'is-fim': dia.ehFim,
              'hoje': dia.hoje,
            }"
            @click="clicarDia(dia)"
          >
            {{ dia.dia }}
          </button>
        </div>
      </Transition>
    </div>

    <div v-if="inicio || fim" class="cal-resumo">
      <span v-if="inicio">Início: <strong>{{ fmt(inicio) }}</strong></span>
      <span v-if="fim">&nbsp;→ Devolução: <strong>{{ fmt(fim) }}</strong></span>
      <span v-if="inicio && fim" class="cal-dias-badge">{{ diffDias }} dia{{ diffDias === 1 ? '' : 's' }}</span>
      <button v-if="inicio || fim" type="button" class="cal-limpar" @click="limpar">Limpar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  inicio: { type: String, default: '' }, // YYYY-MM-DD
  fim:    { type: String, default: '' },
})
const emit = defineEmits(['update:inicio', 'update:fim'])

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

const base = props.inicio ? new Date(props.inicio + 'T00:00:00') : new Date()
const mesAtual = ref(base.getMonth())
const anoAtual = ref(base.getFullYear())

const nomeMes = computed(() => MESES[mesAtual.value])

// Direção da última troca de mês, usada só pra escolher a animação de
// slide (não muda nenhuma lógica de datas).
const slideDir = ref('dir')

function mesAnterior() {
  slideDir.value = 'dir'
  if (mesAtual.value === 0) { mesAtual.value = 11; anoAtual.value-- } else { mesAtual.value-- }
}
function mesSeguinte() {
  slideDir.value = 'esq'
  if (mesAtual.value === 11) { mesAtual.value = 0; anoAtual.value++ } else { mesAtual.value++ }
}

// ── Arrastar o dedo pro lado troca de mês (celular) ──────────────────────
// Só reage quando o gesto é bem mais horizontal que vertical, pra não
// atrapalhar quem só quer rolar a tela passando o dedo por cima do
// calendário.
let touchStartX = 0, touchStartY = 0, arrastando = false
const LIMIAR_SWIPE = 40

function onTouchStart(e) {
  if (e.touches.length !== 1) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  arrastando = true
}
function onTouchMove(e) {
  if (!arrastando) return
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  // Uma vez que fica claro que é um gesto horizontal, segura o scroll da
  // página pra o arrasto ficar "preso" ao calendário até soltar o dedo.
  if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) e.preventDefault()
}
function onTouchEnd(e) {
  if (!arrastando) return
  arrastando = false
  const touch = e.changedTouches[0]
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  if (Math.abs(dx) > LIMIAR_SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0) mesSeguinte(); else mesAnterior()
  }
}

function toIso(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function fmt(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const dias = computed(() => {
  const primeiroDoMes = new Date(anoAtual.value, mesAtual.value, 1)
  const inicioGrid = new Date(primeiroDoMes)
  inicioGrid.setDate(inicioGrid.getDate() - primeiroDoMes.getDay())

  const hojeIso = toIso(new Date())
  const lista = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicioGrid)
    d.setDate(inicioGrid.getDate() + i)
    const iso = toIso(d)
    const emIntervalo = props.inicio && props.fim && iso >= props.inicio && iso <= props.fim
    lista.push({
      dia: d.getDate(),
      iso,
      noMes: d.getMonth() === mesAtual.value,
      hoje: iso === hojeIso,
      ehInicio: iso === props.inicio,
      ehFim: iso === props.fim,
      emIntervalo,
    })
  }
  return lista
})

const diffDias = computed(() => {
  if (!props.inicio || !props.fim) return 0
  const a = new Date(props.inicio + 'T00:00:00'), b = new Date(props.fim + 'T00:00:00')
  return Math.round((b - a) / 86400000)
})

function clicarDia(dia) {
  const iso = dia.iso
  if (!props.inicio || (props.inicio && props.fim)) {
    // começa um novo intervalo
    emit('update:inicio', iso)
    emit('update:fim', '')
  } else if (props.inicio && !props.fim) {
    if (iso < props.inicio) {
      emit('update:inicio', iso)
      emit('update:fim', '')
    } else {
      emit('update:fim', iso)
    }
  }
}

function limpar() {
  emit('update:inicio', '')
  emit('update:fim', '')
}
</script>

<style scoped>
.cal { background: var(--card, #10131c); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.cal-titulo { font-size: 13px; font-weight: 700; text-transform: capitalize; color: var(--text); }
.cal-nav {
  background: transparent; border: 1px solid var(--border); color: var(--text);
  border-radius: 6px; width: 24px; height: 24px; cursor: pointer; font-size: 14px; line-height: 1;
}
.cal-nav:hover { border-color: var(--verde); color: var(--verde); }
.cal-semana { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 10px; color: var(--muted); margin-bottom: 4px; }
.cal-grid { overflow: hidden; touch-action: pan-y; }
.cal-grid-inner { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }

/* Anima a troca de mês (clique nas setas ou arrastar o dedo) */
.cal-slide-esq-enter-active, .cal-slide-esq-leave-active,
.cal-slide-dir-enter-active, .cal-slide-dir-leave-active {
  transition: transform .18s ease, opacity .18s ease;
}
.cal-slide-esq-enter-from { transform: translateX(24px); opacity: 0; }
.cal-slide-esq-leave-to   { transform: translateX(-24px); opacity: 0; }
.cal-slide-dir-enter-from { transform: translateX(-24px); opacity: 0; }
.cal-slide-dir-leave-to   { transform: translateX(24px); opacity: 0; }
.cal-dia {
  background: transparent; border: none; color: var(--text); font-size: 11px;
  padding: 6px 0; cursor: pointer; border-radius: 6px; position: relative;
}
.cal-dia:hover { background: var(--surface); }
.cal-dia.fora-do-mes { color: var(--muted); opacity: .4; }
.cal-dia.hoje { font-weight: 800; text-decoration: underline; }
.cal-dia.in-range { background: rgba(0,206,124,.18); border-radius: 0; }
.cal-dia.is-inicio, .cal-dia.is-fim {
  background: var(--verde); color: #06251a; font-weight: 800; border-radius: 99px;
}
.cal-resumo {
  margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border);
  font-size: 11px; color: var(--muted); display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
}
.cal-resumo strong { color: var(--text); }
.cal-dias-badge {
  margin-left: 8px; background: var(--verde); color: #06251a; font-weight: 800;
  padding: 2px 8px; border-radius: 99px; font-size: 10px;
}
.cal-limpar {
  margin-left: auto; background: transparent; border: none; color: var(--red);
  cursor: pointer; font-size: 11px; text-decoration: underline;
}
</style>