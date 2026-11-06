<script setup lang="ts">
import { ShieldCheck, ShieldOff, Trash2, UserRound } from 'lucide-vue-next'
import type { Role, User } from '~/types/api'
import type { ActionMenuItem } from '~/components/ActionMenu.vue'

definePageMeta({ role: 'ADMIN' })
useHead({ title: 'Equipe · Praxis Diary' })

const toast = useToast()
const { confirm } = useConfirm()
const { user: currentUser, refreshSession, loadUserName } = useAuth()
const now = useNow()

const { data, error, pending, refresh } = useResource(() => api<User[]>('/users'))

const search = ref('')
const roleFilter = ref<Role | ''>('')

const roleLabels: Record<Role, string> = { ADMIN: 'Admin', USER: 'Usuário' }

const stats = computed(() => {
  const users = data.value ?? []
  const monthStart = startOfMonth(now.value)
  return {
    total: users.length,
    admins: users.filter(user => user.role === 'ADMIN').length,
    users: users.filter(user => user.role === 'USER').length,
    newThisMonth: users.filter(user => new Date(user.createdAt) >= monthStart).length
  }
})

const filtered = computed(() =>
  (data.value ?? [])
    .filter(user => !roleFilter.value || user.role === roleFilter.value)
    .filter(user => matches(search.value, user.name, user.email))
)

const { page, pageItems, pageSize } = usePagination(filtered)
watch([search, roleFilter], () => {
  page.value = 1
})

const isSelf = (user: User) => user.id === currentUser.value?.sub

async function changeRole(user: User, role: Role) {
  const self = isSelf(user)
  const accepted = await confirm({
    title: role === 'ADMIN' ? 'Tornar administrador' : 'Remover acesso de administrador',
    message: self
      ? 'Você vai deixar de ser administrador e perderá acesso a Serviços e Equipe.'
      : `${user.name} passará a ter o papel ${roleLabels[role]}. A mudança vale a partir da próxima renovação de sessão dessa pessoa (até 15 minutos) ou do próximo login.`,
    confirmLabel: 'Confirmar',
    danger: role === 'USER'
  })
  if (!accepted) return
  try {
    const updated = await api<User>(`/users/${user.id}/role`, { method: 'PATCH', body: { role } })
    data.value = data.value?.map(item => (item.id === updated.id ? updated : item))
    toast.success(`${updated.name} agora é ${roleLabels[role]}.`)
    if (self) {
      // O token guarda o papel antigo até ser renovado.
      await refreshSession()
      await loadUserName()
      await navigateTo('/')
    }
  } catch (cause) {
    toast.apiError(cause)
  }
}

async function remove(user: User) {
  const accepted = await confirm({
    title: 'Excluir usuário',
    message: `Excluir a conta de ${user.name}? Usuários que criaram agendamentos não podem ser excluídos.`,
    confirmLabel: 'Excluir',
    danger: true
  })
  if (!accepted) return
  try {
    await api(`/users/${user.id}`, { method: 'DELETE' })
    data.value = data.value?.filter(item => item.id !== user.id)
    toast.success('Usuário excluído.')
  } catch (cause) {
    toast.apiError(cause)
  }
}

function menuItems(user: User): ActionMenuItem[] {
  const promote = user.role === 'USER'
  return [
    {
      label: promote ? 'Tornar administrador' : 'Tornar usuário',
      icon: promote ? ShieldCheck : ShieldOff,
      onSelect: () => changeRole(user, promote ? 'ADMIN' : 'USER')
    },
    {
      label: 'Excluir',
      icon: Trash2,
      danger: true,
      disabled: isSelf(user),
      hint: isSelf(user) ? 'Você não pode excluir a própria conta' : undefined,
      onSelect: () => remove(user)
    }
  ]
}
</script>

<template>
  <div>
    <AppTopbar title="Equipe" />

    <div class="page">
      <StateBlock v-if="!data" :loading="pending" :error="error" @retry="refresh" />
      <template v-else>
        <div class="stat-grid">
          <StatCard
            label="Membros"
            :value="stats.total"
            :badge="stats.newThisMonth ? `+${stats.newThisMonth} no mês` : undefined"
            badge-tone="success"
          />
          <StatCard label="Administradores" :value="stats.admins" />
          <StatCard label="Usuários" :value="stats.users" />
        </div>

        <section class="card" aria-labelledby="members-title">
          <div class="card-header">
            <div>
              <h2 id="members-title" class="section-title">Membros da equipe</h2>
              <p class="section-subtitle">Gerencie o acesso e as permissões. Novos membros entram pela tela de cadastro.</p>
            </div>
            <div class="filters">
              <SearchInput v-model="search" label="Buscar membros…" compact />
              <label class="sr-only" for="role-filter">Filtrar por papel</label>
              <select id="role-filter" v-model="roleFilter" class="select compact">
                <option value="">Todos os papéis</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">Usuário</option>
              </select>
            </div>
          </div>

          <div v-if="pageItems.length" class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Membro</th>
                  <th scope="col">Papel</th>
                  <th scope="col">Membro desde</th>
                  <th scope="col" class="align-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in pageItems" :key="user.id">
                  <td>
                    <div class="person">
                      <UserAvatar :name="user.name" />
                      <div>
                        <p class="cell-title">{{ user.name }} <span v-if="isSelf(user)" class="badge">Você</span></p>
                        <p class="cell-subtitle">{{ user.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="badge" :class="user.role === 'ADMIN' ? 'primary' : ''">{{ roleLabels[user.role] }}</span>
                  </td>
                  <td>{{ formatDate(user.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
                  <td class="align-right">
                    <ActionMenu :items="menuItems(user)" :label="`Ações para ${user.name}`" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <StateBlock v-else title="Nenhum membro encontrado" message="Ajuste a busca ou o filtro." />
          <PaginationBar v-if="filtered.length" v-model="page" :total="filtered.length" :page-size="pageSize" noun="membros" />
        </section>

        <section aria-labelledby="roles-title">
          <h2 id="roles-title" class="section-title">Papéis</h2>
          <p class="section-subtitle">O que cada nível de acesso permite.</p>
          <div class="roles">
            <article class="card role-card">
              <span class="icon-tile tone-blue"><ShieldCheck :size="18" aria-hidden="true" /></span>
              <h3>Admin</h3>
              <p>Acesso completo: agenda, clientes, catálogo de serviços e gestão da equipe. O sistema sempre mantém pelo menos um administrador.</p>
            </article>
            <article class="card role-card">
              <span class="icon-tile tone-purple"><UserRound :size="18" aria-hidden="true" /></span>
              <h3>Usuário</h3>
              <p>Gerencia clientes e agendamentos do dia a dia. Não acessa o catálogo de serviços nem a gestão da equipe.</p>
            </article>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 8px; flex-wrap: wrap; }
.select.compact { width: auto; min-height: 34px; padding: 4px 10px; font-size: 13px; }

.roles { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-top: 16px; }
.role-card { display: flex; flex-direction: column; gap: 8px; padding: 20px; }
.role-card h3 { margin-top: 6px; font-size: 15px; font-weight: 600; }
.role-card p { color: var(--color-text-muted); font-size: 13px; }
</style>
