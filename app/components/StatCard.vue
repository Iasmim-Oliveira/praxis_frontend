<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  icon?: Component
  tone?: 'blue' | 'purple' | 'orange' | 'green'
  badge?: string
  badgeTone?: 'success' | 'primary' | 'purple' | 'warning'
}>()
</script>

<template>
  <div class="card stat">
    <div v-if="icon || badge" class="stat-top">
      <span v-if="icon" class="icon-tile" :class="`tone-${tone ?? 'blue'}`">
        <component :is="icon" :size="18" aria-hidden="true" />
      </span>
      <span v-if="badge" class="badge" :class="badgeTone">{{ badge }}</span>
    </div>
    <p class="stat-label">{{ label }}</p>
    <p class="stat-value">{{ value }}</p>
  </div>
</template>

<style scoped>
.stat { padding: 16px 18px; }
.stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
.stat-label { color: var(--color-text-muted); font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; }
.stat-value { margin-top: 2px; font-size: 24px; font-weight: 600; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
</style>
