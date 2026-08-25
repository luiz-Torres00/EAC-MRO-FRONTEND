import { ref } from 'vue'

// Estado do tema é module-level (singleton) de propósito: assim a mudança
// feita em qualquer lugar (ex.: botão no topbar) reflete em todo o app sem
// precisar de um store Pinia só pra isso, e o tema já é aplicado no <html>
// assim que este arquivo é importado pela primeira vez (evita "flash" de
// tema errado ao carregar a página).
const theme = ref(localStorage.getItem('theme') || 'dark')

function aplicar(t) {
  document.documentElement.setAttribute('data-theme', t)
}
aplicar(theme.value)

export function useTheme() {
  function alternar() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', theme.value)
    aplicar(theme.value)
  }
  return { theme, alternar }
}
