<template>
  <!-- Pessoa já selecionada: mostra chip com avatar + botão remover -->
  <div v-if="modelValue" class="mencao-chip-selected">
    <div class="mencao-chip-avatar">{{ (modelValue.nome || '?')[0].toUpperCase() }}</div>
    <div class="mencao-chip-body">
      <div class="mencao-chip-nome">
        {{ modelValue.nome || '—' }}
        <span v-if="modelValue.setor" style="margin-left:6px;font-size:9px;font-weight:700;color:var(--verde);border:1px solid var(--verde);border-radius:99px;padding:1px 6px">{{ modelValue.setor }}</span>
        <span v-else style="margin-left:6px;font-size:9px;font-weight:700;color:var(--red);border:1px solid var(--red);border-radius:99px;padding:1px 6px">sem MG</span>
      </div>
      <div v-if="modelValue.email" class="mencao-chip-email">{{ modelValue.email }}</div>
      <div v-else-if="modelValue.matricula" class="mencao-chip-email">{{ modelValue.matricula }}</div>
    </div>
    <button type="button" class="mencao-chip-clear" title="Remover" @click="clear">✕</button>
  </div>

  <!-- Campo de busca -->
  <div v-else class="mencao-wrap">
    <input
      ref="inputRef"
      type="text"
      v-model="query"
      :placeholder="placeholder || 'Nome, e-mail ou matrícula…'"
      @focus="open = true"
      @blur="onBlur"
      autocomplete="off"
    />
    <div v-if="open && filtered.length" class="mencao-dropdown">
      <div
        v-for="u in filtered"
        :key="u.id || u.email"
        class="mencao-item"
        @mousedown.prevent="select(u)"
      >
        <div class="mencao-item-avatar">{{ (u.nome || '?')[0].toUpperCase() }}</div>
        <div class="mencao-item-body">
          <div class="mencao-item-nome">{{ u.nome }}</div>
          <div class="mencao-item-sub">{{ u.email }}{{ u.matricula ? ' · ' + u.matricula : '' }}</div>
        </div>
        <div v-if="u.setor" class="mencao-item-cargo" style="color:var(--verde)">{{ u.setor }}</div>
        <div v-else class="mencao-item-cargo" style="color:var(--red)">sem MG</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: null },
  usuarios:   { type: Array,  default: () => [] },
  placeholder:{ type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const query    = ref('')
const open     = ref(false)
const inputRef = ref(null)

const filtered = computed(() => {
  if (query.value.length < 1) return []
  const q = query.value.toLowerCase()
  return props.usuarios.filter(u =>
    (u.nome || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q) ||
    (u.matricula || '').toLowerCase().includes(q)
  ).slice(0, 8)
})

function select(u) {
  // Inclui o MG (setor) real da pessoa — usado pelo formulário de pedido
  // pra travar automaticamente o MG marcado no MG de cadastro dela, sem
  // deixar escolher um MG diferente do real (ver ModalNovoPedido.vue).
  emit('update:modelValue', { nome: u.nome, email: u.email, matricula: u.matricula, id: u.id, setor: u.setor || '' })
  query.value = ''
  open.value  = false
}

function clear() {
  emit('update:modelValue', null)
  query.value = ''
  nextTick(() => inputRef.value?.focus())
}

function onBlur() {
  setTimeout(() => { open.value = false }, 200)
}
</script>
