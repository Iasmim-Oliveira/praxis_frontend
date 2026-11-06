<script setup lang="ts">
import { Check, CircleCheck, Plus } from 'lucide-vue-next'
import type { Appointment, AppointmentWithRelations, AvailabilitySlot, Client, Service } from '~/types/api'

const props = defineProps<{
  /** Agendamento em edição; sem ele, o formulário cria um novo. */
  appointment?: AppointmentWithRelations
  initialDate?: Date | null
  initialClientId?: string
}>()

const toast = useToast()
const { isAdmin } = useAuth()
const now = useNow()
const editing = computed(() => !!props.appointment)
const original = props.appointment

const clients = useResource(() => api<Client[]>('/clients'))
const services = useResource(() => api<Service[]>('/services'))
const serviceOptions = computed(() => services.data.value ?? [])

const clientId = ref(original?.clientId ?? props.initialClientId ?? '')
const serviceId = ref(original?.serviceId ?? '')
const date = ref(startOfDay(original ? new Date(original.startsAt) : props.initialDate ?? new Date()))
const slotStart = ref<string | null>(original?.startsAt ?? null)

const clientSearch = ref('')
const creatingClient = ref(false)
const submitting = ref(false)
const formError = ref('')

const filteredClients = computed(() =>
  (clients.data.value ?? []).filter(client => matches(clientSearch.value, client.name, client.email, client.phone))
)
const selectedClient = computed(() => clients.data.value?.find(client => client.id === clientId.value))
const selectedService = computed(() => serviceOptions.value.find(service => service.id === serviceId.value))

// A disponibilidade não lista o horário ocupado pelo próprio agendamento em edição.
const keepsOriginalSlot = computed(() => !!original && isSameDay(date.value, new Date(original.startsAt)))

const slots = ref<AvailabilitySlot[]>([])
const slotsLoading = ref(false)
const slotsError = ref<ApiError | null>(null)
let slotsRequest = 0

async function loadSlots() {
  slots.value = []
  slotsError.value = null
  if (!serviceId.value) return
  const request = ++slotsRequest
  slotsLoading.value = true
  try {
    const result = await api<AvailabilitySlot[]>('/appointments/availability', {
      query: { serviceId: serviceId.value, date: toDateParam(date.value) }
    })
    if (request === slotsRequest) slots.value = result
  } catch (error) {
    if (request === slotsRequest) slotsError.value = toApiError(error)
  } finally {
    if (request === slotsRequest) slotsLoading.value = false
  }
}

// O backend não remove horários que já passaram.
const futureSlots = computed(() => slots.value.filter(slot => new Date(slot.startsAt) > now.value))

watch([serviceId, date], () => {
  slotStart.value = keepsOriginalSlot.value ? original!.startsAt : null
  loadSlots()
}, { immediate: true })

const step = computed(() => (!selectedClient.value ? 1 : !selectedService.value || !slotStart.value ? 2 : 3))

const changes = computed(() => {
  if (!original) return { clientId: clientId.value, serviceId: serviceId.value, startsAt: slotStart.value! }
  const patch: Partial<Pick<Appointment, 'clientId' | 'serviceId' | 'startsAt'>> = {}
  if (clientId.value !== original.clientId) patch.clientId = clientId.value
  if (serviceId.value !== original.serviceId) patch.serviceId = serviceId.value
  if (slotStart.value !== original.startsAt) patch.startsAt = slotStart.value!
  return patch
})

const selectedEnd = computed(() => {
  if (!slotStart.value || !selectedService.value) return null
  return new Date(new Date(slotStart.value).getTime() + selectedService.value.durationMinutes * 60_000).toISOString()
})

function onClientCreated(client: Client) {
  clients.data.value = [...(clients.data.value ?? []), client].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  clientId.value = client.id
  clientSearch.value = ''
  creatingClient.value = false
  toast.success('Cliente cadastrado.')
}

