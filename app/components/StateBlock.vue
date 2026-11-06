<script setup lang="ts">
import { Inbox, TriangleAlert } from 'lucide-vue-next'

const props = defineProps<{
  error?: ApiError | null
  loading?: boolean
  title?: string
  message?: string
}>()

defineEmits<{ retry: [] }>()

const code = computed(() => (props.error ? errorCode(props.error) : undefined))
</script>

<template>
  <div v-if="loading" class="state" role="status">
    <span class="spinner" aria-hidden="true" />
    <span class="sr-only">Carregando…</span>
  </div>
  <div v-else-if="error" class="state" role="alert">
    <TriangleAlert :size="24" aria-hidden="true" />
    <p class="state-title">Não foi possível carregar</p>
    <p>{{ error.message }}</p>
    <p v-if="code" class="state-code">{{ code }}</p>
    <button class="btn btn-secondary" type="button" @click="$emit('retry')">Tentar novamente</button>
  </div>
  <div v-else class="state">
    <Inbox :size="24" aria-hidden="true" />
    <p class="state-title">{{ title }}</p>
    <p v-if="message">{{ message }}</p>
    <slot />
  </div>
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 20px;
  color: var(--color-text-muted);
  text-align: center;
}

.state-title { color: var(--color-text); font-weight: 600; }
.state-code { font-size: 12px; }
.state .btn { margin-top: 8px; }

.spinner {
  width: 26px;
  height: 26px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
