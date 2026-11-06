<script setup lang="ts">
defineProps<{ name: string, size?: number }>()
</script>

<template>
  <span
    class="avatar"
    :style="{ width: `${size ?? 36}px`, height: `${size ?? 36}px`, fontSize: `${(size ?? 36) * 0.36}px` }"
    aria-hidden="true"
  >{{ initials(name) }}</span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 50%;
  background: #dfe6f0;
  color: #475569;
  font-weight: 600;
}
</style>
