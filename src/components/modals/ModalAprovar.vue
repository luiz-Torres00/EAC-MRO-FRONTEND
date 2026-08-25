<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Aprovar pedido</h3>
        <div class="modal-header-right">
          <span class="modal-badge verde">Aprovação</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--label);margin-bottom:16px">
          Confirme a aprovação de <strong>{{ pedido.produto }}</strong> para <strong>{{ pedido.solicitante_nome || '—' }}</strong>.
        </p>
        <div class="field">
          <label>Data de devolução</label>
          <input type="date" v-model="devISO" />
          <div class="field-hint">Deixe em branco se não houver prazo definido.</div>
        </div>
        <div class="field">
          <label>Observação <span class="opcional">(opcional)</span></label>
          <textarea v-model="obs" rows="3" placeholder="Ex: Material disponível a partir de segunda-feira…" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-green" @click="confirmar" :disabled="saving">
          {{ saving ? 'Aprovando…' : 'Confirmar aprovação' }}
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
const devISO = ref(props.pedido.dev_iso || '')
const obs    = ref('')
const saving = ref(false)
async function confirmar() {
  saving.value = true
  try {
    await pedidosApi.aprovar(props.pedido.id, { devISO: devISO.value, observacao: obs.value })
    emit('feito')
  } catch (e) { alert('Erro: ' + e.message) }
  finally { saving.value = false }
}
</script>
