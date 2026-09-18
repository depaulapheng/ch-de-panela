# Chá de Panela — Larissa & Pedro

Sistema web completo para o Chá de Panela de **Larissa & Pedro**, em **21/11/2026**, com lista real de presentes físicos, reservas sem cadastro, RSVP, mural de recados e painel administrativo.

## Stack

- Next.js + React + TypeScript
- Prisma ORM
- PostgreSQL
- Autenticação administrativa própria com senha bcrypt e cookie HTTP-only assinado
- Render para Web Service + PostgreSQL

## Funcionalidades

### Público
- Home responsiva com contagem regressiva do chá e do casamento.
- Informações de horário/local editáveis; nenhum dado ainda não informado é inventado.
- Lista real de presentes de Larissa & Pedro, com filtro único por setor.
- Cores preferidas em cada card quando configuradas.
- Valores opcionais: presentes sem valor cadastrado não exibem preço.
- Reserva sem conta com transação atômica no PostgreSQL, evitando overbooking.
- Token pessoal `/minha-reserva/TOKEN` para consultar, editar mensagem ou cancelar.
- RSVP sem login, com confirmação simples de presença.
- Mural de recados com publicação imediata.
- Página de privacidade e compartilhamento via Web Share API/cópia de link.

### Admin `/admin`
- Dashboard com indicadores.
- CRUD/arquivamento/duplicação de presentes.
- Edição de nome, categoria, descrição, imagem URL, quantidade, valor, prioridade, marca, modelo, link, observação, cores, status e destaque.
- Cadastro/ativação de categorias e cores.
- Reservas com dados privados, cancelamento manual e marcação como entregue.
- RSVP com indicadores e exportação CSV.
- Visualização dos recados enviados.
- Configuração de evento, textos, local, Google Maps, fotos por URL, PIX opcional e SEO.
- Auditoria das principais alterações administrativas.

## Segurança

- Senha administrativa armazenada apenas como bcrypt no banco.
- Cookie de sessão HTTP-only, `SameSite=Lax` e `Secure` em produção.
- Verificação de origem em mutações administrativas.
- Validação com Zod, limites de tamanho e normalização de entrada.
- ORM/prepared queries; atualização SQL atômica parametrizada para reserva.
- Token de reserva aleatório de 256 bits; somente o hash SHA-256 é persistido.
- Rate limiting básico por IP em endpoints públicos críticos.
- Secrets nunca devem ser versionados; `.env` está no `.gitignore`.

> O limitador em memória atende ao MVP de uma instância. Para escalar horizontalmente, migrar os contadores para Render Key Value/Redis.

## Desenvolvimento local

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Acesse `http://localhost:3000` e `http://localhost:3000/admin`.

## Variáveis de ambiente

- `DATABASE_URL`: conexão PostgreSQL.
- `APP_URL`: URL pública da aplicação.
- `SESSION_SECRET`: segredo aleatório com pelo menos 32 caracteres.
- `ADMIN_EMAIL`: e-mail do administrador inicial.
- `ADMIN_PASSWORD`: senha inicial forte (mínimo recomendado: 12 caracteres).\n- `GOOGLE_CSE_API_KEY`: chave da Google Custom Search JSON API para imagens.\n- `GOOGLE_CSE_CX`: identificador do mecanismo de pesquisa programável do Google.

O seed faz `upsert` do administrador e mantém a lista inicial existente sem duplicar itens.

## Banco, migrations e seed

Schema: `prisma/schema.prisma`.
Migrations: `prisma/migrations/`.
Seed: `prisma/seed.ts`.

O seed inicial contém **somente a lista real enviada por Larissa & Pedro**, sem marcas nem valores inventados. As cores iniciais são Preto, Cinza, Branco, Bege, Bambu e Sem preferência.

## Testes

```bash
npm test
```

Os testes unitários rodam sem banco. O teste de concorrência é ativado quando `TEST_DATABASE_URL` existe e valida que dois processos tentando reservar a última unidade resultam em apenas um vencedor.

## Deploy no Render

O repositório inclui `render.yaml`. A arquitetura de produção é:

`GitHub -> Render Web Service -> Render PostgreSQL`

Comandos do serviço:
- Build: `npm install --no-audit --no-fund && npm run build`
- Start: `npm run start:prod`
- Health check: `/api/health`

`start:prod` executa `prisma migrate deploy`, o seed idempotente e inicia o Next.js.

Nunca grave uploads no filesystem do Render; no MVP as imagens são URLs. Para upload real, usar S3, Cloudinary ou serviço equivalente.

## Atualização de produção

1. Alterar o código.
2. Executar testes.
3. Fazer commit/push para `main`.
4. O Render faz auto-deploy.
5. Se houver migration nova, `prisma migrate deploy` roda antes do servidor iniciar.
6. Verificar `/api/health` e logs.

## Backup PostgreSQL

Use os recursos de backup/exportação do plano Render PostgreSQL contratado. Para cópia manual com URL externa segura:

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

Não armazene dumps com dados pessoais em repositórios públicos.

## Observações de arquitetura

- Presentes com cotas já possuem campos e tabela de suporte no modelo, preparados para evolução. O fluxo de pagamento não é falso: não há processamento de cartão.
- PIX permanece desligado por padrão.
- Horário, local e endereço começam vazios e devem ser preenchidos no admin.
- O casamento aparece como contexto secundário; o foco é o Chá de Panela.
