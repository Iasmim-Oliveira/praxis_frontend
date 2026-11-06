<script setup lang="ts">
import { CalendarCheck, ChevronLeft, ChevronRight, Gauge, Plus, UsersRound } from 'lucide-vue-next'
import type { AppointmentWithRelations } from '~/types/api'

type View = 'dia' | 'semana' | 'mes'

useHead({ title: 'Agenda · Praxis Diary' })

const route = useRoute()
const router = useRouter()
const now = useNow()

const views: { value: View, label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' }
]

// Data e visão ficam na URL para que o link leve de volta ao mesmo período.
const view = computed<View>(() => views.some(item => item.value === route.query.visao) ? route.query.visao as View : 'semana')
const anchor = computed(() => parseDateParam(route.query.data) ?? startOfDay(new Date()))

function go(date: Date, nextView = view.value) {
  router.replace({ query: { ...route.query, data: toDateParam(date), visao: nextView } })
}

const period = computed(() => {
  const date = anchor.value
  if (view.value === 'dia') return { from: startOfDay(date), to: endOfDay(date) }
  if (view.value === 'semana') return { from: startOfWeek(date), to: endOfWeek(date) }
  return { from: startOfMonth(date), to: endOfMonth(date) }
})

// O mês exibe semanas completas, então busca também os dias das bordas.
const fetchRange = computed(() =>
  view.value === 'mes'
    ? { from: startOfWeek(period.value.from), to: endOfWeek(period.value.to) }
    : period.value
)

const { data, error, pending, refresh } = useResource(() =>
  api<AppointmentWithRelations[]>('/appointments', {
    query: { from: fetchRange.value.from.toISOString(), to: fetchRange.value.to.toISOString() }
  })
)

watch(() => `${fetchRange.value.from.getTime()}-${fetchRange.value.to.getTime()}`, refresh)

const search = ref('')
const showCancelled = ref(false)
const selected = shallowRef<AppointmentWithRelations | null>(null)

const visible = computed(() =>
  (data.value ?? [])
    .filter(item => showCancelled.value || item.status === 'SCHEDULED')
    .filter(item => matches(search.value, item.client.name, item.service.name))
)

const days = computed(() => eachDay(period.value.from, period.value.to))

const title = computed(() => {
  const { from, to } = period.value
  if (view.value === 'dia') return formatLongDate(from)
  if (view.value === 'mes') return formatMonthYear(from)
  const sameMonth = from.getMonth() === to.getMonth()
  const start = formatDate(from, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' })
  return `${start} – ${formatDate(to, { day: 'numeric', month: sameMonth ? 'long' : 'short', year: 'numeric' })}`
})

function shift(direction: 1 | -1) {
  const date = anchor.value
  if (view.value === 'dia') go(addDays(date, direction))
  else if (view.value === 'semana') go(addDays(date, direction * 7))
  else go(addMonths(date, direction))
}

const stats = computed(() => {
  const { from, to } = period.value
  const inPeriod = (data.value ?? []).filter(item => new Date(item.startsAt) <= to && new Date(item.endsAt) >= from)
  const active = inPeriod.filter(item => item.status === 'SCHEDULED')
  const capacity = eachDay(from, to).length * businessHoursPerDay * 60
  return {
    total: active.length,
    cancelled: inPeriod.length - active.length,
    occupancy: Math.round((bookedMinutes(active, from, to) / capacity) * 100),
    clients: new Set(active.map(item => item.clientId)).size
  }
})

function createOn(day: Date) {
  navigateTo({ path: '/agendamentos/novo', query: { data: toDateParam(day) } })
}
</script>

<template>
  <div>
    <AppTopbar title="Agenda">
      <SearchInput v-model="search" class="topbar-search" label="Buscar agendamentos…" compact />
    </AppTopbar>

    <div class="page">
      <div class="toolbar">
        <div class="period">
          <button class="icon-btn" type="button" aria-label="Período anterior" @click="shift(-1)">
            <ChevronLeft :size="18" aria-hidden="true" />
          </button>
          <h2 class="period-title" aria-live="polite">{{ title }}</h2>
          <button class="icon-btn" type="button" aria-label="Próximo período" @click="shift(1)">
            <ChevronRight :size="18" aria-hidden="true" />
          </button>
        </div>

        <div class="toolbar-actions">
          <label class="toggle">
            <input v-model="showCancelled" type="checkbox">
            Mostrar cancelados
          </label>
          <button class="btn btn-secondary" type="button" @click="go(new Date())">Hoje</button>
          <div class="segmented" role="group" aria-label="Visualização">
            <button
              v-for="item in views"
              :key="item.value"
              type="button"
              :aria-pressed="view === item.value"
              @click="go(anchor, item.value)"
            >{{ item.label }}</button>
          </div>
          <NuxtLink
            class="btn btn-primary"
            :to="{ path: '/agendamentos/novo', query: anchor >= startOfDay(now) ? { data: toDateParam(anchor) } : {} }"
          ><Plus :size="17" aria-hidden="true" /> Novo agendamento</NuxtLink>
        </div>
      </div>

      <StateBlock v-if="!data" :loading="pending" :error="error" @retry="refresh" />
      <template v-else>
        <CalendarMonthGrid
          v-if="view === 'mes'"
          :month="anchor"
          :appointments="visible"
          :now="now"
          @select="selected = $event"
          @day="go($event, 'dia')"
        />
        <CalendarTimeGrid
          v-else
          :days="days"
          :appointments="visible"
          :now="now"
          @select="selected = $event"
          @create="createOn"
        />

        <div class="stat-grid">
          <StatCard
            label="Agendamentos no período"
            :value="stats.total"
            :icon="CalendarCheck"
            :badge="stats.cancelled ? `${stats.cancelled} cancelado${stats.cancelled > 1 ? 's' : ''}` : undefined"
            badge-tone="warning"
          />
          <StatCard label="Ocupação do expediente" :value="`${stats.occupancy}%`" :icon="Gauge" tone="purple" />
          <StatCard label="Clientes atendidos" :value="stats.clients" :icon="UsersRound" tone="orange" />
        </div>
      </template>
    </div>

    <AppointmentDetailsModal v-if="selected" :appointment="selected" @close="selected = null" @changed="refresh" />
  </div>
</template>

<style scoped>
.topbar-search { width: min(260px, 100%); }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.period { display: flex; align-items: center; gap: 4px; padding: 2px; border-radius: var(--radius-md); background: var(--color-surface-muted); }
.period-title { min-width: 200px; font-size: 15px; font-weight: 600; text-align: center; }
.period-title::first-letter { text-transform: uppercase; }
.toolbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.toggle { display: flex; align-items: center; gap: 6px; margin-right: 4px; color: var(--color-text-muted); font-size: 13px; }
.toggle input { accent-color: var(--color-primary); }

.segmented { display: flex; padding: 3px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); background: var(--color-surface); }

.segmented button {
  min-height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--color-text-muted);
  font-weight: 500;
}

.segmented button[aria-pressed='true'] { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }

@media (max-width: 640px) {
  .topbar-search { display: none; }
  .period { width: 100%; justify-content: space-between; }
  .period-title { min-width: 0; }
}
</style>
