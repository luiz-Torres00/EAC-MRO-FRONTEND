<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal" style="max-width:380px">
      <div class="modal-header">
        <h3>Editar número do pedido</h3>
        <button class="modal-close" @click="emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div style="font-size:11px;color:var(--muted);margin-bottom:12px">
          Depois de criado, um pedido só permite editar o número do pedido. Todos os outros dados
          (solicitante, concedente, MG, datas, materiais…) ficam travados pra garantir o controle.
        </div>
        <div class="field">
          <label>Número do pedido</label>
          <input type="text" v-model="numero" placeholder="Ex: 0001, OS-4521…" />
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-primary" @click="salvar" :disabled="saving">
          {{ saving ? 'Salvando…' : 'Salvar' }}
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

const numero = ref(props.pedido.numero_pedido || '')
const saving = ref(false)

async function salvar() {
  saving.value = true
  try {
    await pedidosApi.atualizar(props.pedido.id, { numero_pedido: numero.value })
    emit('feito')
  } catch (e) {
    alert('Erro ao salvar: ' + (e.response?.data?.detail || e.message))
  } finally {
    saving.value = false
  }
}
</script>
