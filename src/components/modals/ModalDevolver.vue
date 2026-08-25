<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-devol">
      <div class="modal-header">
        <h3>Registrar devolução</h3>
        <div class="modal-header-right">
          <span class="modal-badge amber">Devolução</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--label);margin-bottom:16px">
          Confirmando a devolução de <strong>{{ pedido.produto }}</strong>.
        </p>
        <div class="field">
          <label>Observação <span class="opcional">(opcional)</span></label>
          <textarea v-model="obs" rows="3" placeholder="Estado do material, comentários…" />
        </div>

        <hr class="sep" />

        <div :class="['ocorr-toggle', { ativo: comOcorr }]" @click="comOcorr = !comOcorr">
          <span class="toggle-icon">⚠️</span>
          <div class="toggle-label">
            <strong>Registrar ocorrência</strong>
            <span>Avaria, perda, atraso ou outro problema</span>
          </div>
          <div :class="['toggle-chk', { on: comOcorr }]" />
        </div>

        <div v-if="comOcorr" style="background:var(--red-dim);border:1px solid var(--red);border-radius:8px;padding:14px;margin-bottom:14px">
          <div class="field">
            <label style="color:var(--red)">Tipo de ocorrência</label>
            <select v-model="tipoOcorr" style="border-color:#7f1d1d;background:#1a0505;color:var(--red)">
              <option value="">Selecione…</option>
              <option value="Avaria">Avaria / Dano</option>
              <option value="Perda">Perda / Extravio</option>
              <option value="Atraso">Atraso na devolução</option>
              <option value="Incompleto">Material incompleto</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div class="field">
            <label style="color:var(--red)">Descrição</label>
            <textarea v-model="descOcorr" rows="3" style="border-color:#7f1d1d;background:#1a0505" placeholder="Descreva o problema…" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-amber" @click="confirmar" :disabled="saving">
          {{ saving ? 'Registrando…' : 'Confirmar devolução' }}
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
const obs      = ref('')
const comOcorr = ref(false)
const tipoOcorr= ref('')
const descOcorr= ref('')
const saving   = ref(false)
async function confirmar() {
  saving.value = true
  try {
    await pedidosApi.devolver(props.pedido.id, {
      observacao: obs.value,
      ocorrencia: comOcorr.value ? { tipo: tipoOcorr.value, descricao: descOcorr.value } : null,
    })
    emit('feito')
  } catch (e) { alert('Erro: ' + e.message) }
  finally { saving.value = false }
}
</script>
