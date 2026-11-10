<script setup lang="ts">
const { current, settle } = useConfirm()
</script>

<template>
  <BaseModal v-if="current" :title="current.title" narrow @close="settle(false)">
    <p>{{ current.message }}</p>
    <template #footer>
      <button class="btn btn-secondary" type="button" @click="settle(false)">{{ current.cancelLabel ?? 'Cancelar' }}</button>
      <button class="btn" :class="current.danger ? 'btn-danger' : 'btn-primary'" type="button" @click="settle(true)">
        {{ current.confirmLabel }}
      </button>
    </template>
  </BaseModal>
</template>
