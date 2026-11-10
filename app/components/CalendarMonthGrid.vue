<script setup lang="ts">
import type { AppointmentWithRelations } from '~/types/api'

const props = defineProps<{ month: Date, appointments: AppointmentWithRelations[], now: Date }>()
const emit = defineEmits<{ select: [AppointmentWithRelations], day: [Date] }>()

const MAX_VISIBLE = 3

const weekdays = computed(() => eachDay(startOfWeek(props.now), endOfWeek(props.now)).map(formatWeekday))

const cells = computed(() =>
  eachDay(startOfWeek(startOfMonth(props.month)), endOfWeek(endOfMonth(props.month))).map(day => ({
    day,
    outside: day.getMonth() !== props.month.getMonth(),
    items: props.appointments.filter(item => isSameDay(new Date(item.startsAt), day))
  }))
)
</script>

<template>
  <div class="card scroller">
    <div class="month">
      <div v-for="weekday in weekdays" :key="weekday" class="weekday">{{ weekday }}</div>
      <div
        v-for="{ day, outside, items } in cells"
        :key="day.getTime()"
        class="cell"
        :class="{ outside, today: isSameDay(day, now) }"
      >
        <button class="day-number" type="button" :aria-label="`Ver ${formatLongDate(day)}`" @click="emit('day', day)">
          {{ day.getDate() }}
        </button>
        <button
          v-for="item in items.slice(0, MAX_VISIBLE)"
          :key="item.id"
          class="chip"
          :class="[`tone-${serviceStyle(item.serviceId).tone}`, { cancelled: item.status === 'CANCELLED' }]"
          type="button"
          @click="emit('select', item)"
        >
          {{ formatTime(item.startsAt) }} {{ item.client.name }}
        </button>
        <button v-if="items.length > MAX_VISIBLE" class="more" type="button" @click="emit('day', day)">
          +{{ items.length - MAX_VISIBLE }} mais
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroller { overflow-x: auto; }
.month { display: grid; grid-template-columns: repeat(7, minmax(100px, 1fr)); min-width: 700px; }

.weekday {
  padding: 10px;
  border-bottom: 1px solid var(--color-border);
  background: #f8fafc;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
}

.cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 112px;
  padding: 6px;
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.cell:nth-child(7n) { border-right: 0; }
.cell.outside { background: #fafbfc; }
.cell.outside .day-number { color: var(--color-text-faint); }

.day-number {
  align-self: flex-end;
  min-width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: none;
  font-weight: 600;
}

.day-number:hover { background: var(--color-surface-muted); }
.cell.today .day-number { background: var(--color-primary); color: #fff; }

.chip, .more {
  overflow: hidden;
  padding: 2px 6px;
  border: 0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip.cancelled { background: var(--color-surface-muted); color: var(--color-text-faint); text-decoration: line-through; }
.more { background: none; color: var(--color-text-muted); }
.more:hover { color: var(--color-primary); }
</style>
