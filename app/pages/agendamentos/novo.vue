<script setup lang="ts">
useHead({ title: 'Novo agendamento · Praxis Diary' })

const route = useRoute()

// Datas passadas não são oferecidas: a API aceitaria, mas o front bloqueia.
const initialDate = computed(() => {
  const date = parseDateParam(route.query.data)
  return date && date >= startOfDay(new Date()) ? date : null
})
</script>

<template>
  <div>
    <AppTopbar title="Novo agendamento" />
    <div class="page">
      <AppointmentForm
        :initial-date="initialDate"
        :initial-client-id="typeof route.query.cliente === 'string' ? route.query.cliente : undefined"
      />
    </div>
  </div>
</template>
