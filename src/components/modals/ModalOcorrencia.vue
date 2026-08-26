<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-ocorrencia">
      <div class="modal-header">
        <h3>⚠️ Abrir ocorrência</h3>
        <div class="modal-header-right">
          <span class="modal-badge red">#{{ pedido.codigo || '—' }}</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <p class="ocorr-subtitulo">
          {{ pedido.produto || 'Sem título' }}
          <span v-if="pedido.solicitante_nome"> · {{ pedido.solicitante_nome }}</span>
        </p>

        <div class="field">
          <label>Tipo de ocorrência</label>
          <div class="ocorr-tipos">
            <button
              v-for="op in tipos" :key="op.valor" type="button"
              class="chip chip-red" :class="{ ativo: tipo === op.valor }"
              @click="tipo = op.valor"
            >
              {{ op.icone }} {{ op.label }}
            </button>
          </div>
        </div>

        <div class="field">
          <label>Descrição <span class="opcional">(opcional)</span></label>
          <textarea v-model="descricao" rows="3" placeholder="Detalhe o que aconteceu…"></textarea>
        </div>

        <p class="ocorr-nota">🔔 Os gestores do setor {{ pedido.mg_concedente || 'concedente' }} serão notificados sobre esta ocorrência.</p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-red" @click="confirmar" :disabled="saving || !tipo">
          {{ saving ? 'Registrando…' : '⚠️ Registrar ocorrência' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { pedidosApi } from '@/api'
import { useEscClose } from '@/composables/useEscClose'

const props = defineProps({ pedido: Object })
const emit  = defineEmits(['close', 'feito'])
useEscClose(() => emit('close'))

// Valores alinhados com o tipo usado no registro de ocorrência da devolução
// (ModalDevolver) e com o dash de ocorrências dos Relatórios — só o rótulo
// muda pra ficar mais claro nesse fluxo.
const tipos = [
  { valor: 'Atraso',     icone: '⏰', label: 'Não devolvido no prazo' },
  { valor: 'Avaria',     icone: '🔧', label: 'Material danificado' },
  { valor: 'Incompleto', icone: '📦', label: 'Material incompleto' },
  { valor: 'Perda',      icone: '❓', label: 'Item extraviado' },
  { valor: 'Outro',      icone: '✏️', label: 'Outro' },
]

const tipo      = ref('Atraso')
const descricao = ref('')
const saving    = ref(false)

async function confirmar() {
  if (!tipo.value) { alert('Selecione o tipo de ocorrência.'); return }
  saving.value = true
  try {
    await pedidosApi.abrirOcorrencia(props.pedido.id, { tipo: tipo.value, descricao: descricao.value })
    emit('feito')
  } catch (e) { alert('Erro: ' + (e.response?.data?.detail || e.message)) }
  finally { saving.value = false }
}
</script>

<style scoped>
.ocorr-subtitulo {
  font-size: 12px; font-weight: 600; color: var(--label);
  margin-bottom: 16px;
}
.ocorr-tipos {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.chip-red {
  font-family: var(--font); font-size: 11.5px; font-weight: 600;
  padding: 7px 12px; border-radius: 99px;
  border: 1.5px solid var(--border-s); background: var(--bg);
  color: var(--label); cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.chip-red:hover { border-color: var(--red); color: var(--text); }
.chip-red.ativo {
  border-color: var(--red); color: var(--red);
  background: var(--red-dim);
}
.ocorr-nota {
  font-size: 11px; color: var(--muted); font-weight: 600;
  margin-top: 4px;
}
</style>