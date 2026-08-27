<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal modal-detalhe">
      <div class="modal-header">
        <h3>Detalhes do pedido</h3>
        <div class="modal-header-right">
          <span :class="statusBadgeCls(pedido.status)">{{ STATUS_LABEL[pedido.status] || pedido.status }}</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <!-- Produto -->
        <div style="margin-bottom:16px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:4px">Produto</div>
          <div style="font-size:18px;font-weight:800">{{ pedido.produto || '—' }}</div>
        </div>

        <hr class="sep" />

        <!-- Partes -->
        <div class="detalhe-partes">
          <div class="detalhe-parte">
            <div class="detalhe-parte-role">📤 Solicitante</div>
            <div class="detalhe-parte-nome">{{ pedido.solicitante_nome || '—' }}</div>
            <div v-if="pedido.solicitante_email" class="detalhe-parte-email">{{ pedido.solicitante_email }}</div>
          </div>
          <div class="detalhe-arrow">→</div>
          <div class="detalhe-parte">
            <div class="detalhe-parte-role">📥 Concedente</div>
            <div class="detalhe-parte-nome">{{ pedido.concedente_nome || '—' }}</div>
            <div v-if="pedido.concedente_email" class="detalhe-parte-email">{{ pedido.concedente_email }}</div>
          </div>
        </div>

        <hr class="sep" />

        <!-- Info grid -->
        <div class="pedido-info" style="margin-bottom:16px">
          <div>
            <div class="info-label">Criado em</div>
            <div class="info-value">{{ fmtData(pedido.criado_em) }}</div>
          </div>
          <div v-if="pedido.inicio_iso">
            <div class="info-label">Início</div>
            <div class="info-value">{{ fmtData(pedido.inicio_iso) }}</div>
          </div>
          <div v-if="pedido.dev_iso">
            <div class="info-label">Devolução</div>
            <div class="info-value">{{ fmtData(pedido.dev_iso) }}</div>
          </div>
          <div v-if="pedido.codigo">
            <div class="info-label">Código Empréstimos</div>
            <div class="info-value">{{ pedido.codigo }}</div>
          </div>
          <div v-if="pedido.numero_pedido">
            <div class="info-label">Número do Pedido</div>
            <div class="info-value" style="font-weight:700">{{ pedido.numero_pedido }}</div>
          </div>
          <div v-if="pedido.mg_solicitante">
            <div class="info-label">MG Solicitante</div>
            <div class="info-value" style="color:var(--indigo)">{{ pedido.mg_solicitante }}</div>
          </div>
          <div v-if="pedido.mg_concedente">
            <div class="info-label">MG Concedente</div>
            <div class="info-value" style="color:var(--verde)">{{ pedido.mg_concedente }}</div>
          </div>
        </div>

        <!-- Materiais -->
        <div v-if="itens.length" style="margin-bottom:12px">
          <div class="info-label" style="margin-bottom:6px">Materiais / Itens</div>
          <div class="pedido-materiais">
            <div v-for="(m, i) in itens" :key="i">• {{ m }}</div>
          </div>
        </div>

        <!-- Observação -->
        <div v-if="pedido.observacao" style="margin-bottom:12px">
          <div class="info-label" style="margin-bottom:4px">Observação</div>
          <div style="font-size:13px;color:var(--label);font-weight:500">{{ pedido.observacao }}</div>
        </div>

        <!-- Ocorrência -->
        <div v-if="pedido.ocorrencia?.tipo" class="ocorrencia-box" style="margin-bottom:12px">
          <div style="font-weight:800;margin-bottom:4px">⚠️ {{ pedido.ocorrencia.tipo }}</div>
          <div v-if="pedido.ocorrencia.descricao" style="font-weight:500">{{ pedido.ocorrencia.descricao }}</div>
        </div>

        <!-- Fotos -->
        <div v-if="fotos.length" style="margin-bottom:12px">
          <div class="info-label" style="margin-bottom:6px">Fotos</div>
          <div class="fotos-grid">
            <img v-for="(f, i) in fotos" :key="i" class="foto-thumb"
              :src="fotoSrc(f)"
              :alt="`Foto ${i+1}`"
              @click="abrirLightbox(i)" />
          </div>
        </div>

        <!-- Lightbox de fotos: navega entre elas sem sair do app -->
        <div v-if="lightboxIndex !== null" class="lightbox-overlay" @click.self="lightboxIndex = null">
          <button class="lightbox-close" @click="lightboxIndex = null">✕</button>
          <button v-if="fotos.length > 1" class="lightbox-nav lightbox-prev" @click="navegarLightbox(-1)">‹</button>
          <img class="lightbox-img" :src="fotoSrc(fotos[lightboxIndex])" :alt="`Foto ${lightboxIndex + 1}`" />
          <button v-if="fotos.length > 1" class="lightbox-nav lightbox-next" @click="navegarLightbox(1)">›</button>
          <div v-if="fotos.length > 1" class="lightbox-contador">{{ lightboxIndex + 1 }} / {{ fotos.length }}</div>
        </div>

        <!-- PDFs -->
        <div v-if="(pedido.pdfs || []).length" style="margin-bottom:12px">
          <div class="info-label" style="margin-bottom:6px">Documentos PDF</div>
          <div class="anexo-pdf-lista">
            <div v-for="(f, i) in pedido.pdfs" :key="i" class="anexo-pdf-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span class="anexo-pdf-nome">{{ f.nome || `Documento ${i+1}` }}</span>
              <a v-if="f.data" :href="f.data" :download="f.nome || `doc-${i+1}.pdf`"
                class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:10px">Baixar</a>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({ pedido: Object })
