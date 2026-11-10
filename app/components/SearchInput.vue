<script setup lang="ts">
import { Search } from 'lucide-vue-next'

defineProps<{ label: string, compact?: boolean }>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <label class="search" :class="{ compact }">
    <span class="sr-only">{{ label }}</span>
    <Search :size="16" aria-hidden="true" />
    <input v-model="model" class="input" type="search" :placeholder="label">
  </label>
</template>
