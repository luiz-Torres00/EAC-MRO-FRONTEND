<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-recusar">
      <div class="modal-header">
        <h3>Recusar pedido</h3>
        <div class="modal-header-right">
          <span class="modal-badge red">Recusa</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--label);margin-bottom:16px">
          Informe o motivo da recusa de <strong>{{ pedido.produto }}</strong>.
        </p>
        <div class="field">
          <label>Motivo da recusa</label>
          <textarea v-model="motivo" rows="4" placeholder="Ex: Material indisponível no período…" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-red" @click="confirmar" :disabled="saving">
          {{ saving ? 'Recusando…' : 'Confirmar recusa' }}
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
const motivo = ref('')
const saving = ref(false)
async function confirmar() {
  if (!motivo.value.trim()) { alert('Informe o motivo.'); return }
  saving.value = true
  try {
    await pedidosApi.recusar(props.pedido.id, { motivo: motivo.value })
    emit('feito')
  } catch (e) { alert('Erro: ' + e.message) }
  finally { saving.value = false }
}
</script>
