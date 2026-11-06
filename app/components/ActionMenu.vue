<script setup lang="ts">
import type { Component } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'

export interface ActionMenuItem {
  label: string
  icon?: Component
  danger?: boolean
  disabled?: boolean
  hint?: string
  onSelect: () => void
}

defineProps<{ items: ActionMenuItem[], label: string }>()

const open = ref(false)
const position = ref({ top: 0, right: 0 })
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const menu = useTemplateRef<HTMLDivElement>('menu')

function close() {
  open.value = false
}

async function toggle() {
  if (open.value) return close()
  const rect = trigger.value!.getBoundingClientRect()
  position.value = { top: rect.bottom + 4, right: window.innerWidth - rect.right }
  open.value = true
  await nextTick()
  // Se não couber abaixo do botão, abre para cima.
  const height = menu.value?.offsetHeight ?? 0
  if (rect.bottom + height + 8 > window.innerHeight) position.value.top = rect.top - height - 4
  menu.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  if (!menu.value?.contains(target) && !trigger.value?.contains(target)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  close()
  trigger.value?.focus()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
  } else {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
    window.removeEventListener('scroll', close, true)
    window.removeEventListener('resize', close)
  }
})

onBeforeUnmount(close)

function select(item: ActionMenuItem) {
  close()
  item.onSelect()
}
</script>

<template>
  <button
    ref="trigger"
    class="icon-btn"
    type="button"
    aria-haspopup="menu"
    :aria-expanded="open"
    :aria-label="label"
    @click="toggle"
  >
    <MoreHorizontal :size="18" aria-hidden="true" />
  </button>
  <Teleport to="body">
    <div
      v-if="open"
      ref="menu"
      class="menu"
      role="menu"
      :style="{ top: `${position.top}px`, right: `${position.right}px` }"
    >
      <button
        v-for="item in items"
        :key="item.label"
        class="menu-item"
        :class="{ danger: item.danger }"
        type="button"
        role="menuitem"
        :disabled="item.disabled"
        :title="item.hint"
        @click="select(item)"
      >
        <component :is="item.icon" v-if="item.icon" :size="16" aria-hidden="true" />
        <span>{{ item.label }}<small v-if="item.hint">{{ item.hint }}</small></span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.menu {
  position: fixed;
  z-index: 50;
  display: flex;
  flex-direction: column;
  min-width: 190px;
  max-width: 280px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-float);
}

.menu-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  text-align: left;
}

.menu-item svg { flex: none; margin-top: 2px; }
.menu-item:hover:not(:disabled) { background: var(--color-surface-muted); }
.menu-item:disabled { cursor: not-allowed; color: var(--color-text-faint); }
.menu-item.danger:not(:disabled) { color: var(--color-danger); }
.menu-item small { display: block; font-size: 11px; color: var(--color-text-muted); }
</style>
