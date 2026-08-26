<template>
  <div :class="['pedido-card', p.status]">
    <!-- Topo: tÃ­tulo + badge -->
    <div class="pedido-top">
      <div>
        <div class="pedido-titulo">{{ p.produto || 'Sem tÃ­tulo' }}</div>
        <div class="pedido-partes">
          <div class="parte-chip-wrap">
            <span :class="['parte-chip', { eu: isMeSol }]">{{ solNome }}</span>
            <span v-if="solEmail" class="parte-chip-email">{{ solEmail }}</span>
          </div>
          <span class="arrow">â†’</span>
          <div class="parte-chip-wrap">
            <span :class="['parte-chip', { eu: isMeCon }]">{{ conNome }}</span>
            <span v-if="conEmail" class="parte-chip-email">{{ conEmail }}</span>
          </div>
          <span v-if="p.mg_solicitante" class="parte-chip" style="color:var(--indigo);border-color:var(--indigo)">{{ p.mg_solicitante }}</span>
          <span v-if="p.mg_concedente"  class="parte-chip" style="color:var(--verde);border-color:var(--verde)">{{ p.mg_concedente }}</span>
        </div>
      </div>
      <span :class="statusBadgeCls(p.status)">
        {{ statusEmoji(p.status) }}{{ STATUS_LABEL[p.status] || p.status }}
      </span>
    </div>

    <!-- Grid info -->
    <div class="pedido-info">
      <div v-if="p.numero_pedido">
        <div class="info-label">NÃºmero do Pedido</div>
        <div class="info-value" style="font-weight:700">{{ p.numero_pedido }}</div>
      </div>
      <div>
        <div class="info-label">Quem â†’ Quem</div>
        <div class="info-value" style="font-size:11px;font-weight:600" :title="`${solNome} â†’ ${conNome}`">
          {{ solNome }} â†’ {{ conNome }}
        </div>
      </div>
      <div>
        <div class="info-label">Criado em</div>
        <div class="info-value">{{ fmtData(p.criado_em) }}</div>
      </div>
      <div v-if="p.dev_iso">
        <div class="info-label">DevoluÃ§Ã£o</div>
        <div :class="['info-value', diasCls]">
          {{ fmtData(p.dev_iso) }}
          <span v-if="dias !== null" style="font-size:14px;font-weight:800;margin-left:4px">
            ({{ dias < 0 ? Math.abs(dias)+'d atraso' : dias === 0 ? 'hoje' : dias+'d' }})
          </span>
        </div>
      </div>
      <div v-if="p.produto_concedente">
        <div class="info-label">Prod. Concedente</div>
        <div class="info-value" style="font-size:11px">{{ p.produto_concedente }}</div>
      </div>
    </div>

    <!-- Materiais -->
    <div v-if="materiais.length" class="pedido-materiais">
      ðŸ“¦ {{ materiais.join(' Â· ') }}
    </div>

    <!-- OcorrÃªncia -->
    <div v-if="p.ocorrencia?.tipo" class="ocorrencia-box">
      âš ï¸ OcorrÃªncia: {{ p.ocorrencia.tipo }}
      <template v-if="p.ocorrencia.descricao"> â€” {{ p.ocorrencia.descricao }}</template>
    </div>

    <!-- AÃ§Ãµes -->
    <div class="pedido-actions">
      <button class="btn btn-ghost btn-sm" @click="emit('detalhe', p)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Ver detalhes
      </button>

      <template v-if="auth.perm('eac_aprovar') && p.status === 'pendente'">
        <button class="btn btn-green btn-sm" @click="emit('aprovar', p)">âœ“ Aprovar</button>
        <button class="btn btn-red btn-sm"   @click="emit('recusar', p)">âœ• Recusar</button>
      </template>

      <button v-if="auth.perm('eac_devolver') && ['aprovado','aguardando_devolucao'].includes(p.status)"
        class="btn btn-amber btn-sm" @click="emit('devolver', p)">â†© Devolver</button>

      <button v-if="auth.perm('eac_estender') && p.status === 'aprovado'"
        class="btn btn-ghost btn-sm" @click="emit('estender', p)">ðŸ“… Estender</button>

      <button v-if="(isMeCon || auth?.user?.is_staff) && !['recusado','cancelado'].includes(p.status)"
        class="btn btn-red btn-sm" @click="emit('ocorrencia', p)" title="SÃ³ quem emprestou o material pode abrir ocorrÃªncia">âš ï¸ Abrir ocorrÃªncia</button>

      <button v-if="(isMeCon || auth?.user?.is_staff) && atrasado"
        class="btn btn-red btn-sm" @click="emit('cobrar', p)" title="SÃ³ quem emprestou o material pode cobrar â€” e sÃ³ quando o pedido estÃ¡ em atraso">ðŸ”” Cobrar devoluÃ§Ã£o</button>

      <button class="btn btn-ghost btn-sm" @click="emit('editarNumero', p)" title="SÃ³ o nÃºmero do pedido pode ser editado depois de criado">
        âœŽ NÂº pedido
      </button>

      <button v-if="auth?.user?.is_staff" class="btn btn-ghost btn-sm" style="color:var(--red)" @click="emit('excluir', p)" title="Excluir pedido (sÃ³ admin)">
        ðŸ—‘ Excluir
      </button>

      <span v-if="dias !== null && dias < 0 && p.status === 'aprovado'"
        style="margin-left:auto;font-size:10px;font-weight:700;color:var(--red);display:flex;align-items:center;gap:4px">
        âš ï¸ {{ Math.abs(dias) }}d em atraso
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ p: Object, auth: Object })
const emit  = defineEmits(['detalhe','aprovar','recusar','devolver','estender','ocorrencia','cobrar','editarNumero','excluir'])

