<script setup lang="ts">
import { Menu } from 'lucide-vue-next'

defineProps<{ title: string }>()

const { open } = useSidebar()
</script>

<template>
  <header class="topbar">
    <button class="icon-btn menu" type="button" aria-label="Abrir menu" @click="open = true">
      <Menu :size="20" aria-hidden="true" />
    </button>
    <h1>{{ title }}</h1>
    <div class="actions"><slot /></div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--topbar-height);
  padding: 0 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

h1 { font-size: 18px; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }

.actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex: 1; min-width: 0; }
.menu { display: none; margin-left: -8px; }

@media (max-width: 900px) {
  .menu { display: inline-flex; }
}

@media (max-width: 640px) {
  .topbar { padding: 0 16px; }
}
</style>