const emit  = defineEmits(['close'])

const STATUS_LABEL = {
  pendente: 'Aguardando aprovação', aprovado: 'Aprovado / Liberado',
  aguardando_devolucao: 'Aguard. confirmação devolução',
  devolvido: 'Devolvido', cancelado: 'Cancelado', recusado: 'Recusado',
}
function statusBadgeCls(s) {
  const map = { pendente:'status-pendente', aprovado:'status-aprovado',
    aguardando_devolucao:'status-aguardando_devolucao', devolvido:'status-devolvido',
    cancelado:'status-cancelado', recusado:'status-recusado' }
  return `status-badge ${map[s] || ''}`
}
function fmtData(val) {
  if (!val) return '—'
  try { return new Date(val.length === 10 ? val+'T00:00:00' : val).toLocaleDateString('pt-BR') }
  catch { return '—' }
}

const fotos  = computed(() => props.pedido.fotos || [])
const itens  = computed(() => Array.isArray(props.pedido.materiais) ? props.pedido.materiais : [])

function fotoSrc(f) {
  return f.startsWith('data:') ? f : `data:image/jpeg;base64,${f}`
}

const lightboxIndex = ref(null)
function abrirLightbox(i) { lightboxIndex.value = i }
function navegarLightbox(delta) {
  if (lightboxIndex.value === null) return
  const total = fotos.value.length
  lightboxIndex.value = (lightboxIndex.value + delta + total) % total
}

function onKeydown(e) {
  if (lightboxIndex.value === null) {
    // Sem lightbox aberto, Esc fecha o modal de detalhes inteiro.
    if (e.key === 'Escape') emit('close')
    return
  }
  if (e.key === 'Escape') lightboxIndex.value = null
  if (e.key === 'ArrowLeft') navegarLightbox(-1)
  if (e.key === 'ArrowRight') navegarLightbox(1)
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.lightbox-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.88);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.lightbox-img { max-width: 90vw; max-height: 85vh; border-radius: 8px; object-fit: contain; }
.lightbox-close {
  position: absolute; top: 18px; right: 22px; background: transparent; border: none;
  color: #fff; font-size: 22px; cursor: pointer; line-height: 1;
}
.lightbox-nav {
  position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.12);
  border: none; color: #fff; font-size: 28px; width: 44px; height: 44px; border-radius: 99px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.lightbox-nav:hover { background: rgba(255,255,255,.25); }
.lightbox-prev { left: 18px; }
.lightbox-next { right: 18px; }
.lightbox-contador {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  color: #fff; font-size: 12px; background: rgba(0,0,0,.5); padding: 4px 10px; border-radius: 99px;
}
</style>
