# Arquitetura público + administrativo (outubro de 2026)

## Objetivo

Preservar a aplicação Next.js 15 existente, seu serviço Render atual, os dados PostgreSQL e o painel `/admin`. A experiência de convidados é uma aplicação estática em `public-site/`, sem consultar banco ou API durante a entrega do HTML inicial.

## Componentes

| Componente | Hospedagem | Função |
| --- | --- | --- |
| `public-site/` -> `dist-public/` | Novo Render Static Site (CDN) | Convite, data, local, RSVP, lista/reserva de presentes, recados, álbum, link de reserva, privacidade |
| App Next.js existente | Web Service `cha-panela-pedro-larissa` | API pública dinâmica, banco e painel administrativo privado |
| PostgreSQL existente | Render PostgreSQL `cha-panela-pedro-larissa-db`, Virginia, confirmado pelos logs de produção em 14/10/2026 | Fonte única de verdade para os dados |

Nenhuma migration nova. Não reconfigurar `DATABASE_URL` nem executar reset/seed em produção. A referência a Neon no pedido não corresponde à conexão efetiva observada. O usuário confirmou preservar o banco atual. O Render informa expiração do banco gratuito em **18/10/2026 às 15h12 (Brasília)**. Antes dessa data, planejar cópia integral verificada e migração autorizada para Neon ou outra solução; não alterar planos nem trocar conexão automaticamente.

O `render.yaml` histórico declara banco e região Oregon, enquanto os recursos reais estão em Virginia. **Não sincronizar esse arquivo em produção.** Ele permanece versionado para evitar exclusão involuntária de recursos já gerenciados. `render-public.yaml`, validado contra o JSON Schema oficial do Render, descreve somente o Static Site existente, sem criar, remover ou gerenciar banco/backend. A validação do arquivo não equivale a sincronização no Dashboard.

## Deploy estático

O **Static Site já existe** e está conectado ao mesmo repositório, branch `main`: https://cha-panela-larissa-pedro-publico.onrender.com. Reutilizar o serviço `srv-db7obio473hc73e38e10`; não criar outro.

- Build command: `node scripts/build-public.mjs`
- Publish directory: `dist-public`
- Root directory: raiz do repositório
- `PUBLIC_API_BASE` opcional no build: `https://cha-panela-pedro-larissa.onrender.com` (padrão já no script)
- Não há credenciais do banco no Static Site.
- As rotas públicas têm arquivos HTML concretos gerados (`/presentes.html`, `/rsvp.html`, `/recados.html`, `/fotos.html`, `/privacidade.html`, `/minha-reserva.html?token=...`) para não depender de rewrites indisponíveis no conector do Render.

No Web Service existente, `PUBLIC_SITE_ORIGIN` deve corresponder exatamente a `https://cha-panela-larissa-pedro-publico.onrender.com` (sem path). Conferir pelo preflight HTTP; só atualizar se necessário, preservando todas as demais variáveis. Isso libera CORS apenas para as rotas públicas declaradas em `middleware.ts`. Nunca usar origem `*`; `/api/admin/` permanece fora desse CORS. Cookies administrativos permanecem vinculados ao backend.

Após a implantação, enviar aos convidados a **nova URL estática**. A URL antiga do Web Service continua válida, incluindo `/admin/login`, mas não oferece o carregamento inicial independente do servidor.

## Fluxo e disponibilidade

1. CDN entrega imediatamente `index.html`, `styles.css`, `app.js` e a foto do casal.
2. O navegador solicita `GET /api/public/bootstrap` com apenas informações públicas, dados resumidos de presentes e recados. A lista é exibida quando chegar a resposta; se o servidor estiver suspenso, são apresentados explicação e botão de nova tentativa.
3. Confirmações de presença, recados, fotos e reservas chamam a API original, sem credenciais administrativas, com estados de espera, erros e confirmação de sucesso.
4. O POST de reserva é transacional e confere disponibilidade no PostgreSQL. Uma lista vista anteriormente nunca autoriza a reserva por si só.
5. O RSVP usa lock transacional por identificação normalizada (telefone, ou nome quando o contato estiver vazio), prevenindo dois registros simultâneos para a mesma identidade. Acompanhantes somente são aceitos quando a configuração já existente `rsvpAllowCompanions` permitir. O painel passa a exibir esses dados.
6. Mídias de presentes já verificadas e incluídas em `public/gift-photos` são distribuídas pela CDN. Fotografias de convidados continuam no banco/serviço de imagens já configurado.

