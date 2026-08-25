<template>
  <div class="paginacao-wrap">
    <div class="paginacao-info">
      <span>Registros por página</span>
      <select class="paginacao-select" :value="itensPorPagina"
        @change="emit('update:itensPorPagina', Number($event.target.value)); emit('update:pagina', 1)">
        <option v-for="n in [12,24,48]" :key="n" :value="n">{{ n }}</option>
      </select>
      <span class="paginacao-total">{{ total }} {{ total === 1 ? 'registro' : 'registros' }}</span>
    </div>

    <div class="paginacao-nav">
      <button class="paginacao-btn" @click="emit('update:pagina', Math.max(1, pagina - 1))"
        :disabled="pagina === 1">‹</button>

      <template v-for="(p, i) in paginas" :key="i">
        <span v-if="p === '...'" class="paginacao-dots">…</span>
        <button v-else class="paginacao-btn" :class="{ active: pagina === p }"
          @click="emit('update:pagina', p)">{{ p }}</button>
      </template>

      <button class="paginacao-btn" @click="emit('update:pagina', Math.min(totalPaginas, pagina + 1))"
        :disabled="pagina === totalPaginas">›</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  total:          { type: Number, required: true },
  itensPorPagina: { type: Number, required: true },
  pagina:         { type: Number, required: true },
})
const emit = defineEmits(['update:itensPorPagina', 'update:pagina'])

const totalPaginas = computed(() => Math.max(1, Math.ceil(props.total / props.itensPorPagina)))

const paginas = computed(() => {
  const n = totalPaginas.value
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const p = props.pagina
  const pages = [1]
  if (p > 4)     pages.push('...')
  const start = Math.max(2, p - 2)
  const end   = Math.min(n - 1, p + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  if (p < n - 3) pages.push('...')
  pages.push(n)
  return pages
})
</script>
