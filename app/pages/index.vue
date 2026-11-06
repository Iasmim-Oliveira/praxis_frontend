<script setup lang="ts">
import { ArrowRight, CalendarCheck, CalendarDays, CalendarPlus, CircleX, Phone, Plus, Scissors, UserPlus } from 'lucide-vue-next'
import type { AppointmentWithRelations, Client, Service } from '~/types/api'
import type { ActionMenuItem } from '~/components/ActionMenu.vue'

useHead({ title: 'Dashboard · Praxis Diary' })

const { displayName, user } = useAuth()
const now = useNow()
const { cancelAppointment } = useAppointmentActions()

const { data, error, pending, refresh } = useResource(async () => {
  // Agendamentos sem filtro de período: o histórico alimenta a atividade recente.
  const [appointments, clients, services] = await Promise.all([
    api<AppointmentWithRelations[]>('/appointments'),
    api<Client[]>('/clients'),
    api<Service[]>('/services')
  ])
  return { appointments, clients, services }
})

const search = ref('')
const selected = shallowRef<AppointmentWithRelations | null>(null)

const greeting = computed(() => {
  const hour = now.value.getHours()
  const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  // Para USER o nome não está disponível na API; o e-mail fica na barra lateral.
  return displayName.value && displayName.value !== user.value?.email
    ? `${period}, ${displayName.value.split(' ')[0]}`
    : period
})

const scheduled = computed(() => data.value?.appointments.filter(item => item.status === 'SCHEDULED') ?? [])

const stats = computed(() => {
  const today = now.value
  const monthStart = startOfMonth(today)
  return {
    total: scheduled.value.length,
    today: scheduled.value.filter(item => isSameDay(new Date(item.startsAt), today)).length,
    services: data.value?.services.length ?? 0,
    clients: data.value?.clients.length ?? 0,
    newClients: data.value?.clients.filter(client => new Date(client.createdAt) >= monthStart).length ?? 0
  }
})

const upcoming = computed(() =>
  scheduled.value
    .filter(item => new Date(item.endsAt) > now.value)
    .filter(item => matches(search.value, item.client.name, item.service.name))
    .slice(0, 5)
)

const occupancy = computed(() => {
  const from = startOfWeek(now.value)
  const to = endOfWeek(now.value)
  const booked = bookedMinutes(scheduled.value, from, to) / 60
  const capacity = businessHoursPerDay * 7
  return { booked, capacity, percent: Math.round((booked / capacity) * 100) }
})

const activity = computed(() => {
  if (!data.value) return []
  const events = [
    ...data.value.clients.map(client => ({
      id: `client-${client.id}`,
      at: client.createdAt,
      icon: UserPlus,
      tone: 'blue',
      subject: client.name,
      text: 'foi cadastrado como cliente.'
    })),
    ...data.value.appointments.map(item => ({
      id: `created-${item.id}`,
      at: item.createdAt,
      icon: CalendarCheck,
      tone: 'green',
      subject: item.client.name,
      text: `agendou ${item.service.name} para ${formatDate(item.startsAt, { day: '2-digit', month: '2-digit' })} às ${formatTime(item.startsAt)}.`
    })),
    ...data.value.appointments.filter(item => item.cancelledAt).map(item => ({
      id: `cancelled-${item.id}`,
      at: item.cancelledAt!,
      icon: CircleX,
      tone: 'orange',
      subject: item.client.name,
      text: `teve ${item.service.name} cancelado.`
    }))
  ]
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5)
})

function menuItems(item: AppointmentWithRelations): ActionMenuItem[] {
  const cancellable = canCancel(item, now.value)
  return [
    { label: 'Ver detalhes', onSelect: () => (selected.value = item) },
    { label: 'Reagendar', icon: CalendarDays, onSelect: () => navigateTo(`/agendamentos/${item.id}/editar`) },
    {
      label: 'Cancelar',
      icon: CircleX,
      danger: true,
      disabled: !cancellable,
      hint: cancellable ? undefined : `Só até ${CANCEL_NOTICE_MINUTES} min antes do horário`,
      onSelect: async () => {
        if (await cancelAppointment(item)) refresh()
      }
    }
  ]
}
</script>

