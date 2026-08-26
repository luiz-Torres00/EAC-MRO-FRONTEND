<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-cobranca">
      <div class="modal-header">
        <h3>🔔 Enviar cobrança de devolução</h3>
        <div class="modal-header-right">
          <span class="modal-badge red">COBRANÇA</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <p class="cobr-subtitulo">
          #{{ pedido.codigo || '—' }} <span v-if="pedido.produto">· {{ pedido.produto }}</span>
        </p>

        <div class="cobr-card">
          <div class="cobr-grid4">
            <div>
              <div class="info-label">Código</div>
              <div class="info-value">{{ pedido.codigo || '—' }}</div>
            </div>
            <div>
              <div class="info-label">Devedor</div>
              <div class="info-value" style="color:var(--red)">{{ pedido.solicitante_nome || '—' }}</div>
            </div>
            <div>
              <div class="info-label">E-mail</div>
              <div class="info-value" style="font-size:11px">{{ pedido.solicitante_email || '—' }}</div>
            </div>
            <div>
              <div class="info-label">Dias em atraso</div>
              <div class="info-value" style="color:var(--red)">{{ diasAtraso }} dia(s) em atraso</div>
            </div>
          </div>
        </div>

        <div class="field">
          <label>Tom da mensagem</label>
          <div class="cobr-tons">
            <button
              v-for="op in tons" :key="op.valor" type="button"
              class="cobr-tom-btn" :class="[{ ativo: tom === op.valor }, op.valor]"
              @click="tom = op.valor"
            >
              <div class="cobr-tom-titulo">{{ op.icone }} {{ op.label }}</div>
              <div class="cobr-tom-sub">{{ op.sub }}</div>
            </button>
          </div>
        </div>

        <div class="field">
          <label>
            Mensagem editável
            <span class="cobr-badge-personalize">Personalize antes de enviar</span>
          </label>
          <textarea v-model="mensagem" @input="editadaManualmente = true" rows="6"></textarea>
        </div>

        <p class="cobr-nota">
          🔔 <strong>Notificação automática aos gestores:</strong> ao enviar esta cobrança, todos os gestores do setor
          receberão uma notificação no painel informando que o material <strong>{{ pedido.produto || '—' }}</strong> ainda não foi devolvido.
        </p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-red" @click="confirmar" :disabled="saving || !mensagem.trim()">
          {{ saving ? 'Enviando…' : '🔔 Enviar cobrança' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { pedidosApi } from '@/api'
import { useEscClose } from '@/composables/useEscClose'

const props = defineProps({ pedido: Object })
const emit  = defineEmits(['close', 'feito'])
useEscClose(() => emit('close'))

const tons = [
  { valor: 'gentil',  icone: '💚', label: 'Gentil',  sub: '1ª ou 2ª cobrança' },
  { valor: 'formal',  icone: '📋', label: 'Formal',  sub: 'Reforço necessário' },
  { valor: 'urgente', icone: '🚨', label: 'Urgente', sub: 'Atraso crítico' },
]

const tom              = ref('gentil')
const mensagem         = ref('')
const editadaManualmente = ref(false)
const saving            = ref(false)

const diasAtraso = computed(() => {
  if (!props.pedido.dev_iso) return 0
  const dev  = new Date(props.pedido.dev_iso + 'T00:00:00')
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0); dev.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((hoje - dev) / 86400000))
})

function fmtExtenso(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '—' }
}

function gerarMensagem(tomValor) {
  const nome    = props.pedido.solicitante_nome || 'solicitante'
  const produto = props.pedido.produto || 'o material'
  const prazo   = fmtExtenso(props.pedido.dev_iso)
  const dias    = diasAtraso.value

  if (tomValor === 'urgente') {
    return `Prezado(a) ${nome},\n\nEsta é uma cobrança URGENTE: o material "${produto}" está com ${dias} dia(s) de atraso na devolução (prazo era ${prazo}).\n\nPedimos a devolução imediata para regularizar a situação. Em caso de impedimento, entre em contato conosco o quanto antes para tratarmos uma solução.\n\nAtenciosamente,\nEquipe MRO`
  }
  if (tomValor === 'formal') {
    return `Prezado(a) ${nome},\n\nReforçamos que o material "${produto}" ainda não foi devolvido. O prazo previsto era ${prazo}, o que representa ${dias} dia(s) de atraso.\n\nSolicitamos a devolução o quanto antes. Caso já tenha sido providenciada, desconsidere este aviso.\n\nAtenciosamente,\nEquipe MRO`
  }
  return `Prezado(a) ${nome},\n\nEsperamos que esteja tudo bem! Notamos que o material "${produto}" ainda não foi devolvido — o prazo era ${prazo} (${dias} dia(s) atrás).\n\nPoderia, por gentileza, providenciar a devolução assim que possível? Qualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nEquipe MRO`
}

watch(tom, (novoTom) => {
  if (!editadaManualmente.value) mensagem.value = gerarMensagem(novoTom)
})
mensagem.value = gerarMensagem(tom.value)

async function confirmar() {
  if (!mensagem.value.trim()) { alert('A mensagem não pode ficar vazia.'); return }
  saving.value = true
  try {
    await pedidosApi.cobrarDevolucao(props.pedido.id, { tom: tom.value, mensagem: mensagem.value })
    emit('feito')
  } catch (e) { alert('Erro: ' + (e.response?.data?.detail || e.message)) }
  finally { saving.value = false }
}
</script>

<style scoped>
.cobr-subtitulo {
  font-size: 12px; font-weight: 600; color: var(--label);
  margin-bottom: 16px;
}
.cobr-card {
  background: var(--bg); border: 1px solid var(--border-s);
  border-radius: var(--radius-sm); padding: 14px 16px;
  margin-bottom: 18px;
}
.cobr-grid4 {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}

.cobr-tons {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
}
.cobr-tom-btn {
  font-family: var(--font); text-align: left; cursor: pointer;
  border: 1.5px solid var(--border-s); background: var(--bg);
  border-radius: var(--radius-sm); padding: 10px 12px;
  transition: border-color .15s, background .15s;
}
.cobr-tom-btn:hover { border-color: var(--label); }
.cobr-tom-titulo { font-size: 12.5px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.cobr-tom-sub { font-size: 10.5px; color: var(--muted); font-weight: 600; }
.cobr-tom-btn.ativo.gentil  { border-color: var(--verde);  background: var(--verde-dim); }
.cobr-tom-btn.ativo.formal  { border-color: var(--indigo); background: var(--indigo-dim); }
.cobr-tom-btn.ativo.urgente { border-color: var(--red);    background: var(--red-dim); }

.cobr-badge-personalize {
  display: inline-block; margin-left: 8px;
  font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: var(--verde); background: var(--verde-dim); border: 1px solid var(--verde);
  border-radius: 99px; padding: 2px 8px; vertical-align: middle;
}

.cobr-nota {
  background: var(--red-dim); border: 1px solid var(--red);
  border-radius: var(--radius-sm); padding: 12px 14px;
  font-size: 11.5px; color: var(--text); line-height: 1.55;
  margin-top: 4px;
}
.cobr-nota strong { color: var(--red); }
</style>