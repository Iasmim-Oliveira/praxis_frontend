<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import type { AppointmentWithRelations } from '~/types/api'

const props = defineProps<{ days: Date[], appointments: AppointmentWithRelations[], now: Date }>()
const emit = defineEmits<{ select: [AppointmentWithRelations], create: [Date] }>()

const HOUR_HEIGHT = 56
const MIN_EVENT_HEIGHT = 22

const hourOf = (value: string) => {
  const date = new Date(value)
  return date.getHours() + date.getMinutes() / 60
}

// O expediente é 08h–18h, mas a API aceita horários fora dele: a grade se estende para mostrá-los.
const hours = computed(() => {
  let first = BUSINESS_START_HOUR
  let last = BUSINESS_END_HOUR
  for (const item of props.appointments) {
    first = Math.min(first, Math.floor(hourOf(item.startsAt)))
    const end = new Date(item.endsAt)
    last = Math.max(last, isSameDay(end, new Date(item.startsAt)) ? Math.ceil(hourOf(item.endsAt)) : 24)
  }
  return Array.from({ length: last - first }, (_, index) => first + index)
})

const firstHour = computed(() => hours.value[0]!)

/** Distribui agendamentos sobrepostos (ex.: cancelados) lado a lado. */
function layoutDay(day: Date) {
  const dayStart = startOfDay(day).getTime() + firstHour.value * 3_600_000
  const dayEnd = endOfDay(day).getTime()
  const items = props.appointments
    .filter(item => isSameDay(new Date(item.startsAt), day))
    .map(item => ({
      item,
      start: Math.max(new Date(item.startsAt).getTime(), dayStart),
      end: Math.min(new Date(item.endsAt).getTime(), dayEnd)
    }))
    .sort((a, b) => a.start - b.start)

  const placed: { item: AppointmentWithRelations, start: number, end: number, lane: number, lanes: number }[] = []
  let cluster: typeof placed = []
  let laneEnds: number[] = []
  let clusterEnd = 0

  const closeCluster = () => {
    for (const entry of cluster) entry.lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }

  for (const entry of items) {
    if (entry.start >= clusterEnd) closeCluster()
    let lane = laneEnds.findIndex(end => end <= entry.start)
    if (lane === -1) lane = laneEnds.push(0) - 1
    laneEnds[lane] = entry.end
    clusterEnd = Math.max(clusterEnd, entry.end)
    const positioned = { ...entry, lane, lanes: 1 }
    cluster.push(positioned)
    placed.push(positioned)
  }
  closeCluster()

  return placed.map(({ item, start, end, lane, lanes }) => ({
    item,
    compact: ((end - start) / 3_600_000) * HOUR_HEIGHT < 50,
    style: {
      top: `${((start - dayStart) / 3_600_000) * HOUR_HEIGHT}px`,
      height: `${Math.max(((end - start) / 3_600_000) * HOUR_HEIGHT, MIN_EVENT_HEIGHT)}px`,
      left: `calc(${(lane / lanes) * 100}% + 3px)`,
      width: `calc(${100 / lanes}% - 6px)`
    }
  }))
}

const columns = computed(() => props.days.map(day => ({ day, events: layoutDay(day) })))

const nowTop = computed(() => {
  if (!props.days.some(day => isSameDay(day, props.now))) return null
  const offset = props.now.getHours() + props.now.getMinutes() / 60 - firstHour.value
  return offset >= 0 && offset <= hours.value.length ? offset * HOUR_HEIGHT : null
})

const isOffHours = (hour: number) => hour < BUSINESS_START_HOUR || hour >= BUSINESS_END_HOUR
const isPast = (day: Date) => endOfDay(day) < props.now

function eventLabel(item: AppointmentWithRelations) {
  const status = item.status === 'CANCELLED' ? ', cancelado' : ''
  return `${formatTimeRange(item.startsAt, item.endsAt)}, ${item.service.name} com ${item.client.name}${status}`
}
</script>