async function submit() {
  formError.value = ''
  if (step.value < 3) return
  if (original && !Object.keys(changes.value).length) {
    formError.value = 'Nenhuma alteração para salvar.'
    return
  }
  submitting.value = true
  try {
    if (original) await api(`/appointments/${original.id}`, { method: 'PATCH', body: changes.value })
    else await api('/appointments', { method: 'POST', body: changes.value })
    toast.success(original ? 'Agendamento atualizado.' : 'Agendamento criado.')
    await navigateTo({ path: '/agenda', query: { data: toDateParam(new Date(slotStart.value!)) } })
  } catch (cause) {
    const error = toApiError(cause)
    formError.value = error.message
    // Outra pessoa pode ter reservado o horário entre a consulta e o envio.
    if (error.status === 409) {
      slotStart.value = null
      loadSlots()
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="layout">
    <ol class="stepper" aria-label="Etapas">
      <li
        v-for="(label, index) in ['Cliente', 'Serviço e horário', 'Confirmação']"
        :key="label"
        :class="{ current: step === index + 1, done: step > index + 1 }"
        :aria-current="step === index + 1 ? 'step' : undefined"
      >
        <span class="step-number">
          <Check v-if="step > index + 1" :size="14" aria-hidden="true" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        {{ label }}
      </li>
    </ol>

    <form class="sections" novalidate @submit.prevent="submit">
      <section class="card" aria-labelledby="client-title">
        <div class="card-header tinted">
          <div>
            <h2 id="client-title" class="section-title">Selecionar cliente</h2>
            <p class="section-subtitle">Busque um cliente existente ou cadastre um novo.</p>
          </div>
          <button class="btn-link" type="button" @click="creatingClient = true">
            <Plus :size="16" aria-hidden="true" /> Novo cliente
          </button>
        </div>
        <div class="card-body form-stack">
          <StateBlock v-if="!clients.data.value" :loading="clients.pending.value" :error="clients.error.value" @retry="clients.refresh" />
          <template v-else>
            <SearchInput v-model="clientSearch" label="Buscar por nome, e-mail ou telefone…" />
            <ul class="client-list" role="radiogroup" aria-label="Clientes">
              <li v-for="client in filteredClients" :key="client.id">
                <button
                  class="client-option"
                  :class="{ selected: client.id === clientId }"
                  type="button"
                  role="radio"
                  :aria-checked="client.id === clientId"
                  @click="clientId = client.id"
                >
                  <UserAvatar :name="client.name" :size="34" />
                  <span class="client-text">
                    <span class="cell-title">{{ client.name }}</span>
                    <span class="cell-subtitle">{{ client.email || client.phone || 'Sem contato cadastrado' }}</span>
                  </span>
                  <CircleCheck v-if="client.id === clientId" class="check" :size="20" aria-hidden="true" />
                </button>
              </li>
              <li v-if="!filteredClients.length" class="field-hint empty">
                {{ clients.data.value.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.' }}
              </li>
            </ul>
          </template>
        </div>
      </section>

      <section class="card" aria-labelledby="details-title">
        <div class="card-header tinted">
          <div>
            <h2 id="details-title" class="section-title">Detalhes do agendamento</h2>
            <p class="section-subtitle">Escolha o serviço e um horário livre.</p>
          </div>
        </div>
        <div class="card-body form-stack">
          <StateBlock v-if="!services.data.value" :loading="services.pending.value" :error="services.error.value" @retry="services.refresh" />
          <StateBlock
            v-else-if="!serviceOptions.length"
            title="Nenhum serviço cadastrado"
            :message="isAdmin ? 'Cadastre um serviço antes de agendar.' : 'Peça a um administrador para cadastrar os serviços.'"
          >
            <NuxtLink v-if="isAdmin" to="/servicos" class="btn btn-secondary">Ir para serviços</NuxtLink>
          </StateBlock>

          <template v-else>
            <fieldset class="field">
              <legend class="field-label">Serviço</legend>
              <div class="service-grid">
                <label
                  v-for="service in serviceOptions"
                  :key="service.id"
                  class="service-option"
                  :class="{ selected: service.id === serviceId }"
                >
                  <input v-model="serviceId" class="sr-only" type="radio" name="service" :value="service.id">
                  <component :is="serviceStyle(service.id).icon" :size="18" class="service-icon" aria-hidden="true" />
                  <span class="cell-title">{{ service.name }}</span>
                  <span class="cell-subtitle">{{ formatDuration(service.durationMinutes) }}</span>
                </label>
              </div>
            </fieldset>

            <div class="when">
              <div class="field">
                <span class="field-label">Data</span>
                <MonthCalendar v-model="date" :min="now" />
              </div>
              <fieldset class="field">
                <legend class="field-label">Horários disponíveis</legend>
                <p v-if="!serviceId" class="field-hint">Escolha um serviço para ver os horários.</p>
                <StateBlock v-else-if="slotsLoading" loading />
                <StateBlock v-else-if="slotsError" :error="slotsError" @retry="loadSlots" />
                <div v-else class="slots">
                  <label v-if="keepsOriginalSlot" class="slot" :class="{ selected: slotStart === original!.startsAt }">
                    <input v-model="slotStart" class="sr-only" type="radio" name="slot" :value="original!.startsAt">
                    {{ formatTime(original!.startsAt) }} <small>atual</small>
                  </label>
                  <label
                    v-for="slot in futureSlots"
                    :key="slot.startsAt"
                    class="slot"
                    :class="{ selected: slotStart === slot.startsAt }"
                  >
                    <input v-model="slotStart" class="sr-only" type="radio" name="slot" :value="slot.startsAt">
                    {{ formatTime(slot.startsAt) }}
                  </label>
                  <p v-if="!futureSlots.length && !keepsOriginalSlot" class="field-hint">
                    Nenhum horário livre neste dia. Escolha outra data.
                  </p>
                </div>
                <p class="field-hint">Expediente das {{ BUSINESS_START_HOUR }}h às {{ BUSINESS_END_HOUR }}h, todos os dias.</p>
              </fieldset>
            </div>
          </template>
        </div>
      </section>

      <section class="card" aria-labelledby="confirm-title">
        <div class="card-header tinted">
          <h2 id="confirm-title" class="section-title">Confirmação</h2>
        </div>
        <div class="card-body form-stack">
          <dl class="summary">
            <div><dt>Cliente</dt><dd>{{ selectedClient?.name ?? '—' }}</dd></div>
            <div><dt>Serviço</dt><dd>{{ selectedService?.name ?? '—' }}</dd></div>
            <div>
              <dt>Quando</dt>
              <dd v-if="slotStart && selectedEnd">{{ formatLongDate(slotStart) }}, {{ formatTimeRange(slotStart, selectedEnd) }}</dd>
              <dd v-else>—</dd>
            </div>
          </dl>
          <p v-if="formError" class="alert" role="alert">{{ formError }}</p>
          <div class="actions">
            <NuxtLink to="/agenda" class="btn btn-secondary">Cancelar</NuxtLink>
            <button class="btn btn-primary" type="submit" :disabled="step < 3 || submitting">
              {{ submitting ? 'Salvando…' : editing ? 'Salvar alterações' : 'Confirmar agendamento' }}
            </button>
          </div>
        </div>
      </section>
    </form>

    <ClientFormModal v-if="creatingClient" @close="creatingClient = false" @saved="onClientCreated" />
  </div>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: 170px minmax(0, 1fr); gap: 24px; align-items: start; }

.stepper { position: sticky; top: calc(var(--topbar-height) + 24px); display: flex; flex-direction: column; gap: 28px; margin: 0; padding: 8px 0 0; list-style: none; }
.stepper li { position: relative; display: flex; align-items: center; gap: 10px; color: var(--color-text-muted); font-weight: 500; }
.stepper li:not(:last-child)::after { content: ''; position: absolute; top: 30px; left: 13px; height: 22px; border-left: 2px solid var(--color-border); }
.stepper li.current { color: var(--color-primary); font-weight: 600; }

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  background: var(--color-surface);
  font-size: 13px;
}

.current .step-number { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
.done .step-number { border-color: var(--color-success); background: var(--color-success-soft); color: var(--color-success); }

.sections { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.tinted { background: #f8fafc; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }

.client-list { display: flex; flex-direction: column; gap: 6px; max-height: 248px; overflow-y: auto; }
.client-list .empty { padding: 8px 4px; }

.client-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
}

.client-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.client-option:hover { border-color: var(--color-primary-border); }
.client-option.selected { border-color: var(--color-primary-border); border-left: 3px solid var(--color-primary); background: #f5f8fe; }
.check { color: var(--color-primary); flex: none; }

fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
legend { padding: 0; margin-bottom: 6px; }

.service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }

.service-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.service-option:hover { border-color: var(--color-primary-border); }
.service-option.selected { border: 2px solid var(--color-primary); padding: 13px; background: #f5f8fe; }
.service-option:has(input:focus-visible) { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.service-icon { margin-bottom: 6px; color: var(--color-text-muted); }
.selected .service-icon { color: var(--color-primary); }

.when { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 20px; }

.slots { display: flex; flex-direction: column; gap: 6px; max-height: 296px; overflow-y: auto; padding: 2px; }

.slot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.slot:hover { border-color: var(--color-primary-border); }
.slot.selected { border: 2px solid var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }
.slot:has(input:focus-visible) { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.slot small { color: var(--color-text-muted); font-size: 11px; font-weight: 500; }

.summary { display: grid; gap: 8px; margin: 0; }
.summary div { display: grid; grid-template-columns: 90px 1fr; gap: 12px; }
.summary dt { color: var(--color-text-muted); }
.summary dd { margin: 0; font-weight: 500; }
.summary dd::first-letter { text-transform: uppercase; }

.actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .stepper { position: static; flex-direction: row; flex-wrap: wrap; gap: 16px; padding: 0; }
  .stepper li:not(:last-child)::after { display: none; }
}

@media (max-width: 640px) {
  .when { grid-template-columns: 1fr; }
}
</style>
