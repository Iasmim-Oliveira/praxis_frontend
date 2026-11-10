<script setup lang="ts">
import { Clock, LayoutGrid, List, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import type { AppointmentWithRelations, Service } from '~/types/api'
import type { ActionMenuItem } from '~/components/ActionMenu.vue'

definePageMeta({ role: 'ADMIN' })
useHead({ title: 'Serviços · Praxis Diary' })

const toast = useToast()
const { confirm } = useConfirm()

const { data, error, pending, refresh } = useResource(async () => {
  const [services, appointments] = await Promise.all([
    api<Service[]>('/services'),
    api<AppointmentWithRelations[]>('/appointments')
  ])
  return { services, appointments }
})

const search = ref('')
const layout = ref<'grid' | 'list'>('grid')
const editing = shallowRef<Service | null>(null)
const creating = ref(false)

const usage = computed(() => {
  const counts = new Map<string, number>()
  for (const item of data.value?.appointments ?? []) {
    if (item.status === 'SCHEDULED') counts.set(item.serviceId, (counts.get(item.serviceId) ?? 0) + 1)
  }
  return counts
})

const filtered = computed(() =>
  (data.value?.services ?? []).filter(service => matches(search.value, service.name, service.description))
)

const { page, pageItems, pageSize } = usePagination(filtered)
watch(search, () => {
  page.value = 1
})

function onSaved(service: Service) {
  toast.success(editing.value ? 'Serviço atualizado.' : 'Serviço criado.')
  editing.value = null
  creating.value = false
  if (data.value) {
    const services = data.value.services.filter(item => item.id !== service.id)
    data.value = { ...data.value, services: [...services, service].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) }
  }
}

async function remove(service: Service) {
  const accepted = await confirm({
    title: 'Excluir serviço',
    message: `Excluir ${service.name}? Serviços com agendamentos, inclusive cancelados, não podem ser excluídos.`,
    confirmLabel: 'Excluir',
    danger: true
  })
  if (!accepted) return
  try {
    await api(`/services/${service.id}`, { method: 'DELETE' })
    toast.success('Serviço excluído.')
    refresh()
  } catch (cause) {
    toast.apiError(cause)
  }
}

function menuItems(service: Service): ActionMenuItem[] {
  return [
    { label: 'Editar', icon: Pencil, onSelect: () => (editing.value = service) },
    { label: 'Excluir', icon: Trash2, danger: true, onSelect: () => remove(service) }
  ]
}

function exportCsv() {
  downloadCsv(`servicos-${toDateParam(new Date())}.csv`, [
    ['Serviço', 'Descrição', 'Duração (min)', 'Agendamentos ativos'],
    ...filtered.value.map(service => [service.name, service.description, service.durationMinutes, usage.value.get(service.id) ?? 0])
  ])
}
</script>

