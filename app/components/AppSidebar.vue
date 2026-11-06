<script setup lang="ts">
import { Calendar, LayoutDashboard, LogOut, Scissors, Users, UsersRound } from 'lucide-vue-next'

const { user, isAdmin, displayName, logout } = useAuth()
const { open } = useSidebar()
const route = useRoute()

const items = computed(() => [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  ...(isAdmin.value ? [{ to: '/servicos', label: 'Serviços', icon: Scissors }] : []),
  { to: '/clientes', label: 'Clientes', icon: UsersRound },
  ...(isAdmin.value ? [{ to: '/equipe', label: 'Equipe', icon: Users }] : [])
])

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  // O fluxo de agendamento pertence à seção Agenda, como no design.
  return route.path.startsWith(path) || (path === '/agenda' && route.path.startsWith('/agendamentos'))
}

watch(() => route.fullPath, () => {
  open.value = false
})

async function signOut() {
  logout()
  await navigateTo('/login')
}
</script>

<template>
  <div v-if="open" class="scrim" @click="open = false" />
  <aside class="sidebar" :class="{ open }">
    <NuxtLink to="/" class="brand">
      <AppLogo />
      <span>
        <strong>Praxis Diary</strong>
        <small>{{ isAdmin ? 'Administrador' : 'Usuário' }}</small>
      </span>
    </NuxtLink>

    <nav aria-label="Principal">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
        :aria-current="isActive(item.to) ? 'page' : undefined"
      >
        <component :is="item.icon" :size="18" aria-hidden="true" />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="account">
      <UserAvatar :name="displayName" :size="32" />
      <span class="account-text">
        <strong>{{ displayName }}</strong>
        <small v-if="displayName !== user?.email">{{ user?.email }}</small>
      </span>
      <button class="icon-btn" type="button" title="Sair" aria-label="Sair" @click="signOut">
        <LogOut :size="17" aria-hidden="true" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  padding: 16px 12px;
  border-right: 1px solid var(--color-border);
  background: #f4f6f9;
}

.brand { display: flex; align-items: center; gap: 10px; padding: 0 6px 20px; }
.brand span { display: flex; flex-direction: column; min-width: 0; }
.brand strong { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
.brand small { color: var(--color-text-muted); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; }

nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-weight: 500;
}

.nav-item:hover { background: #e9edf3; color: var(--color-text); }
.nav-item.active { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }

.nav-item.active::before {
  content: '';
  position: absolute;
  inset: 4px auto 4px -6px;
  width: 3px;
  border-radius: 2px;
  background: var(--color-primary);
}

.account {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 4px 0;
  border-top: 1px solid var(--color-border);
}

.account-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.account-text strong, .account-text small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.account-text strong { font-size: 13px; font-weight: 600; }
.account-text small { color: var(--color-text-muted); font-size: 11px; }

.scrim { position: fixed; inset: 0; z-index: 30; background: rgb(15 23 42 / 40%); }

@media (max-width: 900px) {
  .sidebar { transform: translateX(-100%); transition: transform 0.2s; }
  .sidebar.open { transform: none; box-shadow: var(--shadow-float); }
}
</style>
