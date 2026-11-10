# Praxis Diary — Frontend

Interface web do Praxis Diary, um sistema de agendamento para profissionais que atendem clientes com hora marcada. Feita em Nuxt 4 (Vue 3 + TypeScript), consome a API REST do [praxis_diary_backend](../projects/praxis_diary_backend).

## Telas

| Rota | Tela | Acesso |
|---|---|---|
| `/login` | Login | Público |
| `/cadastro` | Criação de conta | Público |
| `/` | Dashboard: agendamentos do dia, próximos atendimentos e serviços oferecidos | Autenticado |
| `/agenda` | Agenda em visão de dia, semana ou mês (`?data=AAAA-MM-DD&visao=dia\|semana\|mes`) | Autenticado |
| `/agendamentos/novo` | Novo agendamento: cliente, serviço, data e horário livre | Autenticado |
| `/agendamentos/:id/editar` | Edição de agendamento | Autenticado |
| `/clientes` | Gestão de clientes, com exportação em CSV | Autenticado |
| `/servicos` | Gestão de serviços | Somente ADMIN |
| `/equipe` | Gestão de usuários e perfis | Somente ADMIN |

Qualquer usuário autenticado lista serviços (precisa deles para agendar); criar, editar e excluir serviços é exclusivo de ADMIN.

## Requisitos

- Node.js 22 ou superior
- A API do backend rodando (por padrão em `http://localhost:3000`)

## Como rodar

```bash
npm install
npm run dev
```

O front sobe em **http://localhost:4000**. A porta 3000 fica para a API e a 3001 para o Grafana do backend.

### Subindo o backend

O Docker (ou OrbStack) só sobe a infraestrutura: Postgres, Redis, Prometheus e Grafana. A API roda fora do container e precisa ser iniciada à parte:

```bash
cd ../projects/praxis_diary_backend
docker compose up -d
npm run start:dev
```

Se o login mostrar "Não foi possível conectar ao servidor", a API não está no ar. Para conferir, `curl localhost:3000` deve responder 401 em JSON.

### Variáveis de ambiente

Copie `.env.example` para `.env` se a API estiver em outro endereço:

| Variável | Padrão | Descrição |
|---|---|---|
| `NUXT_PUBLIC_API_BASE` | `http://localhost:3000` | URL base da API |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento na porta 4000 |
| `npm run build` | Build de produção |
| `npm run generate` | Gera os arquivos estáticos (a aplicação é SPA) |
| `npm run preview` | Serve o build localmente |
| `npx nuxi typecheck` | Checagem de tipos com vue-tsc |

## Estrutura

```
app/
├── assets/css/main.css   tokens de design (cores, raios, sombras) e estilos globais
├── components/           componentes de UI e de domínio (calendários, formulários, modais)
├── composables/          estado e lógica reutilizável (useAuth, useApi, useResource, useToast…)
├── layouts/              default (sidebar + conteúdo) e auth (telas de login/cadastro)
├── middleware/           guard global de autenticação e de perfil
├── pages/                uma página por rota (roteamento por arquivo do Nuxt)
├── plugins/              restaura a sessão antes da primeira navegação
├── types/                tipos do contrato da API
└── utils/                HTTP, datas, texto/CSV e estilo dos serviços
```

## Decisões técnicas

- **SPA (`ssr: false`).** Os tokens só existem no navegador e a API não usa cookies, então não há o que renderizar no servidor.
- **Sessão.** O access token (JWT) fica só em memória; o refresh token fica no `localStorage` (`praxis.refreshToken`). O perfil (USER/ADMIN) é lido do próprio JWT.
- **Renovação automática.** Quando uma requisição recebe 401, o front renova a sessão uma única vez (requisições simultâneas compartilham a mesma renovação) e repete a chamada. Se o refresh falhar, a sessão é encerrada e o usuário volta ao login com `?redirect=` para a página onde estava.
- **Rastreio de erros.** Cada requisição envia um `X-Request-Id` gerado no front, que aparece nas mensagens de erro e permite achar a chamada nos logs do backend.
- **Mensagens em pt-BR.** Falhas de rede, 429 e 5xx viram mensagens amigáveis; erros de validação (400) da API são exibidos como vieram.
- **Regras de negócio espelhadas da API.** Horário de atendimento das 08h às 18h e cancelamento com no mínimo 60 minutos de antecedência (`app/utils/date.ts`). A API continua sendo a fonte da verdade; o front só evita ações que seriam recusadas.
- **Sem biblioteca de UI.** CSS próprio com tokens em `main.css`, ícones do `lucide-vue-next` e fonte Inter via `@fontsource-variable/inter`.

## Contrato da API

O contrato completo (endpoints, payloads, códigos de erro e limitações conhecidas) está em [project-context.md](project-context.md).
