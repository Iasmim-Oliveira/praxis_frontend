<script setup lang="ts">
import { CalendarPlus, Download, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import type { AppointmentWithRelations, Client } from '~/types/api'
import type { ActionMenuItem } from '~/components/ActionMenu.vue'

type Tab = 'todos' | 'recentes' | 'agendados' | 'inativos'

useHead({ title: 'Clientes · Praxis Diary' })

const toast = useToast()
const { confirm } = useConfirm()
const now = useNow()

const { data, error, pending, refresh } = useResource(async () => {
  const [clients, appointments] = await Promise.all([
    api<Client[]>('/clients'),
    api<AppointmentWithRelations[]>('/appointments')
  ])
  return { clients, appointments }
})

const INACTIVE_AFTER_DAYS = 90
const RECENT_DAYS = 30

const tabs: { value: Tab, label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'agendados', label: 'Com horário marcado' },
  { value: 'recentes', label: 'Recentes' },
  { value: 'inativos', label: 'Inativos' }
]

const tab = ref<Tab>('todos')
const search = ref('')
const editing = shallowRef<Client | null>(null)
const creating = ref(false)

const rows = computed(() => {
  if (!data.value) return []
  const byClient = new Map<string, AppointmentWithRelations[]>()
  for (const item of data.value.appointments) {
    if (item.status !== 'SCHEDULED') continue
    byClient.set(item.clientId, [...(byClient.get(item.clientId) ?? []), item])
  }
  return data.value.clients.map((client) => {
    const history = byClient.get(client.id) ?? []
    const past = history.filter(item => new Date(item.startsAt) <= now.value)
    return {
      client,
      total: history.length,
      last: past.at(-1)?.startsAt ?? null,
      next: history.find(item => new Date(item.startsAt) > now.value)?.startsAt ?? null
    }
  })
})

const stats = computed(() => {
  const monthStart = startOfMonth(now.value)
  const monthEnd = endOfMonth(now.value)
  const withHistory = rows.value.filter(row => row.total > 0)
  const activeThisMonth = new Set(
    (data.value?.appointments ?? [])
      .filter(item => item.status === 'SCHEDULED')
      .filter(item => new Date(item.startsAt) >= monthStart && new Date(item.startsAt) <= monthEnd)
      .map(item => item.clientId)
  )
  const totalAppointments = rows.value.reduce((sum, row) => sum + row.total, 0)
  return {
    total: rows.value.length,
    newThisMonth: rows.value.filter(row => new Date(row.client.createdAt) >= monthStart).length,
    activeThisMonth: activeThisMonth.size,
    returning: withHistory.length
      ? `${Math.round((withHistory.filter(row => row.total > 1).length / withHistory.length) * 100)}%`
      : '—',
    average: rows.value.length ? (totalAppointments / rows.value.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0'
  }
})

const filtered = computed(() => {
  const recentSince = addDays(now.value, -RECENT_DAYS)
  const inactiveSince = addDays(now.value, -INACTIVE_AFTER_DAYS)
  return rows.value
    .filter((row) => {
      if (tab.value === 'agendados') return !!row.next
      if (tab.value === 'recentes') return new Date(row.client.createdAt) >= recentSince
      if (tab.value === 'inativos') return !row.next && (!row.last || new Date(row.last) < inactiveSince)
      return true
    })
    .filter(row => matches(search.value, row.client.name, row.client.email, row.client.phone))
})

const { page, pageItems, pageSize } = usePagination(filtered)
watch([tab, search], () => {
  page.value = 1
})

function onSaved(client: Client) {
  toast.success(editing.value ? 'Cliente atualizado.' : 'Cliente cadastrado.')
  editing.value = null
  creating.value = false
  if (data.value) {
    const clients = data.value.clients.filter(item => item.id !== client.id)
    data.value = { ...data.value, clients: [...clients, client].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) }
  }
}

async function remove(client: Client) {
  const accepted = await confirm({
    title: 'Excluir cliente',
    message: `Excluir ${client.name}? Clientes com agendamentos, inclusive cancelados, não podem ser excluídos.`,
    confirmLabel: 'Excluir',
    danger: true
  })
  if (!accepted) return
  try {
    await api(`/clients/${client.id}`, { method: 'DELETE' })
    toast.success('Cliente excluído.')
    refresh()
  } catch (cause) {
    toast.apiError(cause)
  }
}

