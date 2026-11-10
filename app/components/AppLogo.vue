<script setup lang="ts">
import { CalendarCheck } from 'lucide-vue-next'

defineProps<{ size?: number }>()
</script>

<template>
  <span class="logo" :style="{ width: `${size ?? 34}px`, height: `${size ?? 34}px` }">
    <CalendarCheck :size="(size ?? 34) * 0.55" aria-hidden="true" />
  </span>
</template>

<style scoped>
.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border: 1px solid var(--color-border);
  border-radius: 25%;
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-card);
}
</style>
