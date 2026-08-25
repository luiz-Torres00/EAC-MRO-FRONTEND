import { onMounted, onUnmounted } from 'vue'

/**
 * Fecha um modal/overlay ao apertar Esc. Passe uma função que decide o que
 * fazer — geralmente `() => emit('close')`. Se o modal tem estados internos
 * que também devem reagir ao Esc primeiro (ex.: um lightbox de fotos aberto
 * dentro do modal), faça essa checagem dentro da função passada.
 */
export function useEscClose(onClose) {
  function handler(e) {
    if (e.key === 'Escape') onClose()
  }
  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
