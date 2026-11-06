<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'

defineProps<{ id: string, invalid?: boolean, autocomplete: string, placeholder?: string }>()

const model = defineModel<string>({ required: true })
const visible = ref(false)
</script>

<template>
  <div class="password">
    <input
      :id="id"
      v-model="model"
      class="input"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :aria-invalid="invalid"
    >
    <button
      class="icon-btn"
      type="button"
      :aria-label="visible ? 'Ocultar senha' : 'Mostrar senha'"
      @click="visible = !visible"
    >
      <component :is="visible ? EyeOff : Eye" :size="17" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.password { position: relative; }
.password .input { padding-right: 42px; }
.password .icon-btn { position: absolute; top: 3px; right: 3px; }
</style>
