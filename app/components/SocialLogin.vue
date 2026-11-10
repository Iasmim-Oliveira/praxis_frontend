<template>
  <div class="divider"><span>ou continue com</span></div>
  <div class="social">
    <button class="btn btn-secondary" type="button" disabled title="Login social ainda não disponível">
      Google <span class="badge">em breve</span>
    </button>
    <button class="btn btn-secondary" type="button" disabled title="Login social ainda não disponível">
      Apple <span class="badge">em breve</span>
    </button>
  </div>
</template>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.divider::before, .divider::after { content: ''; flex: 1; border-top: 1px solid var(--color-border-strong); }

.social { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.social .btn { padding: 0 8px; }
</style>
