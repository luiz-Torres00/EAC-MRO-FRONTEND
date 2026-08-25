<template>
  <div class="produto-autocomplete">
    <input
      type="text"
      :value="modelValue"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
      :placeholder="placeholder || 'Buscar conteúdo…'"
      autocomplete="off"
    />
    <div v-if="open && filtered.length" class="produto-dropdown">
      <div
        v-for="(nome, i) in filtered"
        :key="i"
        :class="['produto-item', { selected: i === idx }]"
        @mousedown.prevent="select(nome)"
        @mouseenter="idx = i"
        v-html="highlight(nome)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CONTEUDOS } from '@/data/conteudos'

const props = defineProps({
  modelValue: { type: String, default: '' },
  produtos:   { type: Array,  default: () => [] },
  placeholder:{ type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const idx  = ref(-1)

const allNomes = computed(() => {
  const fromApi = props.produtos.map(p => p.nome).filter(Boolean)
  return [...new Set([...fromApi, ...CONTEUDOS])].sort((a, b) => a.localeCompare(b, 'pt-BR'))
})

const q = computed(() => (props.modelValue || '').trim())

const filtered = computed(() => {
  if (!open.value || !q.value) return []
  const lower = q.value.toLowerCase()
  return allNomes.value.filter(n => n.toLowerCase().includes(lower)).slice(0, 10)
})

function select(nome) {
  emit('update:modelValue', nome)
  open.value = false
  idx.value  = -1
}

function handleInput(e) {
  const v = e.target.value
  emit('update:modelValue', v)
  idx.value  = -1
  open.value = !!v.trim()
}

function handleFocus() {
  if (q.value) open.value = true
}

function handleBlur() {
  setTimeout(() => { open.value = false; idx.value = -1 }, 180)
}

function handleKeydown(e) {
  if (!filtered.value.length) return
  if (e.key === 'ArrowDown') { e.preventDefault(); idx.value = Math.min(idx.value + 1, filtered.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); idx.value = Math.max(idx.value - 1, 0) }
  else if (e.key === 'Enter' && idx.value >= 0) { e.preventDefault(); select(filtered.value[idx.value]) }
  else if (e.key === 'Escape') { open.value = false; idx.value = -1 }
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(text) {
  const query = q.value
  if (!query) return escapeHtml(text)
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return escapeHtml(text)
  const before = escapeHtml(text.slice(0, i))
  const match  = escapeHtml(text.slice(i, i + query.length))
  const after  = escapeHtml(text.slice(i + query.length))
  return `${before}<mark style="background:rgba(0,206,124,.25);color:var(--verde);border-radius:2px;padding:0 1px">${match}</mark>${after}`
}
</script>
