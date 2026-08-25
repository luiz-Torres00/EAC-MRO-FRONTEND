<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>Novo pedido de Empréstimo</h3>
        <div class="modal-header-right">
          <span class="modal-badge verde">{{ form.tipo }}</span>
          <button class="modal-close" @click="emit('close')">✕</button>
        </div>
      </div>

      <div class="modal-body">
        <!-- Número do pedido -->
        <div class="field">
          <label>Número do pedido <span class="opcional">(opcional)</span></label>
          <input type="text" v-model="form.numero_pedido" placeholder="Ex: 0001, OS-4521…" />
        </div>

        <!-- Solicitante + Concedente (pessoas) -->
        <div class="field-row">
          <div class="field">
            <label>Solicitante <span class="obrigatorio">*</span></label>
            <MencaoUsuario v-model="solicitanteObj" :usuarios="usuarios" placeholder="Buscar solicitante…" />
          </div>
          <div class="field">
            <label>Concedente <span class="obrigatorio">*</span></label>
            <MencaoUsuario v-model="concedenteObj" :usuarios="usuarios" placeholder="Buscar concedente…" />
          </div>
        </div>

        <!-- Produto Solicitante -->
        <div class="field">
          <label style="display:flex;align-items:center;justify-content:space-between">
            <span>Produto Solicitante <span class="obrigatorio">*</span></span>
            <select v-model="form.mg_solicitante" disabled title="O MG vem automaticamente do cadastro da pessoa marcada como solicitante — não dá pra escolher um MG diferente do real dela." style="background:var(--card);border:1px solid var(--border);border-radius:99px;color:var(--text);font-size:10px;font-weight:700;padding:2px 8px;cursor:not-allowed;opacity:.85">
              <option value="">{{ solicitanteObj ? 'sem MG cadastrado' : 'selecione o solicitante' }}</option>
              <option v-for="mg in MGs" :key="mg" :value="mg">{{ mg }}</option>
            </select>
          </label>
          <ProdutoAutocomplete v-model="form.produto" :produtos="produtos" placeholder="Buscar ou digitar produto solicitante…" />
        </div>

        <!-- Produto Concedente -->
        <div class="field">
          <label style="display:flex;align-items:center;justify-content:space-between">
            <span>Produto Concedente <span class="opcional">(opcional)</span></span>
            <select v-model="form.mg_concedente" disabled title="O MG vem automaticamente do cadastro da pessoa marcada como concedente — não dá pra escolher um MG diferente do real dela." style="background:var(--card);border:1px solid var(--border);border-radius:99px;color:var(--text);font-size:10px;font-weight:700;padding:2px 8px;cursor:not-allowed;opacity:.85">
              <option value="">{{ concedenteObj ? 'sem MG cadastrado' : 'MG' }}</option>
              <option v-for="mg in MGs" :key="mg" :value="mg">{{ mg }}</option>
            </select>
          </label>
          <ProdutoAutocomplete v-model="form.produto_concedente" :produtos="produtos" placeholder="Identificação/código do concedente…" />
        </div>

        <!-- Datas -->
        <div class="field">
          <label>Início e previsão de devolução <span class="obrigatorio">*</span></label>
          <CalendarioRange v-model:inicio="form.inicio_iso" v-model:fim="form.dev_iso" />
        </div>

        <!-- Materiais -->
        <div class="field">
          <label>Materiais / Itens</label>
          <div v-for="(m, i) in materiais" :key="i" class="material-row">
            <input type="text" v-model="materiais[i]" :placeholder="`Item ${i + 1}…`" />
            <button v-if="materiais.length > 1" type="button"
              @click="materiais.splice(i, 1)"
              style="background:transparent;border:none;color:var(--red);cursor:pointer;font-size:16px;padding:0 4px">×</button>
          </div>
          <button type="button" class="btn-add-row" @click="materiais.push('')">+ Adicionar item</button>
        </div>

        <!-- Observação -->
        <div class="field">
          <label>Observação <span class="opcional">(opcional)</span></label>
          <textarea v-model="form.observacao" placeholder="Alguma observação importante…" rows="3" />
        </div>

        <!-- Fotos -->
        <div class="field">
          <label>Fotos <span class="opcional">(opcional · máx. 5 · 15 MB cada)</span></label>
          <div class="anexo-dropzone" @click="fotoRef?.click()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Clique para adicionar fotos</span>
            <span style="font-size:10px;color:var(--muted)">JPG, PNG — comprimidas automaticamente</span>
          </div>
          <input ref="fotoRef" type="file" accept="image/*" multiple style="display:none" @change="handleFotos" />
          <div v-if="fotos.length" class="anexo-fotos-grid">
            <div v-for="(f, i) in fotos" :key="i" class="anexo-foto-wrap">
              <img :src="f.preview" :alt="f.name" class="anexo-foto-thumb" />
              <button type="button" class="anexo-foto-remove" @click="fotos.splice(i, 1)" title="Remover">✕</button>
            </div>
          </div>
        </div>

        <!-- PDFs -->
        <div class="field">
          <label>PDFs <span class="opcional">(opcional · máx. 3 · 5 MB cada)</span></label>
          <div class="anexo-dropzone" @click="pdfRef?.click()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>Clique para adicionar PDFs</span>
            <span style="font-size:10px;color:var(--muted)">Somente arquivos .pdf</span>
          </div>
          <input ref="pdfRef" type="file" accept=".pdf,application/pdf" multiple style="display:none" @change="handlePdfs" />
          <div v-if="pdfs.length" class="anexo-pdf-lista">
            <div v-for="(f, i) in pdfs" :key="i" class="anexo-pdf-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span class="anexo-pdf-nome">{{ f.name }}</span>
              <span class="anexo-pdf-size">{{ (f.size / 1024).toFixed(0) }} KB</span>
              <button type="button" class="anexo-pdf-remove" @click="pdfs.splice(i, 1)">✕</button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('close')">Cancelar</button>
        <button class="btn btn-primary" @click="salvar" :disabled="saving">
          {{ saving ? 'Salvando…' : 'Criar pedido' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { pedidosApi, authApi, produtosApi } from '@/api'
import MencaoUsuario from '@/components/MencaoUsuario.vue'
import ProdutoAutocomplete from '@/components/ProdutoAutocomplete.vue'
import CalendarioRange from '@/components/CalendarioRange.vue'
import { useEscClose } from '@/composables/useEscClose'

const emit = defineEmits(['close', 'salvo'])
const auth = useAuthStore()
useEscClose(() => emit('close'))

const saving   = ref(false)
const fotoRef  = ref(null)
const pdfRef   = ref(null)
const materiais = reactive([''])
const fotos    = reactive([])
const pdfs     = reactive([])
const usuarios = ref([])
const produtos = ref([])

const MGs = ['MG1','MG2','MG3','MG4','Cenografia','Arte']

// Solicitante já vem preenchido com quem está logado (pode trocar se precisar
// registrar o pedido em nome de outra pessoa)
const solicitanteObj = ref(
  auth.user ? { nome: auth.user.nome || auth.user.email, email: auth.user.email, matricula: auth.user.matricula, id: auth.user.id, setor: auth.user.setor || '' } : null
)
const concedenteObj = ref(null)

const form = reactive({
  numero_pedido: '', produto: '', produto_concedente: '',
  mg_solicitante: '', mg_concedente: '',
  inicio_iso: '', dev_iso: '', observacao: '', tipo: 'Empréstimo',
})

onMounted(async () => {
  try { usuarios.value = (await authApi.usuarios()).data } catch { /* segue sem lista */ }
  try { produtos.value = (await produtosApi.listar()).data } catch { /* segue sem lista */ }
})

// O MG do pedido não é escolhido livremente: ele é sempre o MG cadastrado
// da pessoa marcada como solicitante/concedente. Isso evita marcar um MG
// diferente do real da pessoa só pra abrir (ou esconder) a visibilidade do
// pedido pra um MG que não tem nada a ver com o empréstimo — o backend
// também recusa isso, mas aqui nem dá pra tentar.
watch(solicitanteObj, u => { form.mg_solicitante = u?.setor || '' }, { immediate: true })
watch(concedenteObj,  u => { form.mg_concedente  = u?.setor || '' })

async function compressImage(file, maxPx = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject; img.src = url
  })
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleFotos(e) {
  const files = Array.from(e.target.files || []).slice(0, 5 - fotos.length)
  for (const f of files) {
    if (f.size > 15 * 1024 * 1024) { alert(`"${f.name}" excede 15 MB.`); continue }
    const data64 = await compressImage(f)
    fotos.push({ name: f.name, preview: data64, data64 })
  }
  e.target.value = ''
}

async function handlePdfs(e) {
  const files = Array.from(e.target.files || []).slice(0, 3 - pdfs.length)
  for (const f of files) {
    if (f.size > 5 * 1024 * 1024) { alert(`"${f.name}" excede 5 MB.`); continue }
    const data64 = await readAsBase64(f)
    pdfs.push({ name: f.name, size: f.size, data64 })
  }
  e.target.value = ''
}

async function salvar() {
  if (!form.produto.trim())    { alert('Informe o produto solicitante.'); return }
  if (!solicitanteObj.value)   { alert('Informe o solicitante.'); return }
  if (!concedenteObj.value)    { alert('Informe o concedente.'); return }
  if (!form.mg_solicitante)    { alert('O solicitante marcado não tem MG cadastrado. Configure o MG dela em Usuários antes de criar o pedido.'); return }
  if (!form.inicio_iso || !form.dev_iso) { alert('Selecione a data de início e de devolução no calendário.'); return }
  saving.value = true
  try {
    const payload = {
      ...form,
      solicitante:       solicitanteObj.value?.id    || null,
      concedente:        concedenteObj.value?.id     || null,
      solicitante_nome:  solicitanteObj.value?.nome   || '',
      solicitante_email: solicitanteObj.value?.email  || '',
      concedente_nome:   concedenteObj.value?.nome    || '',
      concedente_email:  concedenteObj.value?.email   || '',
      materiais: materiais.filter(m => m.trim()),
      fotos: fotos.map(f => f.data64),
      pdfs:  pdfs.map(f => ({ nome: f.name, data: f.data64 })),
      status: 'pendente',
    }
    await pedidosApi.criar(payload)
    emit('salvo')
  } catch (e) {
    alert('Erro ao salvar: ' + (e.response?.data?.detail || e.message))
  } finally {
    saving.value = false
  }
}
</script>
