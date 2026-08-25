<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Estender prazo</h3>
        <div class="modal-header-right">
          <span class="modal-badge indigo">Extensão</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--label);margin-bottom:16px">
          Nova data de devolução para <strong>{{ pedido.produto }}</strong>.
          <template v-if="pedido.dev_iso"> Prazo atual: <strong>{{ fmtData(pedido.dev_iso) }}</strong>.</template>
        </p>
        <div class="field">
          <label>Nova data de devolução</label>
          <input type="date" v-model="novaData" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-primary" @click="confirmar" :disabled="saving">
          {{ saving ? 'Salvando…' : 'Confirmar extensão' }}
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
const emit  = defineEmits(['close','feito'])
useEscClose(() => emit('close'))
const novaData = ref(props.pedido.dev_iso || '')
const saving   = ref(false)
function fmtData(val) {
  if (!val) return '—'
  try { return new Date(val+'T00:00:00').toLocaleDateString('pt-BR') } catch { return '—' }
}
async function confirmar() {
  if (!novaData.value) { alert('Selecione a nova data.'); return }
  saving.value = true
  try {
    await pedidosApi.estender(props.pedido.id, { devISO: novaData.value })
    emit('feito')
  } catch (e) { alert('Erro: ' + e.message) }
  finally { saving.value = false }
}
</script>
