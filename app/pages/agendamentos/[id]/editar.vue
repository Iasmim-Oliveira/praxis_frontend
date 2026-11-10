<script setup lang="ts">
import type { AppointmentWithRelations } from '~/types/api'

useHead({ title: 'Reagendar · Praxis Diary' })

const route = useRoute()
const { data, error, pending, refresh } = useResource(() =>
  api<AppointmentWithRelations>(`/appointments/${route.params.id}`)
)
</script>

<template>
  <div>
    <AppTopbar title="Reagendar" />
    <div class="page">
      <StateBlock v-if="!data" :loading="pending" :error="error" @retry="refresh" />
      <div v-else-if="data.status === 'CANCELLED'" class="card">
        <StateBlock title="Este agendamento foi cancelado" message="Agendamentos cancelados não podem ser editados. Crie um novo.">
          <NuxtLink to="/agendamentos/novo" class="btn btn-primary">Novo agendamento</NuxtLink>
        </StateBlock>
      </div>
      <AppointmentForm v-else :appointment="data" />
    </div>
  </div>
</template>