<template>
  <div class="card scroller">
    <div class="grid" :style="{ '--days': days.length }">
      <div class="corner"><Clock :size="16" aria-hidden="true" /></div>
      <div
        v-for="{ day } in columns"
        :key="`head-${day.getTime()}`"
        class="day-head"
        :class="{ today: isSameDay(day, now) }"
      >
        <small>{{ formatWeekday(day) }}</small>
        <strong>{{ day.getDate() }}</strong>
      </div>

      <div class="gutter">
        <span v-for="hour in hours" :key="hour" class="hour-label" :style="{ height: `${HOUR_HEIGHT}px` }">
          {{ String(hour).padStart(2, '0') }}:00
        </span>
      </div>

      <div
        v-for="{ day, events } in columns"
        :key="`col-${day.getTime()}`"
        class="day-col"
        :class="{ today: isSameDay(day, now), past: isPast(day) }"
        :title="isPast(day) ? undefined : 'Clique para agendar neste dia'"
        @click.self="!isPast(day) && emit('create', day)"
      >
        <div
          v-for="hour in hours"
          :key="hour"
          class="hour-cell"
          :class="{ off: isOffHours(hour) }"
          :style="{ height: `${HOUR_HEIGHT}px` }"
        />
        <button
          v-for="{ item, style, compact } in events"
          :key="item.id"
          class="event"
          :class="[`tone-${serviceStyle(item.serviceId).tone}`, { cancelled: item.status === 'CANCELLED', compact }]"
          :style="style"
          type="button"
          :aria-label="eventLabel(item)"
          @click="emit('select', item)"
        >
          <span class="event-time">{{ formatTimeRange(item.startsAt, item.endsAt) }}</span>
          <span class="event-title">{{ item.service.name }}</span>
          <span v-if="!compact" class="event-client">{{ item.client.name }}</span>
        </button>
      </div>

      <div v-if="nowTop !== null" class="now-line" :style="{ top: `${nowTop}px` }" aria-hidden="true">
        <span class="now-pill">Agora</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroller { overflow-x: auto; }

.grid {
  position: relative;
  display: grid;
  grid-template-columns: 64px repeat(var(--days), minmax(108px, 1fr));
  grid-template-rows: auto 1fr;
  min-width: calc(64px + var(--days) * 108px);
}

.corner, .day-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 58px;
  border-bottom: 1px solid var(--color-border);
  background: #f8fafc;
  color: var(--color-text-muted);
}

.day-head { border-left: 1px solid var(--color-border); }
.day-head small { font-size: 11px; font-weight: 600; text-transform: uppercase; }
.day-head strong { color: var(--color-text); font-size: 18px; font-weight: 600; }
.day-head.today { box-shadow: inset 0 3px var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary); }
.day-head.today strong { color: var(--color-primary); }

.gutter { display: flex; flex-direction: column; background: #f8fafc; }
.hour-label { padding: 4px 8px 0 0; color: var(--color-text-faint); font-size: 11px; text-align: right; font-variant-numeric: tabular-nums; }

.day-col { position: relative; border-left: 1px solid var(--color-border); cursor: copy; }
.day-col.past { cursor: default; }
.day-col.today { background: rgb(234 240 253 / 45%); }
.hour-cell { border-bottom: 1px solid var(--color-border); pointer-events: none; }
.hour-cell.off { background: repeating-linear-gradient(-45deg, transparent 0 6px, rgb(148 163 184 / 10%) 6px 12px); }

.event {
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 8px;
  overflow: hidden;
  border: 0;
  border-left: 3px solid currentcolor;
  border-radius: var(--radius-sm);
  text-align: left;
  font-size: 11px;
  line-height: 1.3;
}

.event.compact { padding-top: 2px; padding-bottom: 2px; }
.event:hover { filter: brightness(0.96); box-shadow: var(--shadow-card); }
.event-time { font-weight: 700; font-variant-numeric: tabular-nums; }
.event-title { color: var(--color-text); font-weight: 600; }
.event-client { color: var(--color-text-muted); }
.event span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.event.cancelled {
  border-left-color: var(--color-border-strong);
  background: repeating-linear-gradient(-45deg, #f8fafc 0 6px, #eef2f6 6px 12px);
  color: var(--color-text-faint);
}

.event.cancelled span { color: var(--color-text-faint); text-decoration: line-through; }

.now-line {
  position: absolute;
  left: 64px;
  right: 0;
  z-index: 2;
  margin-top: 58px;
  border-top: 2px solid var(--color-danger);
  pointer-events: none;
}

.now-line::before {
  content: '';
  position: absolute;
  top: -6px;
  left: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-danger);
}

.now-pill {
  position: absolute;
  top: -10px;
  right: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--color-danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}
</style>
