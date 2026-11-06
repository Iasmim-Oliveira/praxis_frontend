<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ title: string, narrow?: boolean }>()

const emit = defineEmits<{ close: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

onMounted(() => dialog.value?.showModal())
</script>

<template>
  <dialog ref="dialog" class="modal" :class="{ narrow }" :aria-label="title" @close="emit('close')">
    <header class="modal-header">
      <h2 class="section-title">{{ title }}</h2>
      <button class="icon-btn" type="button" aria-label="Fechar" @click="emit('close')">
        <X :size="18" aria-hidden="true" />
      </button>
    </header>
    <div class="modal-body"><slot /></div>
    <footer v-if="$slots.footer" class="modal-footer"><slot name="footer" /></footer>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 0;
  border-radius: var(--radius-lg);
  color: var(--color-text);
  box-shadow: var(--shadow-float);
}

.modal.narrow { width: min(420px, calc(100vw - 32px)); }
.modal::backdrop { background: rgb(15 23 42 / 45%); }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 14px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-body { padding: 20px; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--color-border);
}
</style>
