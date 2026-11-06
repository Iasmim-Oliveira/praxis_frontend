<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{ min: Date }>()

const model = defineModel<Date>({ required: true })
const month = ref(startOfMonth(model.value))

watch(model, (date) => {
  month.value = startOfMonth(date)
})

const weekdays = computed(() => eachDay(startOfWeek(props.min), endOfWeek(props.min)).map(formatWeekday))
const days = computed(() => eachDay(startOfWeek(month.value), endOfWeek(endOfMonth(month.value))))
const canGoBack = computed(() => month.value > startOfMonth(props.min))
const isDisabled = (day: Date) => day < startOfDay(props.min)
</script>

<template>
  <div class="calendar">
    <div class="calendar-head">
      <strong>{{ formatMonthYear(month) }}</strong>
      <span>
        <button class="icon-btn" type="button" aria-label="Mês anterior" :disabled="!canGoBack" @click="month = addMonths(month, -1)">
          <ChevronLeft :size="16" aria-hidden="true" />
        </button>
        <button class="icon-btn" type="button" aria-label="Próximo mês" @click="month = addMonths(month, 1)">
          <ChevronRight :size="16" aria-hidden="true" />
        </button>
      </span>
    </div>
    <div class="days">
      <span v-for="weekday in weekdays" :key="weekday" class="weekday">{{ weekday.slice(0, 3) }}</span>
      <button
        v-for="day in days"
        :key="day.getTime()"
        class="day"
        :class="{ outside: day.getMonth() !== month.getMonth(), selected: isSameDay(day, model) }"
        type="button"
        :disabled="isDisabled(day)"
        :aria-label="formatLongDate(day)"
        :aria-pressed="isSameDay(day, model)"
        @click="model = day"
      >{{ day.getDate() }}</button>
    </div>
  </div>
</template>

<style scoped>
.calendar { padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: #fafbfc; }
.calendar-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.calendar-head strong { font-size: 14px; font-weight: 600; }
.calendar-head strong::first-letter { text-transform: uppercase; }
.calendar-head .icon-btn { width: 28px; height: 28px; }
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.weekday { padding: 4px 0; color: var(--color-text-muted); font-size: 10px; font-weight: 600; text-align: center; text-transform: uppercase; }

.day {
  aspect-ratio: 1;
  max-height: 38px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.day:hover:not(:disabled) { background: var(--color-primary-soft); }
.day:disabled { cursor: not-allowed; color: #c3cad5; }
.day.outside:not(:disabled) { color: var(--color-text-faint); }
.day.selected { background: var(--color-primary); color: #fff; font-weight: 600; }
</style>
