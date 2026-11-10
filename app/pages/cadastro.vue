<script setup lang="ts">
definePageMeta({ layout: 'auth', public: true })
useHead({ title: 'Criar conta · Praxis Diary' })

const { register } = useAuth()

const form = reactive({ name: '', email: '', password: '' })
const errors = reactive({ name: '', email: '', password: '' })
const formError = ref('')
const submitting = ref(false)

function validate() {
  errors.name = form.name.trim().length >= 2 ? '' : 'Informe seu nome (mínimo de 2 caracteres).'
  errors.email = isValidEmail(form.email.trim()) ? '' : 'Informe um e-mail válido.'
  errors.password = form.password.length >= 8 ? '' : 'A senha precisa ter pelo menos 8 caracteres.'
  return !errors.name && !errors.email && !errors.password
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    await register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
    await navigateTo('/')
  } catch (error) {
    formError.value = toApiError(error).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Criar conta" subtitle="Cadastre-se para acessar a agenda e os clientes do negócio.">
    <form class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="formError" class="alert" role="alert">{{ formError }}</p>
      <div class="field">
        <label class="field-label" for="name">Nome</label>
        <input id="name" v-model="form.name" class="input" autocomplete="name" :aria-invalid="!!errors.name">
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>
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
        <PasswordInput id="password" v-model="form.password" autocomplete="new-password" :invalid="!!errors.password" />
        <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        <span v-else class="field-hint">Mínimo de 8 caracteres.</span>
      </div>
      <button class="btn btn-primary btn-block" type="submit" :disabled="submitting">
        {{ submitting ? 'Criando conta…' : 'Criar conta' }}
      </button>
    </form>
    <template #footer>
      Já tem uma conta? <NuxtLink to="/login">Entrar</NuxtLink>
    </template>
  </AuthCard>
</template>
