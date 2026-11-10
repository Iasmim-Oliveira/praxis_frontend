<script setup lang="ts">
import type { Client } from '~/types/api'

const props = defineProps<{ client?: Client | null }>()
const emit = defineEmits<{ close: [], saved: [Client] }>()

const form = reactive({
  name: props.client?.name ?? '',
  email: props.client?.email ?? '',
  phone: props.client?.phone ?? '',
  notes: props.client?.notes ?? ''
})
const errors = reactive({ name: '', email: '' })
const formError = ref('')
const saving = ref(false)

function validate() {
  errors.name = form.name.trim().length >= 2 ? '' : 'Informe o nome (mínimo de 2 caracteres).'
  errors.email = !form.email.trim() || isValidEmail(form.email.trim()) ? '' : 'Informe um e-mail válido.'
  return !errors.name && !errors.email
}

// Na criação, campos vazios são omitidos; na edição, viram null para limpar o valor salvo.
function payload() {
  const optional = (value: string) => value.trim() || (props.client ? null : undefined)
  return {
    name: form.name.trim(),
    email: optional(form.email),
    phone: optional(form.phone),
    notes: optional(form.notes)
  }
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const saved = props.client
      ? await api<Client>(`/clients/${props.client.id}`, { method: 'PATCH', body: payload() })
      : await api<Client>('/clients', { method: 'POST', body: payload() })
    emit('saved', saved)
  } catch (error) {
    formError.value = toApiError(error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :title="client ? 'Editar cliente' : 'Novo cliente'" @close="emit('close')">
    <form id="client-form" class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="formError" class="alert" role="alert">{{ formError }}</p>
      <div class="field">
        <label class="field-label" for="client-name">Nome</label>
        <input id="client-name" v-model="form.name" class="input" autocomplete="off" :aria-invalid="!!errors.name">
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>
      <div class="field">
        <label class="field-label" for="client-email">E-mail <span class="field-hint">(opcional)</span></label>
        <input id="client-email" v-model="form.email" class="input" type="email" autocomplete="off" :aria-invalid="!!errors.email">
        <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
      </div>
      <div class="field">
        <label class="field-label" for="client-phone">Telefone <span class="field-hint">(opcional)</span></label>
        <input id="client-phone" v-model="form.phone" class="input" type="tel" autocomplete="off" placeholder="(11) 91234-5678">
      </div>
      <div class="field">
        <label class="field-label" for="client-notes">Observações <span class="field-hint">(opcional)</span></label>
        <textarea id="client-notes" v-model="form.notes" class="textarea" />
      </div>
    </form>
    <template #footer>
      <button class="btn btn-secondary" type="button" @click="emit('close')">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="client-form" :disabled="saving">
        {{ saving ? 'Salvando…' : client ? 'Salvar alterações' : 'Cadastrar cliente' }}
      </button>
    </template>
  </BaseModal>
</template>