<template>
  <div>
    <AppTopbar title="Visão geral">
      <SearchInput v-model="search" class="topbar-search" label="Buscar agendamentos…" compact />
    </AppTopbar>

    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ greeting }}</h2>
          <p class="page-subtitle">Veja o que está acontecendo na sua agenda hoje.</p>
        </div>
        <NuxtLink to="/agendamentos/novo" class="btn btn-primary"><Plus :size="18" aria-hidden="true" /> Novo agendamento</NuxtLink>
      </div>

      <StateBlock v-if="!data" :loading="pending" :error="error" @retry="refresh" />

      <template v-else>
        <div class="stat-grid">
          <StatCard
            label="Agendamentos ativos"
            :value="stats.total.toLocaleString('pt-BR')"
            :icon="CalendarCheck"
            :badge="`${stats.today} hoje`"
            badge-tone="success"
          />
          <StatCard label="Serviços oferecidos" :value="stats.services" :icon="Scissors" tone="orange" />
          <StatCard
            label="Novos clientes no mês"
            :value="stats.newClients"
            :icon="UserPlus"
            tone="purple"
            :badge="`${stats.clients.toLocaleString('pt-BR')} no total`"
            badge-tone="purple"
          />
        </div>

        <div class="columns">
          <section class="card" aria-labelledby="next-title">
            <div class="card-header">
              <h3 id="next-title" class="section-title">Próximos atendimentos</h3>
              <NuxtLink to="/agenda" class="btn-link">Ver agenda completa <ArrowRight :size="15" aria-hidden="true" /></NuxtLink>
            </div>
            <ul v-if="upcoming.length">
              <li v-for="item in upcoming" :key="item.id" class="appointment">
                <span class="date-tile">
                  <small>{{ formatDate(item.startsAt, { month: 'short' }) }}</small>
                  <strong>{{ new Date(item.startsAt).getDate() }}</strong>
                </span>
                <button class="appointment-main" type="button" @click="selected = item">
                  <span class="cell-title">{{ item.client.name }}</span>
                  <span class="service">
                    <component :is="serviceStyle(item.serviceId).icon" :size="14" aria-hidden="true" />
                    {{ item.service.name }}
                  </span>
                </button>
                <span class="time-pill">{{ formatTimeRange(item.startsAt, item.endsAt) }}</span>
                <span class="row-actions">
                  <a
                    v-if="item.client.phone"
                    class="icon-btn outlined"
                    :href="`tel:${item.client.phone}`"
                    :aria-label="`Ligar para ${item.client.name}`"
                    :title="item.client.phone"
                  ><Phone :size="15" aria-hidden="true" /></a>
                  <ActionMenu :items="menuItems(item)" :label="`Ações do agendamento de ${item.client.name}`" />
                </span>
              </li>
            </ul>
            <StateBlock
              v-else
              :title="search ? 'Nenhum agendamento encontrado' : 'Nenhum atendimento futuro'"
              :message="search ? 'Tente buscar por outro cliente ou serviço.' : 'Os próximos agendamentos aparecem aqui.'"
            />
          </section>

          <aside class="side">
            <section class="card occupancy" aria-labelledby="occupancy-title">
              <h3 id="occupancy-title" class="section-title">Ocupação da semana</h3>
              <p>Sua agenda está com {{ occupancy.percent }}% do expediente ocupado nesta semana.</p>
              <div class="progress-label">
                <span>Horas agendadas</span>
                <span>{{ occupancy.booked.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) }}/{{ occupancy.capacity }} h</span>
              </div>
              <div
                class="progress"
                role="progressbar"
                aria-label="Ocupação da semana"
                :aria-valuenow="occupancy.percent"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span :style="{ width: `${Math.min(occupancy.percent, 100)}%` }" />
              </div>
            </section>

            <section class="card activity" aria-labelledby="activity-title">
              <h3 id="activity-title" class="section-title">Atividade recente</h3>
              <ul v-if="activity.length">
                <li v-for="event in activity" :key="event.id">
                  <span class="activity-icon" :class="`tone-${event.tone}`">
                    <component :is="event.icon" :size="14" aria-hidden="true" />
                  </span>
                  <div>
                    <p><strong>{{ event.subject }}</strong> {{ event.text }}</p>
                    <small>{{ formatRelative(event.at) }}</small>
                  </div>
                </li>
              </ul>
              <p v-else class="field-hint">Nenhuma atividade ainda.</p>
            </section>
          </aside>
        </div>
      </template>
    </div>

    <NuxtLink to="/agendamentos/novo" class="fab" aria-label="Novo agendamento" title="Novo agendamento">
      <CalendarPlus :size="22" aria-hidden="true" />
    </NuxtLink>

    <AppointmentDetailsModal v-if="selected" :appointment="selected" @close="selected = null" @changed="refresh" />
  </div>
</template>

<style scoped>
.topbar-search { width: min(260px, 100%); }

.columns { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
.side { display: flex; flex-direction: column; gap: 20px; }

.appointment {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.appointment:last-child { border-bottom: 0; }

.date-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 46px;
  padding: 4px 0;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
}

.date-tile small { color: var(--color-text-muted); font-size: 10px; font-weight: 600; text-transform: uppercase; }
.date-tile strong { font-size: 18px; line-height: 1.1; }

.appointment-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
}

.appointment-main:hover .cell-title { color: var(--color-primary); }
.service { display: flex; align-items: center; gap: 6px; color: var(--color-text-muted); font-size: 13px; }

.time-pill {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.row-actions { display: flex; gap: 6px; }

.occupancy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 0;
  background: linear-gradient(135deg, #0a47c2, #0b3a9a);
  color: #fff;
}

.occupancy p { color: rgb(255 255 255 / 80%); }
.progress-label { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
.progress { height: 6px; border-radius: 3px; background: rgb(255 255 255 / 25%); overflow: hidden; }
.progress span { display: block; height: 100%; border-radius: 3px; background: #fff; }

.activity { padding: 20px; }
.activity ul { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.activity li { display: flex; gap: 10px; font-size: 13px; }
.activity small { color: var(--color-text-faint); font-size: 11px; }

.activity-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
}

@media (max-width: 1080px) {
  .columns { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .topbar-search { display: none; }
  .appointment { flex-wrap: wrap; padding: 14px 16px; }
  .time-pill { order: 3; margin-left: 60px; }
  .row-actions { order: 2; }
}
</style>
