<script setup lang="ts">
defineProps<{ title: string, subtitle: string }>()
</script>

<template>
  <h1 class="auth-title">{{ title }}</h1>
  <p class="auth-subtitle">{{ subtitle }}</p>
  <div class="card auth-card"><slot /></div>
  <p class="auth-footer"><slot name="footer" /></p>
</template>

<style scoped>
.auth-title { margin-top: 14px; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.auth-subtitle { margin-top: 6px; color: var(--color-text-muted); text-align: center; max-width: 290px; }
.auth-card { width: 100%; margin-top: 20px; padding: 22px 18px; }
.auth-footer { margin-top: 22px; color: var(--color-text-muted); }
.auth-footer :deep(a) { color: var(--color-primary); font-weight: 500; }
.auth-footer :deep(a:hover) { text-decoration: underline; }
</style>
