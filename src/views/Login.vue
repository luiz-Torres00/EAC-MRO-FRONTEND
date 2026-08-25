<template>
  <div class="login-wrap">

    <!-- ── Login ── -->
    <div v-if="tab === 'login'" class="login-card">
      <div class="login-logo">
        <span class="login-logo-mr">MR</span>
        <svg class="login-logo-o" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="12" fill="#00ce7c"/>
          <circle cx="14" cy="14" r="7" fill="var(--card)"/>
          <circle cx="14" cy="14" r="2.8" fill="white"/>
        </svg>
      </div>
      <div class="login-tagline">nós ativamos a <strong>eficiência</strong></div>
      <div class="login-titulo">Entrar no sistema</div>
      <div v-if="erro" class="alert alert-error">{{ erro }}</div>
      <form @submit.prevent="handleLogin">
        <div class="login-field">
          <label>E-mail</label>
          <input type="email" v-model="email" required />
        </div>
        <div class="login-field">
          <label>Senha</label>
          <input type="password" v-model="senha" required />
        </div>
        <button class="btn btn-primary btn-block" :disabled="busy">
          {{ busy ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
      <div class="login-links">
        <button @click="tab = 'esqueci'">Esqueci minha senha</button>
        <button @click="tab = 'solicitar'">Solicitar acesso</button>
      </div>
    </div>

    <!-- ── Esqueci senha ── -->
    <div v-else-if="tab === 'esqueci'" class="login-card">
      <button class="btn-back" @click="tab = 'login'">← Voltar</button>
      <div class="login-titulo">Redefinir senha</div>
      <div v-if="erro" class="alert alert-error">{{ erro }}</div>
      <div v-if="ok"   class="alert alert-ok">{{ ok }}</div>
      <form @submit.prevent="handleEsqueci">
        <div class="login-field">
          <label>E-mail</label>
          <input type="email" v-model="email" required />
        </div>
        <button class="btn btn-primary btn-block" :disabled="busy">
          {{ busy ? 'Enviando…' : 'Enviar link de redefinição' }}
        </button>
      </form>
    </div>

    <!-- ── Solicitar acesso ── -->
    <div v-else-if="tab === 'solicitar'" class="login-card">
      <button class="btn-back" @click="tab = 'login'">← Voltar</button>
      <div class="login-titulo">Solicitar acesso</div>
      <div v-if="erro" class="alert alert-error">{{ erro }}</div>
      <div v-if="ok"   class="alert alert-ok">{{ ok }}</div>
      <form v-if="!ok" @submit.prevent="handleSolicitar">
        <div class="field-row">
          <div class="login-field">
            <label>Nome</label>
            <input v-model="solic.nome" required />
          </div>
          <div class="login-field">
            <label>Sobrenome</label>
            <input v-model="solic.sobrenome" required />
          </div>
        </div>
        <div class="login-field">
          <label>E-mail</label>
          <input type="email" v-model="solic.email" required />
        </div>
        <div class="login-field">
          <label>Matrícula</label>
          <input v-model="solic.matricula" required />
        </div>
        <div class="login-field">
          <label>Senha</label>
          <input type="password" v-model="solic.senha" required />
        </div>
        <div class="login-field">
          <label>Confirmar senha</label>
          <input type="password" v-model="solic.senha2" required />
        </div>

        <!-- Setor -->
        <div class="login-field">
          <label>Setor <span class="obrigatorio">*obrigatório</span></label>
          <div class="btn-grid-3">
            <button v-for="s in setores" :key="s" type="button"
              :class="['btn-setor', { ativo: solic.setor === s }]"
              @click="solic.setor = s">{{ s }}</button>
          </div>
        </div>

        <!-- Cargo -->
        <div class="login-field">
          <label>Cargo <span class="opcional">opcional</span></label>
          <div class="btn-grid-2">
            <button v-for="c in cargos" :key="c" type="button"
              :class="['btn-setor', { ativo: solic.cargo === c }]"
              @click="solic.cargo = solic.cargo === c ? '' : c">{{ c }}</button>
          </div>
        </div>

        <button class="btn btn-primary btn-block" :disabled="busy">
          {{ busy ? 'Enviando…' : 'Enviar solicitação' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api'

const auth   = useAuthStore()
const router = useRouter()

const tab   = ref('login')
const email = ref('')
const senha = ref('')
const erro  = ref('')
const ok    = ref('')
const busy  = ref(false)

const solic = reactive({
  nome: '', sobrenome: '', email: '', matricula: '',
  senha: '', senha2: '', setor: '', cargo: '',
})

const setores = ['MG1','MG2','MG3','MG4','Cenografia','Arte']
const cargos  = ['Aux. Almoxarifado','Almoxarife','Encarregado','Supervisor','Coordenador','Gerente','Gerente Geral']

async function handleLogin() {
  erro.value = ''; busy.value = true
  try {
    await auth.login(email.value, senha.value)
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    router.push(redirect || '/')
  } catch (e) {
    const msg = e.response?.data?.detail || ''
    if (msg.includes('aprovada')) erro.value = msg
    else erro.value = 'E-mail ou senha incorretos.'
  } finally {
    busy.value = false
  }
}

async function handleSolicitar() {
  erro.value = ''; ok.value = ''; busy.value = true
  try {
    if (solic.senha !== solic.senha2) throw new Error('Senhas não coincidem.')
    if (!solic.setor) throw new Error('Selecione o setor.')
    await authApi.solicitar({
      nome: solic.nome, sobrenome: solic.sobrenome,
      email: solic.email, matricula: solic.matricula,
      senha: solic.senha, setor: solic.setor, cargo: solic.cargo,
    })
    ok.value = 'Solicitação enviada! Aguarde aprovação de um administrador.'
  } catch (e) {
    erro.value = e.message || e.response?.data?.detail || 'Erro ao enviar.'
  } finally {
    busy.value = false
  }
}

async function handleEsqueci() {
  // Django não tem reset de senha por e-mail out-of-the-box via API;
  // implementar com django.contrib.auth.views.PasswordResetView ou biblioteca de terceiros
  ok.value = 'Se o e-mail existir no sistema, você receberá as instruções em breve.'
}
</script>