<template>
  <div>
    <AppTopbar title="Serviços">
      <button class="btn btn-primary" type="button" @click="creating = true">
        <Plus :size="17" aria-hidden="true" /> Novo serviço
      </button>
    </AppTopbar>

    <div class="page">
      <StateBlock v-if="!data" :loading="pending" :error="error" @retry="refresh" />
      <template v-else>
        <div class="toolbar">
          <SearchInput v-model="search" class="toolbar-search" label="Buscar serviços…" />
          <div class="toolbar-end">
            <span class="field-hint">{{ plural(filtered.length, 'serviço', 'serviços') }}</span>
            <div class="segmented" role="group" aria-label="Visualização">
              <button class="icon-btn" type="button" aria-label="Cartões" :aria-pressed="layout === 'grid'" @click="layout = 'grid'">
                <LayoutGrid :size="16" aria-hidden="true" />
              </button>
              <button class="icon-btn" type="button" aria-label="Lista" :aria-pressed="layout === 'list'" @click="layout = 'list'">
                <List :size="16" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="layout === 'grid'" class="service-grid">
          <article v-for="service in filtered" :key="service.id" class="card service-card">
            <div class="service-top">
              <span class="icon-tile" :class="`tone-${serviceStyle(service.id).tone}`">
                <component :is="serviceStyle(service.id).icon" :size="18" aria-hidden="true" />
              </span>
              <ActionMenu :items="menuItems(service)" :label="`Ações para ${service.name}`" />
            </div>
            <h2 class="service-name">{{ service.name }}</h2>
            <p class="service-description">{{ service.description || 'Sem descrição.' }}</p>
            <div class="service-meta">
              <div>
                <small>Agendamentos</small>
                <strong>{{ usage.get(service.id) ?? 0 }}</strong>
              </div>
              <div class="align-end">
                <small>Duração</small>
                <strong><Clock :size="14" aria-hidden="true" /> {{ formatDuration(service.durationMinutes) }}</strong>
              </div>
            </div>
          </article>
          <button class="create-card" type="button" @click="creating = true">
            <span class="create-icon"><Plus :size="20" aria-hidden="true" /></span>
            <strong>Criar novo serviço</strong>
            <small>Amplie o que o negócio oferece</small>
          </button>
        </div>

        <section class="card" aria-labelledby="summary-title">
          <div class="card-header">
            <h2 id="summary-title" class="section-title">Lista resumida</h2>
            <button class="btn-link" type="button" :disabled="!filtered.length" @click="exportCsv">Exportar CSV</button>
          </div>
          <div v-if="pageItems.length" class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Serviço</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Duração</th>
                  <th scope="col" class="align-right">Agendamentos</th>
                  <th scope="col" class="align-right"><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in pageItems" :key="service.id">
                  <td>
                    <div class="person">
                      <span class="icon-tile small" :class="`tone-${serviceStyle(service.id).tone}`">
                        <component :is="serviceStyle(service.id).icon" :size="15" aria-hidden="true" />
                      </span>
                      <span class="cell-title">{{ service.name }}</span>
                    </div>
                  </td>
                  <td class="description-cell">{{ service.description || '—' }}</td>
                  <td>{{ formatDuration(service.durationMinutes) }}</td>
                  <td class="align-right cell-title">{{ usage.get(service.id) ?? 0 }}</td>
                  <td class="align-right">
                    <ActionMenu :items="menuItems(service)" :label="`Ações para ${service.name}`" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <StateBlock
            v-else
            :title="data.services.length ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'"
            :message="data.services.length ? 'Tente outro termo de busca.' : 'Crie o primeiro serviço para liberar os agendamentos.'"
          />
          <PaginationBar v-if="filtered.length" v-model="page" :total="filtered.length" :page-size="pageSize" noun="serviços" />
        </section>
      </template>
    </div>

    <button class="fab" type="button" aria-label="Novo serviço" title="Novo serviço" @click="creating = true">
      <Plus :size="22" aria-hidden="true" />
    </button>

    <ServiceFormModal v-if="creating || editing" :service="editing" @close="creating = false; editing = null" @saved="onSaved" />
  </div>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.toolbar-search { width: min(320px, 100%); }
.toolbar-end { display: flex; align-items: center; gap: 12px; }
.segmented { display: flex; gap: 2px; padding: 2px; border-radius: var(--radius-md); background: var(--color-surface-muted); }
.segmented .icon-btn { width: 30px; height: 30px; }
.segmented .icon-btn[aria-pressed='true'] { background: var(--color-surface); color: var(--color-primary); box-shadow: var(--shadow-card); }

.service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }

.service-card { display: flex; flex-direction: column; padding: 18px; }
.service-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.service-name { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }

.service-description {
  display: -webkit-box;
  flex: 1;
  margin-top: 4px;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 13px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.service-meta { display: flex; justify-content: space-between; margin-top: 18px; padding-top: 12px; border-top: 1px solid var(--color-border); }
.service-meta small { display: block; color: var(--color-text-muted); font-size: 11px; }
.service-meta strong { display: inline-flex; align-items: center; gap: 4px; font-size: 16px; font-weight: 600; }
.align-end { text-align: right; }

.create-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 200px;
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: none;
  color: var(--color-text-muted);
}

.create-card:hover { border-color: var(--color-primary); color: var(--color-primary); }
.create-card strong { color: var(--color-text); font-weight: 600; }
.create-card small { font-size: 12px; }
.create-icon { display: inline-flex; padding: 6px; border: 1.5px solid currentcolor; border-radius: 50%; margin-bottom: 6px; }

.icon-tile.small { width: 30px; height: 30px; }
.description-cell { max-width: 340px; color: var(--color-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