const STATUS_LABEL = {
  pendente: 'Aguardando aprovaÃ§Ã£o', aprovado: 'Aprovado / Liberado',
  aguardando_devolucao: 'Aguard. confirmaÃ§Ã£o devoluÃ§Ã£o',
  devolvido: 'Devolvido', cancelado: 'Cancelado', recusado: 'Recusado',
}
function statusEmoji(s) {
  return { pendente:'â³ ', aprovado:'âœ… ', devolvido:'â†© ', recusado:'âœ• ', aguardando_devolucao:'ðŸ”„ ' }[s] || ''
}
function statusBadgeCls(s) {
  const map = { pendente:'status-pendente', aprovado:'status-aprovado',
    aguardando_devolucao:'status-aguardando_devolucao', devolvido:'status-devolvido',
    cancelado:'status-cancelado', recusado:'status-recusado' }
  return `status-badge ${map[s] || ''}`
}
function fmtData(val) {
  if (!val) return 'â€”'
  try { return new Date(val.length === 10 ? val+'T00:00:00' : val).toLocaleDateString('pt-BR') }
  catch { return 'â€”' }
}

const solNome  = computed(() => props.p.solicitante_nome  || 'â€”')
const solEmail = computed(() => props.p.solicitante_email || '')
const conNome  = computed(() => props.p.concedente_nome   || 'â€”')
const conEmail = computed(() => props.p.concedente_email  || '')

const isMeSol  = computed(() => props.auth?.user?.email && solEmail.value && solEmail.value.toLowerCase() === props.auth.user.email.toLowerCase())
const isMeCon  = computed(() => props.auth?.user?.email && conEmail.value && conEmail.value.toLowerCase() === props.auth.user.email.toLowerCase())

const dias = computed(() => {
  if (!props.p.dev_iso) return null
  const dev = new Date(props.p.dev_iso + 'T00:00:00')
  const hoje = new Date(); hoje.setHours(0,0,0,0); dev.setHours(0,0,0,0)
  return Math.round((dev - hoje) / 86400000)
})
const diasCls = computed(() => {
  const d = dias.value
  if (d === null) return ''
  if (d < 0) return 'err'
  if (d <= 3) return 'warn'
  return 'ok'
})
const materiais = computed(() => Array.isArray(props.p.materiais) ? props.p.materiais : [])

// "Cobrar devoluÃ§Ã£o" sÃ³ faz sentido (e sÃ³ Ã© aceito pelo backend) quando o
// pedido ainda estÃ¡ em posse de alguÃ©m e o prazo jÃ¡ passou â€” mesma regra
// aplicada em CobrarDevolucaoView.post().
const atrasado = computed(() =>
  dias.value !== null && dias.value < 0 &&
  ['aprovado', 'aguardando_devolucao'].includes(props.p.status)
)
</script>
