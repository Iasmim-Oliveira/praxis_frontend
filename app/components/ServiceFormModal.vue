<script setup lang="ts">
import type { Service } from '~/types/api'

const props = defineProps<{ service?: Service | null }>()
const emit = defineEmits<{ close: [], saved: [Service] }>()

const form = reactive({
  name: props.service?.name ?? '',
  description: props.service?.description ?? '',
  durationMinutes: props.service?.durationMinutes ?? 60
})
const errors = reactive({ name: '', durationMinutes: '' })
const formError = ref('')
const saving = ref(false)

function validate() {
  errors.name = form.name.trim().length >= 2 ? '' : 'Informe o nome (mínimo de 2 caracteres).'
  errors.durationMinutes = Number.isInteger(form.durationMinutes) && form.durationMinutes >= 1
    ? ''
    : 'Informe a duração em minutos (número inteiro maior que zero).'
  return !errors.name && !errors.durationMinutes
}

async function submit() {
  formError.value = ''
  if (!validate()) return
  saving.value = true
  const description = form.description.trim() || (props.service ? null : undefined)
  const body = { name: form.name.trim(), description, durationMinutes: form.durationMinutes }
  try {
    const saved = props.service
      ? await api<Service>(`/services/${props.service.id}`, { method: 'PATCH', body })
      : await api<Service>('/services', { method: 'POST', body })
    emit('saved', saved)
  } catch (error) {
    formError.value = toApiError(error).message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal :title="service ? 'Editar serviço' : 'Novo serviço'" @close="emit('close')">
    <form id="service-form" class="form-stack" novalidate @submit.prevent="submit">
      <p v-if="formError" class="alert" role="alert">{{ formError }}</p>
      <div class="field">
        <label class="field-label" for="service-name">Nome</label>
        <input id="service-name" v-model="form.name" class="input" autocomplete="off" :aria-invalid="!!errors.name">
        <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
      </div>
      <div class="field">
        <label class="field-label" for="service-description">Descrição <span class="field-hint">(opcional)</span></label>
        <textarea id="service-description" v-model="form.description" class="textarea" />
      </div>
      <div class="field">
        <label class="field-label" for="service-duration">Duração (minutos)</label>
        <input
          id="service-duration"
          v-model.number="form.durationMinutes"
          class="input"
          type="number"
          min="1"
          step="1"
          inputmode="numeric"
          :aria-invalid="!!errors.durationMinutes"
        >
        <span v-if="errors.durationMinutes" class="field-error">{{ errors.durationMinutes }}</span>
        <span v-else-if="service" class="field-hint">Mudar a duração não altera agendamentos já criados.</span>
        <span v-else class="field-hint">Os horários disponíveis são gerados em passos dessa duração.</span>
      </div>
    </form>
    <template #footer>
      <button class="btn btn-secondary" type="button" @click="emit('close')">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="service-form" :disabled="saving">
        {{ saving ? 'Salvando…' : service ? 'Salvar alterações' : 'Criar serviço' }}
      </button>
    </template>
  </BaseModal>
</template>
