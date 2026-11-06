<template>
  <main class="auth">
    <div class="auth-column">
      <AppLogo :size="46" />
      <slot />
    </div>
  </main>
</template>

<style scoped>
.auth {
  display: flex;
  justify-content: center;
  min-height: 100dvh;
  padding: 40px 16px;
}

.auth-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(380px, 100%);
  margin: auto 0;
}
</style>