**Limitação inevitável:** com a API suspensa, o convite estático e os dados conhecidos de local/data aparecem, mas a lista atualizada, envio de RSVP, reservas, recados e fotografias dependem de o Web Service e o Neon responderem. O carregamento inicial não depende deles.

## Como verificar sem acessar produção

```bash
npm install --no-audit --no-fund
PUBLIC_API_BASE=http://localhost:3000 npm run build:public
node scripts/serve-public.mjs
```

Abra `http://localhost:4173` sem iniciar o backend: o convite deve abrir normalmente. Para testar com API local, inicie o Next.js em outro terminal com o banco **de desenvolvimento** e configure `PUBLIC_SITE_ORIGIN=http://localhost:4173` no ambiente do Next.js.

A rotina de GitHub Actions `verify.yml` executa teste/bundle estático, smoke mobile com API simulada offline, teste de concorrência com PostgreSQL efêmero (não Neon), testes do app Next.js e auditoria de telas existentes. O teste de UI de reserva usa token fictício e não grava no banco. Nunca executar testes que criem dados falsos no banco de produção.

## Rollback seguro

Se necessário, deixe de divulgar o novo Static Site e retorne à URL anterior do Web Service. Não remova tabelas, recursos nem variáveis existentes. Como o backend permanece no mesmo repositório/serviço, uma eventual regressão deve ser corrigida com novo commit ou revert de código, sempre preservando banco e credenciais.

## Inicialização e consistência

`npm run start:prod` agora inicia somente o Next.js em `0.0.0.0:$PORT`, sem migrações, seed, buscas de imagens e auditorias a cada retomada. O banco já possui as migrations existentes. Para uma futura migration nova, revisar seu SQL, fazer backup e executar uma vez no processo de deploy antes de publicar o código correspondente. `npm run db:prepare` preserva a antiga sequência migration + seed como manutenção explícita; não é executado neste ajuste.

O cliente Prisma mantém o host/usuário/senha da conexão existente e respeita opções explícitas. Se ausentes, acrescenta `connection_limit=5`, `connect_timeout=15`, `pool_timeout=15` e `socket_timeout=20`. Transações críticas têm `maxWait=10000` e `timeout=15000` ms. Isso limita filas/esperas, mas não elimina reativação do provedor.

Reservas bloqueiam a linha do presente na transação, evitando comparação de estoque antigo e disputa indevida pela mesma cota. O site estático envia um token aleatório de 256 bits por tentativa: repetir a mesma tentativa recupera a mesma reserva após perda de resposta, sem nova baixa de estoque. Só o hash é persistido. Cancelamento público e administrativo compartilham bloqueio da reserva e liberação única de estoque; reservas canceladas não podem ser marcadas como entregues. Clientes legados sem `requestToken` seguem funcionando.

RSVP continua sem conta. Identidade é telefone normalizado ou nome normalizado quando não há telefone; nomes homônimos sem contato permanecem uma limitação desse modelo. O lock evita inserções simultâneas para a mesma identidade, sem apagar registros antigos ou criar constraints potencialmente incompatíveis. Campos de acompanhantes só aparecem conforme a configuração e o backend também valida essa regra.

## Limites da verificação

Testes de escrita devem usar PostgreSQL local/efêmero, nunca produção. O conector de SQL não alcançou o banco real porque a lista de IPs externos está vazia. Essa proteção foi mantida. A validação de saúde/conexão, CORS, catálogo público e bloqueio administrativo usa apenas HTTP read-only. Isso não prova contagem/checksum de todas as tabelas privadas nem substitui validação de backup. Nenhum segredo foi solicitado ou incluído no frontend.
