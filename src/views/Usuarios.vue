<template>
  <div>
    <div class="section-header">
      <h3 style="font-size:14px;font-weight:700;color:var(--text)">Usuários & Permissões</h3>
      <div style="display:flex;gap:8px">
        <button v-if="auth.user?.is_staff" class="btn btn-sm" @click="modalEstudios = true">
          🔗 Vincular estúdios aos MGs
        </button>
        <button v-if="auth.user?.is_staff" class="btn btn-primary btn-sm" @click="abrirNovoUsuario">
          + Novo usuário
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-full">Carregando…</div>
    <div v-else-if="error" style="color:var(--red);padding:20px">{{ error }}</div>

    <div v-else>
      <!-- Solicitações pendentes -->
      <div v-if="solicitacoes.length" style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--amber);margin-bottom:10px">
          ⏳ Solicitações de acesso pendentes ({{ solicitacoes.length }})
        </div>
        <div v-for="s in solicitacoes" :key="s.id" class="pedido-card pendente" style="margin-bottom:8px">
          <div class="pedido-top">
            <div>
              <div class="pedido-titulo">{{ s.nome }} {{ s.sobrenome }}</div>
              <div style="font-size:11px;color:var(--muted)">{{ s.email }} · {{ s.setor }} · {{ s.cargo }}</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-green btn-sm" @click="aprovar(s.id)">✓ Aprovar</button>
              <button class="btn btn-red btn-sm"   @click="recusar(s.id)">✕ Recusar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Gestão de cargos (só admin) -->
      <div v-if="auth.user?.is_staff" style="margin-bottom:24px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:10px">
          Cargos ({{ cargos.length }})
        </div>
        <div class="dash-card">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
            <div v-for="c in cargos" :key="c.id" class="parte-chip" style="display:flex;align-items:center;gap:6px">
              <span>{{ c.nome }}</span>
              <label style="display:flex;align-items:center;gap:3px;font-size:10px;cursor:pointer">
                <input type="checkbox" :checked="c.is_gestao" @change="toggleGestao(c)" />
                gestão
              </label>
              <button @click="excluirCargo(c)" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:12px">✕</button>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <input v-model="novoCargoNome" placeholder="Nome do novo cargo…" class="input" style="flex:1;max-width:280px" @keyup.enter="criarCargo" />
            <button class="btn btn-primary btn-sm" @click="criarCargo">+ Adicionar cargo</button>
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:8px">
            Cargos marcados como "gestão" recebem notificação automática quando um material sai do armazém (MG) deles.
          </div>
        </div>
      </div>

      <!-- Lista de usuários -->
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:10px">
        Usuários ativos ({{ usuarios.length }})
      </div>
      <div v-for="u in usuarios" :key="u.id" class="pedido-card" style="margin-bottom:8px">
        <div class="pedido-top">
          <div>
            <div class="pedido-titulo">{{ u.nome }} {{ u.sobrenome }}</div>
            <div class="pedido-partes">
              <span class="parte-chip">{{ u.email }}</span>
              <span v-if="u.setor" class="parte-chip" style="color:var(--verde);border-color:var(--verde)">{{ u.setor }}</span>
              <span v-if="u.cargo" class="parte-chip">{{ u.cargo }}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span v-if="u.is_staff" class="status-badge status-aprovado">Admin</span>
            <button v-if="auth.user?.is_staff" class="btn btn-sm" @click="toggleEdicao(u)">
              {{ editando === u.id ? 'Fechar' : 'Editar' }}
            </button>
            <button v-if="auth.user?.is_staff && u.id !== auth.user?.id" class="btn btn-sm" style="color:var(--red)" @click="removerUsuario(u)" title="Remove o usuário e todos os acessos dele do sistema">
              🗑 Remover
            </button>
          </div>
        </div>

        <!-- Painel de edição (admin) -->
        <div v-if="editando === u.id" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
            <label style="font-size:12px">
              Setor
              <select v-model="edit.setor" class="paginacao-select" style="display:block;margin-top:4px">
                <option value="">—</option>
                <option v-for="s in SETORES" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>
            <label style="font-size:12px">
              Cargo
              <select v-model="edit.cargo" class="paginacao-select" style="display:block;margin-top:4px">
                <option value="">—</option>
                <option v-for="c in cargos" :key="c.id" :value="c.nome">{{ c.nome }}</option>
              </select>
            </label>
            <label style="font-size:12px;display:flex;align-items:center;gap:6px;margin-top:18px">
              <input type="checkbox" v-model="edit.is_staff" />
              Administrador (acesso total)
            </label>
          </div>

          <div v-if="!edit.is_staff" style="margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted);margin-bottom:6px">
              Permissões específicas
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:12px">
              <label v-for="p in PERMISSOES" :key="p.key" style="display:flex;align-items:center;gap:6px;font-size:12px">
                <input type="checkbox" v-model="edit.perms[p.key]" />
                {{ p.label }}
              </label>
            </div>
          </div>

          <button class="btn btn-primary btn-sm" @click="salvarEdicao(u)">Salvar alterações</button>
        </div>
      </div>
    </div>

    <!-- Modal Novo usuário -->
    <div v-if="modalNovo" class="modal-overlay" @click.self="modalNovo = false">
      <div class="modal-box">
        <h3 style="margin-bottom:16px">Novo usuário</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <input v-model="novo.nome" placeholder="Nome" class="input" />
          <input v-model="novo.sobrenome" placeholder="Sobrenome" class="input" />
          <input v-model="novo.email" placeholder="E-mail" class="input" type="email" />
          <input v-model="novo.password" placeholder="Senha provisória" class="input" type="password" />
          <input v-model="novo.matricula" placeholder="Matrícula" class="input" @input="onMatriculaInput" inputmode="numeric" pattern="[0-9]*" />
          <select v-model="novo.setor" class="input">
            <option value="">Setor —</option>
            <option v-for="s in SETORES" :key="s" :value="s">{{ s }}</option>
          </select>
          <select v-model="novo.cargo" class="input">
            <option value="">Cargo —</option>
            <option v-for="c in cargos" :key="c.id" :value="c.nome">{{ c.nome }}</option>
          </select>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px">
            <input type="checkbox" v-model="novo.is_staff" /> Administrador
          </label>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
          <button class="btn btn-sm" @click="modalNovo = false">Cancelar</button>
          <button class="btn btn-primary btn-sm" @click="criarUsuario" :disabled="salvandoNovo">
            {{ salvandoNovo ? 'Criando…' : 'Criar usuário' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Vincular estúdios aos MGs -->
    <div v-if="modalEstudios" class="modal-overlay" @click.self="modalEstudios = false">
      <div class="modal-box" style="width:440px">
        <h3 style="margin-bottom:16px">Vincular estúdios aos MGs</h3>
        <div style="font-size:11px;color:var(--muted);margin-bottom:14px">
          Cadastre os estúdios que existem em cada MG. Ao marcar a localização de um empréstimo como "Estúdio",
          só aparecem os estúdios do MG do próprio pedido.
        </div>

        <div v-for="mg in SETORES" :key="mg" style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--verde);margin-bottom:6px">
            {{ mg }}
          </div>
          <div v-if="!estudiosPorMg[mg]?.length" style="font-size:11px;color:var(--muted);margin-bottom:6px">
            Nenhum estúdio cadastrado ainda.
          </div>
          <div v-else style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px">
            <div v-for="e in estudiosPorMg[mg]" :key="e.id" class="parte-chip" style="display:flex;align-items:center;gap:6px">
              <span>{{ e.nome }}</span>
              <button @click="excluirEstudio(e)" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:12px">✕</button>
            </div>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:8px;padding-top:12px;border-top:1px solid var(--border)">
          <select v-model="novoEstudioMg" class="input" style="max-width:130px">
            <option value="">MG —</option>
            <option v-for="s in SETORES" :key="s" :value="s">{{ s }}</option>
          </select>
          <input v-model="novoEstudioNome" placeholder="Nome do estúdio…" class="input" style="flex:1" @keyup.enter="criarEstudio" />
          <button class="btn btn-primary btn-sm" @click="criarEstudio" :disabled="salvandoEstudio">
            {{ salvandoEstudio ? 'Salvando…' : '+ Adicionar' }}
          </button>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:16px">
          <button class="btn btn-sm" @click="modalEstudios = false">Fechar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { authApi, estudiosApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useEscClose } from '@/composables/useEscClose'

const auth = useAuthStore()
useEscClose(() => {
  if (modalNovo.value) modalNovo.value = false
  if (modalEstudios.value) modalEstudios.value = false
})

const usuarios     = ref([])
const solicitacoes = ref([])
const cargos       = ref([])
const estudios     = ref([])
const loading      = ref(false)
const error        = ref(null)

const SETORES = ['MG1', 'MG2', 'MG3', 'MG4', 'Cenografia', 'Arte']
const PERMISSOES = [
  { key: 'eac_criar',    label: 'Criar pedido' },
  { key: 'eac_aprovar',  label: 'Aprovar pedido' },
  { key: 'eac_devolver', label: 'Registrar devolução' },
  { key: 'eac_estender', label: 'Estender prazo' },
  { key: 'rel_ver',      label: 'Ver relatórios' },
  { key: 'dash_ver',     label: 'Ver dashboard' },
  { key: 'usr_ver',      label: 'Ver usuários' },
  { key: 'notif_ver',    label: 'Ver notificações' },
]

const editando = ref(null)
const edit = reactive({ setor: '', cargo: '', is_staff: false, perms: {} })

const modalNovo    = ref(false)
const salvandoNovo = ref(false)
const novo = reactive({ nome: '', sobrenome: '', email: '', password: '', matricula: '', setor: '', cargo: '', is_staff: false })

const novoCargoNome = ref('')

const modalEstudios   = ref(false)
const salvandoEstudio = ref(false)
const novoEstudioMg   = ref('')
const novoEstudioNome = ref('')

const estudiosPorMg = computed(() => {
  const grupos = {}
  for (const e of estudios.value) {
    if (!grupos[e.mg]) grupos[e.mg] = []
    grupos[e.mg].push(e)
  }
  return grupos
})

async function carregar() {
  loading.value = true
  error.value   = null
  try {
    const [usRes, solRes, cargosRes, estudiosRes] = await Promise.all([
      authApi.usuarios(),
      authApi.solicitacoes().catch(() => ({ data: [] })),
      authApi.cargos().catch(() => ({ data: [] })),
      estudiosApi.listar().catch(() => ({ data: [] })),
    ])
    usuarios.value     = usRes.data
    solicitacoes.value = solRes.data
    cargos.value        = cargosRes.data
    estudios.value       = Array.isArray(estudiosRes.data) ? estudiosRes.data : (estudiosRes.data.results || [])
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function aprovar(id) {
  try { await authApi.aprovarSolic(id); await carregar() }
  catch (e) { alert('Erro: ' + e.message) }
}

async function recusar(id) {
  try { await authApi.recusarSolic(id); await carregar() }
  catch (e) { alert('Erro: ' + e.message) }
}

function toggleEdicao(u) {
  if (editando.value === u.id) { editando.value = null; return }
  editando.value = u.id
  edit.setor    = u.setor    || ''
  edit.cargo    = u.cargo    || ''
  edit.is_staff = !!u.is_staff
  edit.perms    = { ...(u.perms || {}) }
}

async function salvarEdicao(u) {
  try {
    const { data } = await authApi.atualizarUsuario(u.id, {
      setor: edit.setor, cargo: edit.cargo, is_staff: edit.is_staff, perms: edit.perms,
    })
    Object.assign(u, data)
    editando.value = null
  } catch (e) {
    alert('Erro ao salvar: ' + (e.response?.data?.detail || e.message))
  }
}

async function toggleGestao(c) {
  try {
    const { data } = await authApi.atualizarCargo(c.id, { is_gestao: !c.is_gestao })
    Object.assign(c, data)
  } catch (e) {
    alert('Erro: ' + (e.response?.data?.detail || e.message))
  }
}

async function criarCargo() {
  if (!novoCargoNome.value.trim()) return
  try {
    const { data } = await authApi.criarCargo({ nome: novoCargoNome.value.trim() })
    cargos.value.push(data)
    novoCargoNome.value = ''
  } catch (e) {
    alert('Erro ao criar cargo: ' + (e.response?.data?.nome?.[0] || e.message))
  }
}

async function criarEstudio() {
  if (!novoEstudioMg.value) { alert('Selecione o MG do estúdio.'); return }
  if (!novoEstudioNome.value.trim()) { alert('Informe o nome do estúdio.'); return }
  salvandoEstudio.value = true
  try {
    const { data } = await estudiosApi.criar({ mg: novoEstudioMg.value, nome: novoEstudioNome.value.trim() })
    estudios.value.push(data)
    novoEstudioNome.value = ''
  } catch (e) {
    alert('Erro ao criar estúdio: ' + (e.response?.data?.detail || e.response?.data?.nome?.[0] || e.message))
  } finally {
    salvandoEstudio.value = false
  }
}

async function excluirEstudio(e) {
  if (!confirm(`Remover o estúdio "${e.nome}" (${e.mg})?`)) return
  try {
    await estudiosApi.deletar(e.id)
    estudios.value = estudios.value.filter(x => x.id !== e.id)
  } catch (err) {
    alert('Erro ao remover: ' + (err.response?.data?.detail || err.message))
  }
}

// Matrícula só aceita números — mesma restrição da tela de login.
function onMatriculaInput(e) {
  const limpo = e.target.value.replace(/\D/g, '')
  novo.matricula = limpo
  if (e.target.value !== limpo) e.target.value = limpo
}

async function removerUsuario(u) {
  if (!confirm(`Remover ${u.nome} ${u.sobrenome} (${u.email})?\n\nIsso apaga o usuário do banco de dados — credenciais e acessos deixam de existir. Essa ação não pode ser desfeita.`)) return
  try {
    await authApi.deletarUsuario(u.id)
    usuarios.value = usuarios.value.filter(x => x.id !== u.id)
  } catch (e) {
    alert('Erro ao remover: ' + (e.response?.data?.detail || e.message))
  }
}

async function excluirCargo(c) {
  if (!confirm(`Excluir o cargo "${c.nome}"?`)) return
  try {
    await authApi.deletarCargo(c.id)
    cargos.value = cargos.value.filter(x => x.id !== c.id)
  } catch (e) {
    alert('Erro ao excluir: ' + (e.response?.data?.detail || e.message))
  }
}

function abrirNovoUsuario() {
  Object.assign(novo, { nome: '', sobrenome: '', email: '', password: '', matricula: '', setor: '', cargo: '', is_staff: false })
  modalNovo.value = true
}

async function criarUsuario() {
  if (!novo.nome || !novo.email || !novo.password) {
    alert('Preencha nome, e-mail e senha.')
    return
  }
  salvandoNovo.value = true
  try {
    await authApi.criarUsuario({ ...novo })
    modalNovo.value = false
    await carregar()
  } catch (e) {
    alert('Erro ao criar usuário: ' + (e.response?.data?.email?.[0] || e.response?.data?.detail || e.message))
  } finally {
    salvandoNovo.value = false
  }
}

onMounted(carregar)
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box {
  background: var(--surface, #171b26); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px; width: 360px; max-width: 90vw;
}
.input {
  padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg, #10131c); color: var(--text); font-size: 13px;
}
</style>
