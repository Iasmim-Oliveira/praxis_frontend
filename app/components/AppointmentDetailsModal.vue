<script setup lang="ts">
import { CalendarClock, Mail, Phone, UserRound } from 'lucide-vue-next'
import type { AppointmentWithRelations } from '~/types/api'

const props = defineProps<{ appointment: AppointmentWithRelations }>()
const emit = defineEmits<{ close: [], changed: [] }>()

const now = useNow()
const { cancelAppointment } = useAppointmentActions()

const cancelled = computed(() => props.appointment.status === 'CANCELLED')
const cancellable = computed(() => canCancel(props.appointment, now.value))

async function cancel() {
  emit('close')
  if (await cancelAppointment(props.appointment)) emit('changed')
}
</script>

<template>
  <BaseModal title="Detalhes do agendamento" @close="emit('close')">
    <div class="details">
      <div class="heading">
        <span class="icon-tile" :class="`tone-${serviceStyle(appointment.serviceId).tone}`">
          <component :is="serviceStyle(appointment.serviceId).icon" :size="18" aria-hidden="true" />
        </span>
        <div>
          <p class="cell-title">{{ appointment.service.name }}</p>
          <p class="cell-subtitle">{{ formatDuration(appointment.service.durationMinutes) }}</p>
        </div>
        <span class="badge" :class="cancelled ? 'danger' : 'success'">{{ cancelled ? 'Cancelado' : 'Agendado' }}</span>
      </div>

      <dl>
        <div>
          <dt><CalendarClock :size="16" aria-hidden="true" /> Quando</dt>
          <dd>
            {{ formatLongDate(appointment.startsAt) }}<br>
            {{ formatTimeRange(appointment.startsAt, appointment.endsAt) }}
          </dd>
        </div>
        <div>
          <dt><UserRound :size="16" aria-hidden="true" /> Cliente</dt>
          <dd>{{ appointment.client.name }}</dd>
        </div>
        <div v-if="appointment.client.phone">
          <dt><Phone :size="16" aria-hidden="true" /> Telefone</dt>
          <dd><a class="btn-link" :href="`tel:${appointment.client.phone}`">{{ appointment.client.phone }}</a></dd>
        </div>
        <div v-if="appointment.client.email">
          <dt><Mail :size="16" aria-hidden="true" /> E-mail</dt>
          <dd><a class="btn-link" :href="`mailto:${appointment.client.email}`">{{ appointment.client.email }}</a></dd>
        </div>
      </dl>

      <p v-if="cancelled && appointment.cancelledAt" class="field-hint">
        Cancelado em {{ formatDate(appointment.cancelledAt, { dateStyle: 'short' }) }} às {{ formatTime(appointment.cancelledAt) }}.
      </p>
      <p v-else-if="!cancellable" class="field-hint">
        O cancelamento só é permitido até {{ CANCEL_NOTICE_MINUTES }} minutos antes do horário.
      </p>
    </div>

    <template v-if="!cancelled" #footer>
      <button class="btn btn-danger-outline" type="button" :disabled="!cancellable" @click="cancel">Cancelar agendamento</button>
      <NuxtLink class="btn btn-primary" :to="`/agendamentos/${appointment.id}/editar`">Reagendar</NuxtLink>
    </template>
  </BaseModal>
</template>

<style scoped>
.details { display: flex; flex-direction: column; gap: 18px; }
.heading { display: flex; align-items: center; gap: 12px; }
.heading > div { flex: 1; }

dl { display: flex; flex-direction: column; gap: 12px; margin: 0; }
dl > div { display: grid; grid-template-columns: 110px 1fr; gap: 12px; }
dt { display: flex; align-items: center; gap: 6px; color: var(--color-text-muted); }
dd { margin: 0; overflow-wrap: anywhere; }
</style>
