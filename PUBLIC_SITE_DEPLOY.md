# Arquitetura público + administrativo (outubro de 2026)

## Objetivo

Preservar a aplicação Next.js 15 existente, seu serviço Render atual, os dados PostgreSQL e o painel `/admin`. A experiência de convidados é uma aplicação estática em `public-site/`, sem consultar banco ou API durante a entrega do HTML inicial.

## Componentes

| Componente | Hospedagem | Função |
| --- | --- | --- |
| `public-site/` -> `dist-public/` | Novo Render Static Site (CDN) | Convite, data, local, RSVP, lista/reserva de presentes, recados, álbum, link de reserva, privacidade |
| App Next.js existente | Web Service `cha-panela-pedro-larissa` | API pública dinâmica, banco e painel administrativo privado |
| PostgreSQL existente | Neon, conforme configuração efetiva de `DATABASE_URL` no Web Service | Fonte única de verdade para os dados |

Nenhuma migration nova. Não reconfigurar o `DATABASE_URL` nem executar scripts de reset/seed em banco novo. O arquivo `render.yaml` **ainda contém uma configuração histórica de banco Render** divergente da arquitetura Neon declarada. Ele foi preservado para não causar substituição/apagamento de recursos com uma sincronização involuntária de Blueprint. Conferir separadamente antes de sincronizar qualquer Blueprint.

## Deploy estático

No Render, crie um **Static Site** gratuito conectado ao **mesmo repositório**, branch `main`.

- Build command: `node scripts/build-public.mjs`
- Publish directory: `dist-public`
- Root directory: raiz do repositório
- `PUBLIC_API_BASE` opcional no build: `https://cha-panela-pedro-larissa.onrender.com` (padrão já no script)
- Não há credenciais do banco no Static Site.
- Os deep links funcionam pela regra em `public-site/_redirects`.

**Depois de descobrir a URL exata do Static Site**, configure *somente* no Web Service já existente uma variável adicional `PUBLIC_SITE_ORIGIN=https://<subdominio-do-site>.onrender.com` (sem path), preservando todas as outras variáveis. Isso libera CORS **apenas** para as rotas públicas explicitamente declaradas em `middleware.ts`. Não configure origem `*`; as rotas `/api/admin/` continuam fora desse CORS. Os cookies de login permanecem vinculados ao serviço administrativo.

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