function menuItems(client: Client): ActionMenuItem[] {
  return [
    { label: 'Agendar', icon: CalendarPlus, onSelect: () => navigateTo({ path: '/agendamentos/novo', query: { cliente: client.id } }) },
    { label: 'Editar', icon: Pencil, onSelect: () => (editing.value = client) },
    { label: 'Excluir', icon: Trash2, danger: true, onSelect: () => remove(client) }
  ]
}

function exportCsv() {
  downloadCsv(`clientes-${toDateParam(now.value)}.csv`, [
    ['Nome', 'E-mail', 'Telefone', 'Observações', 'Agendamentos', 'Cliente desde'],
    ...filtered.value.map(({ client, total }) => [
      client.name,
      client.email,
      client.phone,
      client.notes,
      total,
      formatDate(client.createdAt, { dateStyle: 'short' })
    ])
  ])
}
</script>

<template>
  <div>
    <AppTopbar title="Clientes">
      <SearchInput v-model="search" class="topbar-search" label="Buscar clientes…" compact />
      <button class="btn btn-primary" type="button" @click="creating = true">
        <Plus :size="17" aria-hidden="true" /> Novo cliente
      </button>
    </AppTopbar>

    <div class="page">
      <StateBlock v-if="!data" :loading="pending" :error="error" @retry="refresh" />
      <template v-else>
        <div class="stat-grid">
          <StatCard
            label="Total de clientes"
            :value="stats.total.toLocaleString('pt-BR')"
            :badge="stats.newThisMonth ? `+${stats.newThisMonth} no mês` : undefined"
            badge-tone="success"
          />
          <StatCard label="Com agendamento no mês" :value="stats.activeThisMonth" />
          <StatCard label="Taxa de retorno" :value="stats.returning" />
          <StatCard label="Agendamentos por cliente" :value="stats.average" />
        </div>

        <section class="card" aria-label="Lista de clientes">
          <div class="card-header list-header">
            <div class="tabs" role="tablist" aria-label="Filtrar clientes">
              <button
                v-for="item in tabs"
                :key="item.value"
                class="tab"
                type="button"
                role="tab"
                :aria-selected="tab === item.value"
                @click="tab = item.value"
              >{{ item.label }}</button>
            </div>
            <button class="icon-btn" type="button" title="Exportar CSV" aria-label="Exportar CSV" :disabled="!filtered.length" @click="exportCsv">
              <Download :size="17" aria-hidden="true" />
            </button>
          </div>

          <div v-if="pageItems.length" class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Contato</th>
                  <th scope="col">Histórico</th>
                  <th scope="col">Situação</th>
                  <th scope="col" class="align-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="{ client, total, last, next } in pageItems" :key="client.id">
                  <td>
                    <div class="person">
                      <UserAvatar :name="client.name" />
                      <div>
                        <p class="cell-title">{{ client.name }}</p>
                        <p class="cell-subtitle">Cliente desde {{ formatDate(client.createdAt, { month: 'short', year: 'numeric' }) }}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p>{{ client.email || '—' }}</p>
                    <p class="cell-subtitle">{{ client.phone }}</p>
                  </td>
                  <td>
                    <p class="cell-title">{{ plural(total, 'agendamento', 'agendamentos') }}</p>
                    <p class="cell-subtitle">{{ last ? `Último: ${formatRelative(last)}` : 'Nenhum atendimento ainda' }}</p>
                  </td>
                  <td>
                    <span v-if="next" class="badge success" :title="formatLongDate(next)">
                      Próximo: {{ formatDate(next, { day: '2-digit', month: '2-digit' }) }}
                    </span>
                    <span v-else class="badge">Sem horário</span>
                  </td>
                  <td class="align-right">
                    <ActionMenu :items="menuItems(client)" :label="`Ações para ${client.name}`" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <StateBlock
            v-else
            :title="data.clients.length ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'"
            :message="data.clients.length ? 'Ajuste a busca ou o filtro.' : 'Cadastre o primeiro cliente para começar a agendar.'"
          >
            <button v-if="!data.clients.length" class="btn btn-primary" type="button" @click="creating = true">Novo cliente</button>
          </StateBlock>

          <PaginationBar v-if="filtered.length" v-model="page" :total="filtered.length" :page-size="pageSize" noun="clientes" />
        </section>
      </template>
    </div>

    <ClientFormModal v-if="creating || editing" :client="editing" @close="creating = false; editing = null" @saved="onSaved" />
  </div>
</template>

<style scoped>
.topbar-search { width: min(240px, 100%); }
.list-header { padding-bottom: 0; }

@media (max-width: 640px) {
  .topbar-search { display: none; }
}
</style>
