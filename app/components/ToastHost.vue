<script setup lang="ts">
import { CircleAlert, CircleCheck, X } from 'lucide-vue-next'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.kind">
      <component :is="toast.kind === 'error' ? CircleAlert : CircleCheck" :size="18" aria-hidden="true" />
      <div class="toast-text">
        <p>{{ toast.message }}</p>
        <small v-if="toast.detail">{{ toast.detail }}</small>
      </div>
      <button class="icon-btn" type="button" aria-label="Dispensar" @click="dismiss(toast.id)">
        <X :size="15" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(360px, calc(100vw - 32px));
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 8px 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-float);
}

.toast > svg { flex: none; margin-top: 7px; }
.toast.success > svg { color: var(--color-success); }
.toast.error > svg { color: var(--color-danger); }
.toast-text { flex: 1; min-width: 0; padding-top: 5px; }
.toast-text small { color: var(--color-text-muted); overflow-wrap: anywhere; }
</style>
