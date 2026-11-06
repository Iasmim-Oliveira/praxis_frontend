<script setup lang="ts">
definePageMeta({ layout: 'auth', public: true })
useHead({ title: 'Entrar · Praxis Diary' })

const { login } = useAuth()
const route = useRoute()

const form = reactive({ email: '', password: '' })
const errors = reactive({ email: '', password: '' })
const formError = ref('')
const submitting = ref(false)

function validate() {
  errors.email = !form.email.trim()
    ? 'Informe seu e-mail.'
    : isValidEmail(form.email.trim()) ? '' : 'Informe um e-mail válido.'
  errors.password = form.password ? '' : 'Informe sua senha.'
  return !errors.email && !errors.password
}

/** Só aceita caminhos internos, para não virar um redirecionamento aberto. */
function redirectTarget() {
  const target = route.query.redirect
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await login({ email: form.email.trim(), password: form.password })
    await navigateTo(redirectTarget())
  } catch (error) {
    formError.value = toApiError(error).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Praxis Diary" subtitle="Entre com suas credenciais para gerenciar sua agenda sem complicação.">
    <form class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="formError" class="alert" role="alert">{{ formError }}</p>
      <div class="field">
        <label class="field-label" for="email">E-mail</label>
        <input
          id="email"
          v-model="form.email"
          class="input"
          type="email"
          autocomplete="email"
          placeholder="nome@empresa.com"
          :aria-invalid="!!errors.email"
        >
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>
      <div class="field">
        <label class="field-label" for="password">Senha</label>
        <PasswordInput id="password" v-model="form.password" autocomplete="current-password" :invalid="!!errors.password" />
        <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
      </div>
      <button class="btn btn-primary btn-block" type="submit" :disabled="submitting">
        {{ submitting ? 'Entrando…' : 'Entrar no Praxis Diary' }}
      </button>
      <SocialLogin />
    </form>
    <template #footer>
      Não tem uma conta? <NuxtLink to="/cadastro">Criar conta</NuxtLink>
    </template>
  </AuthCard>
</template>
