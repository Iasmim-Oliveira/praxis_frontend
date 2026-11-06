<template>
  <div class="shell">
    <AppSidebar />
    <div class="shell-content"><slot /></div>
  </div>
</template>

<style scoped>
.shell-content { min-height: 100dvh; margin-left: var(--sidebar-width); }

@media (max-width: 900px) {
  .shell-content { margin-left: 0; }
}
</style>
