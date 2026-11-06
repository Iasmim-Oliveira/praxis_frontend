<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{ total: number, pageSize: number, noun: string }>()

const page = defineModel<number>({ required: true })
const pages = computed(() => Math.max(Math.ceil(props.total / props.pageSize), 1))
const first = computed(() => (props.total ? (page.value - 1) * props.pageSize + 1 : 0))
const last = computed(() => Math.min(page.value * props.pageSize, props.total))
</script>

<template>
  <div class="pagination">
    <span>Mostrando {{ first }} a {{ last }} de {{ total.toLocaleString('pt-BR') }} {{ noun }}</span>
    <div v-if="pages > 1" class="pages">
      <button class="page-btn" type="button" aria-label="Página anterior" :disabled="page === 1" @click="page--">
        <ChevronLeft :size="15" aria-hidden="true" />
      </button>
      <button
        v-for="number in pages"
        :key="number"
        class="page-btn"
        :class="{ current: number === page }"
        type="button"
        :aria-current="number === page ? 'page' : undefined"
        @click="page = number"
      >{{ number }}</button>
      <button class="page-btn" type="button" aria-label="Próxima página" :disabled="page === pages" @click="page++">
        <ChevronRight :size="15" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 12px;
}

.pages { display: flex; flex-wrap: wrap; gap: 4px; }

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.page-btn:disabled { cursor: not-allowed; opacity: 0.45; }
.page-btn.current { border-color: var(--color-primary); background: var(--color-primary); color: #fff; font-weight: 600; }
</style>
