<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-estender">
      <div class="modal-header">
        <h3>📅 Estender prazo de devolução</h3>
        <div class="modal-header-right">
          <span class="modal-badge indigo">Extensão</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <p class="estender-subtitulo">
          #{{ pedido.codigo || '—' }} <span v-if="pedido.mg_solicitante">· {{ pedido.mg_solicitante }}</span>
        </p>

        <div class="estender-card">
          <div class="estender-grid3">
            <div>
              <div class="info-label">Código</div>
              <div class="info-value">{{ pedido.codigo || '—' }}</div>
            </div>
            <div>
              <div class="info-label">Pedinte</div>
              <div class="info-value">{{ pedido.solicitante_nome || '—' }}</div>
            </div>
            <div>
              <div class="info-label">Prazo atual</div>
              <div class="info-value warn">{{ fmtCurta(pedido.dev_iso) }}</div>
            </div>
          </div>
          <div class="estender-novo-prazo">
            <div class="info-label">Novo prazo</div>
            <div class="info-value ok">{{ fmtCurta(novaDataISO) }}</div>
          </div>
        </div>

        <div class="field">
          <label>Quantos dias extras você concede?</label>
          <div class="stepper">
            <button type="button" class="stepper-btn" @click="alterarDias(-1)" :disabled="dias <= 1">−</button>
            <input type="number" v-model.number="dias" min="1" class="stepper-input" />
            <button type="button" class="stepper-btn" @click="alterarDias(1)">+</button>
            <span class="stepper-suffix">dias corridos</span>
          </div>
        </div>

        <div class="estender-preview">
          📅 Novo prazo: <strong>{{ fmtExtenso(novaDataISO) }}</strong>
        </div>

        <div class="field">
          <label>Motivo da extensão</label>
          <div class="chips">
            <button
              v-for="op in motivos" :key="op.valor" type="button"
              class="chip" :class="{ ativo: motivoSelecionado === op.valor }"
              @click="motivoSelecionado = (motivoSelecionado === op.valor ? '' : op.valor)"
            >
              {{ op.icone }} {{ op.label }}
            </button>
          </div>
          <textarea v-model="motivoTexto" placeholder="Descreva o motivo ou complemente…" rows="2"></textarea>
        </div>

        <div class="mensagem-preview">
          <div class="mensagem-preview-header">
            <span>✉️ Mensagem automática ao pedinte</span>
            <span class="modal-badge indigo">Extensão concedida</span>
          </div>
          <p>Prezado(a) <strong>{{ pedido.solicitante_nome || 'solicitante' }}</strong>,</p>
          <p>
            Informamos que o prazo de devolução do material referente ao pedido
            <strong>#{{ pedido.codigo || '—' }}</strong><template v-if="pedido.mg_solicitante"> — {{ pedido.mg_solicitante }}</template>
            foi prorrogado.
          </p>
          <p>
            O prazo anterior era <strong>{{ fmtExtenso(pedido.dev_iso) }}</strong>. O novo prazo de devolução passa a ser
            <strong>{{ fmtExtenso(novaDataISO) }}</strong>, uma extensão de <strong>{{ dias || 0 }} dia(s)</strong>.
          </p>
          <p v-if="motivoFinal">Motivo: {{ motivoFinal }}</p>
          <p>Contamos com sua pontualidade até a nova data. Em caso de dúvidas, estamos à disposição.</p>
          <p>
            Atenciosamente,<br />
            <strong>{{ nomeUsuarioAtual }}</strong> — {{ auth.user?.cargo || 'Admin' }} · MRO
          </p>
        </div>

        <p class="estender-nota">🔔 O gestor do setor receberá uma notificação sobre esta extensão de prazo.</p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-primary" @click="confirmar" :disabled="saving">
          {{ saving ? 'Salvando…' : '📅 Confirmar extensão' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { pedidosApi } from '@/api'
import { useEscClose } from '@/composables/useEscClose'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({ pedido: Object })
const emit  = defineEmits(['close', 'feito'])
useEscClose(() => emit('close'))

const auth = useAuthStore()

const dias              = ref(5)
const motivoSelecionado = ref('')
const motivoTexto       = ref('')
const saving            = ref(false)

const motivos = [
  { valor: 'solicitacao_pedinte', icone: '📩', label: 'Solicitação do pedinte' },
  { valor: 'producao',            icone: '📦', label: 'Necessidade da produção' },
  { valor: 'acordo_mutuo',        icone: '🤝', label: 'Acordo mútuo' },
  { valor: 'imprevisto',          icone: '⚙️', label: 'Imprevisto operacional' },
  { valor: 'outro',               icone: '✏️', label: 'Outro' },
]

const motivoFinal = computed(() => {
  const base = motivos.find(m => m.valor === motivoSelecionado.value)?.label || ''
  if (base && motivoTexto.value) return `${base} — ${motivoTexto.value}`
  return base || motivoTexto.value
})

const nomeUsuarioAtual = computed(() => {
  const u = auth.user
  if (!u) return 'Admin'
  return `${u.nome || ''} ${u.sobrenome || ''}`.trim() || u.email
})

function alterarDias(delta) {
  dias.value = Math.max(1, (Number(dias.value) || 0) + delta)
}

const novaDataISO = computed(() => {
  const base = props.pedido.dev_iso ? new Date(props.pedido.dev_iso + 'T00:00:00') : new Date()
  base.setDate(base.getDate() + (Number(dias.value) || 0))
  return base.toISOString().slice(0, 10)
})

function fmtCurta(iso) {
  if (!iso) return '—'
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR') } catch { return '—' }
}
function fmtExtenso(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '—' }
}

async function confirmar() {
  if (!dias.value || dias.value < 1) { alert('Informe ao menos 1 dia extra.'); return }
  saving.value = true
  try {
    await pedidosApi.estender(props.pedido.id, { dias: dias.value, motivo: motivoFinal.value })
    emit('feito')
  } catch (e) { alert('Erro: ' + e.message) }
  finally { saving.value = false }
}
</script>

<style scoped>
.estender-subtitulo {
  font-size: 12px; font-weight: 600; color: var(--label);
  margin-bottom: 16px;
}

.estender-card {
  background: var(--bg); border: 1px solid var(--border-s);
  border-radius: var(--radius-sm); padding: 14px 16px;
  margin-bottom: 18px;
}
.estender-grid3 {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
}
.estender-novo-prazo {
  margin-top: 12px; padding-top: 12px;
  border-top: 1px dashed var(--border);
}

.stepper {
  display: flex; align-items: center; gap: 10px;
}
.stepper-btn {
  width: 34px; height: 34px; flex-shrink: 0;
  border-radius: var(--radius-sm); border: 1px solid var(--border-s);
  background: var(--bg); color: var(--text);
  font-size: 16px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: border-color .15s, background .15s;
}
.stepper-btn:hover:not(:disabled) { border-color: var(--indigo); color: var(--indigo); }
.stepper-btn:disabled { opacity: .4; cursor: not-allowed; }
.stepper-input {
  width: 64px; text-align: center; font-size: 15px; font-weight: 700;
  background: var(--bg); border: 1px solid var(--border-s);
  border-radius: var(--radius-sm); color: var(--text);
  padding: 8px 6px; font-family: var(--font);
}
.stepper-suffix { font-size: 12px; color: var(--label); font-weight: 600; }

.estender-preview {
  background: var(--indigo-dim); border: 1px solid var(--indigo);
  border-radius: var(--radius-sm); padding: 10px 14px;
  font-size: 13px; color: var(--indigo); font-weight: 600;
  margin-bottom: 18px;
}
.estender-preview strong { color: var(--indigo); }

.chips {
  display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;
}
.chip {
  font-family: var(--font); font-size: 11.5px; font-weight: 600;
  padding: 7px 12px; border-radius: 99px;
  border: 1.5px solid var(--border-s); background: var(--bg);
  color: var(--label); cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.chip:hover { border-color: var(--indigo); color: var(--text); }
.chip.ativo {
  border-color: var(--indigo); color: var(--indigo);
  background: var(--indigo-dim);
}

.mensagem-preview {
  background: var(--indigo-dim); border: 1px solid var(--indigo);
  border-radius: var(--radius-sm); padding: 14px 16px;
  margin: 18px 0 12px; font-size: 12.5px; color: var(--text);
  line-height: 1.55;
}
.mensagem-preview p { margin-bottom: 8px; }
.mensagem-preview p:last-child { margin-bottom: 0; }
.mensagem-preview-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--indigo);
  margin-bottom: 10px; padding-bottom: 10px;
  border-bottom: 1px dashed var(--indigo);
}

.estender-nota {
  font-size: 11px; color: var(--muted); font-weight: 600;
}
</style>