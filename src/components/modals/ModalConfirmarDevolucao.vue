<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-confirma-devol">
      <div class="modal-header">
        <h3>Confirmar devolução</h3>
        <div class="modal-header-right">
          <span class="modal-badge verde">Devolução</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <p style="font-size:13px;color:var(--label);margin-bottom:16px">
          <strong>{{ pedido.solicitante_nome || 'O solicitante' }}</strong> registrou a devolução de
          <strong>{{ pedido.produto }}</strong>. Confirme depois de conferir o material.
        </p>

        <div v-if="pedido.observacao" class="field" style="margin-bottom:14px">
          <label>Observação do solicitante</label>
          <div style="font-size:12px;color:var(--muted);background:var(--bg);border:1px solid var(--border-s);border-radius:8px;padding:10px">
            {{ pedido.observacao }}
          </div>
        </div>

        <div v-if="pedido.ocorrencia?.tipo" style="background:var(--red-dim);border:1px solid var(--red);border-radius:8px;padding:10px;margin-bottom:14px;font-size:12px;color:var(--red)">
          ⚠️ Ocorrência registrada: <strong>{{ pedido.ocorrencia.tipo }}</strong>
          <template v-if="pedido.ocorrencia.descricao"> — {{ pedido.ocorrencia.descricao }}</template>
        </div>

        <div class="field">
          <label>Observação <span class="opcional">(opcional)</span></label>
          <textarea v-model="obs" rows="3" placeholder="Estado do material conferido, comentários…" />
        </div>

        <hr class="sep" />

        <div :class="['ocorr-toggle', { ativo: comOcorr }]" @click="comOcorr = !comOcorr">
          <span class="toggle-icon">⚠️</span>
          <div class="toggle-label">
            <strong>Registrar ocorrência</strong>
            <span>Avaria, perda, item incompleto ou outro problema notado na conferência</span>
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
        <button class="btn btn-green" @click="confirmar" :disabled="saving">
          {{ saving ? 'Confirmando…' : '✓ Confirmar devolução' }}
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
  if (comOcorr.value && !tipoOcorr.value) { alert('Selecione o tipo de ocorrência.'); return }
  saving.value = true
  try {
    await pedidosApi.confirmarDevolucao(props.pedido.id, {
      observacao: obs.value,
      ocorrencia: comOcorr.value ? { tipo: tipoOcorr.value, descricao: descOcorr.value } : null,
    })
    emit('feito')
  } catch (e) { alert('Erro: ' + e.message) }
  finally { saving.value = false }
}
</script>