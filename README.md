# AleLib — Loja Online de E-books

Implementação inicial do projeto, cobrindo: estrutura base (Docker + Next.js
+ PostgreSQL + Prisma), autenticação com perfis USER/ADMIN, catálogo,
compra simplificada (sem gateway ainda — fase 6), painel administrativo,
*logs de auditoria* e *recomendações via API da OpenAI*.

## Pré-requisitos

- Docker e Docker Compose instalados
- Uma chave de API da OpenAI (https://platform.openai.com/api-keys)

## Como rodar

1. Copie o arquivo de variáveis de ambiente e preencha os valores:

   bash
   cp .env.example .env
   

   - AUTH_SECRET: gere com openssl rand -base64 32
   - OPENAI_API_KEY: sua chave da OpenAI

2. Suba todo o ambiente com um único comando:

   bash
   docker compose up --build
   

   Isso cria o container do PostgreSQL e o container da aplicação Next.js.
   No primeiro start, o schema do banco é sincronizado automaticamente
   (prisma db push) — não é necessário rodar migrations manualmente.

3. Popule o banco com dados de exemplo (livros, autores, categorias e um
   usuário de demonstração com histórico de compras — necessário para as
   recomendações terem o que analisar):

   bash
   docker compose exec app npx tsx prisma/seed.ts
   

4. Acesse http://localhost:3000

   *Credenciais de teste:*
   - Admin: admin@dscebooks.com / admin123
   - Usuário demo: demo@dscebooks.com / user123

## O que está implementado nesta entrega

### Estrutura base
Next.js (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind, tudo
orquestrado via Docker Compose, conforme a arquitetura definida no escopo.

### Autenticação (Auth.js)
Cadastro, login, logout, perfis USER/ADMIN e proteção de rotas via
middleware (/admin, /library, /recommendations).

### Catálogo
Listagem e busca de livros por título/autor, página de detalhe, compra
simplificada (gera pedido + libera o livro na biblioteca digital do
usuário — o gateway de pagamento real é a Fase 6 do roadmap).

### Painel administrativo
Dashboard com estatísticas, CRUD de livros (autores/categorias via API,
prontos para ganhar telas próprias depois) e visualização dos logs de
auditoria com filtro por tipo de ação.

### Logs de auditoria
Toda ação sensível grava um registro em AuditLog (quem, o quê, quando, de
onde). Eventos cobertos nesta entrega:

| Categoria | Eventos |
|---|---|
| Autenticação | LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, USER_REGISTER |
| Catálogo (admin) | BOOK_CREATE, BOOK_UPDATE, BOOK_DELETE, AUTHOR_CREATE, CATEGORY_CREATE |
| Negócio | ORDER_CREATE, RECOMMENDATION_REQUEST |

Cada registro guarda userId, action, entity/entityId, metadata
(JSON livre com detalhes), ipAddress e createdAt. A lógica está
centralizada em src/lib/audit.ts (função logAudit), usada em todas as
rotas de API relevantes — assim, novas ações futuras (ex: integração de
pagamento na Fase 6) só precisam chamar essa mesma função.

O painel em /admin/audit-logs permite filtrar por tipo de ação.

### Recomendações com IA (OpenAI)
src/lib/openai.ts monta um prompt com o histórico de compras, categorias
favoritas e interesses do usuário, envia para a API da OpenAI (modelo
gpt-4o-mini, resposta em JSON) e pede recomendações **apenas dentre os
livros que existem de fato no catálogo** (evita a IA "inventar" livros).
As recomendações são salvas em Recommendation e cada chamada gera um
log de auditoria (RECOMMENDATION_REQUEST).

Para testar: faça login como usuário demo (já tem histórico de compra) e
acesse "Recomendações" no menu.

## Estrutura de pastas


prisma/schema.prisma     modelo de dados completo (todas as entidades do escopo)
prisma/seed.ts           dados de exemplo
src/auth.ts              configuração do Auth.js
src/middleware.ts        proteção de rotas por perfil
src/lib/audit.ts         serviço central de logs de auditoria
src/lib/openai.ts        integração com a OpenAI (recomendações)
src/app/                 páginas (App Router)
src/app/api/             rotas de API
src/components/          componentes de UI reutilizáveis

## Observação técnica

O schema do Prisma já modela *todas* as entidades do escopo (Carrinho,
Pagamento, etc. — mesmo as que ainda não têm fluxo completo), para evitar
retrabalho de modelagem nas próximas fases. Em produção, o ideal é migrar
de prisma db push para prisma migrate (histórico de migrations
versionado) antes da entrega final — deixei db push agora para garantir
que docker compose up funcione de primeira sem passos manuais extras.

## Cobertura de Testes

Relatório gerado com npx jest --coverage e copiado para cobertura/coverage/.

*Percentual total (linhas): 95.26%* (acima do mínimo de 85%).

- Statements: 95.26% (2074/2177)
- Branches:   90.03% (226/251)
- Functions:  93.84% (61/65)
- Lines:      95.26% (2074/2177)
- Test Suites: 29 passed | Tests: 99 passed

Relatório HTML: cobertura/coverage/index.html.
Relatório LCOV: cobertura/coverage/lcov-report/index.html.
Resumo JSON:    cobertura/coverage/coverage-summary.json.

Para regenerar:

bash
npx jest --coverage
cp -r coverage cobertura/


## Log de Auditoria

- *O que é auditado*: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT,
  USER_REGISTER, BOOK_CREATE, BOOK_UPDATE, BOOK_DELETE,
  AUTHOR_CREATE, CATEGORY_CREATE, ORDER_CREATE,
  RECOMMENDATION_REQUEST.
- *Onde fica armazenado*: tabela AuditLog no PostgreSQL (Prisma).
  Campos: id, userId, action, entity, entityId, metadata (JSON),
  ipAddress, createdAt.
- *Como foi implementado*: service dedicado logAudit chamado a partir de
  cada rota de API sensível (captura IP e serializa metadata).
- *Classes/arquivos*:
  - src/lib/audit.ts (service central)
  - prisma/schema.prisma (modelo AuditLog + enum AuditAction)
  - src/auth.ts (LOGIN_SUCCESS / LOGIN_FAILED)
  - src/app/api/logout/route.ts (LOGOUT)
  - src/app/api/register/route.ts (USER_REGISTER)
  - src/app/api/books/route.ts, src/app/api/books/[id]/route.ts
  - src/app/api/authors/route.ts, src/app/api/categories/route.ts
  - src/app/api/orders/route.ts, src/app/api/recommendations/route.ts
  - src/app/admin/audit-logs/page.tsx + src/app/api/admin/audit-logs/route.ts

## Integração com Serviço Externo

- *Serviço externo: **OpenAI API* (modelo gpt-4o-mini).
- *Para que é usado*: gerar recomendações personalizadas de e-books a
  partir do histórico de compras e categorias favoritas do usuário,
  restritas ao catálogo existente.
- *Classes/arquivos*:
  - src/lib/openai.ts — cliente + prompt + parsing JSON
  - src/app/api/recommendations/route.ts — rota que invoca o serviço,
    persiste em Recommendation e gera RECOMMENDATION_REQUEST no audit log
  - src/app/recommendations/page.tsx — UI
- *Configuração (env vars, sem segredos)*:
  - OPENAI_API_KEY — chave da API
 
  
 ## Entrega Referente ao Teste de Carga (K6)

 - **Rotas testadas e usuários virtuais:**
O teste executou o cenário healthcheck, que provavelmente testa a rota GET /ping. Foram usados até 10 usuários virtuais (VUs) simultâneos, em 3 estágios (ramp up, sustentação e ramp down) ao longo de 1 minuto e 50 segundos, totalizando 862 requisições a uma taxa de ~7.8 req/s.

- **p(95) e taxa de erro:**
p(95) de duração: 4.24ms — 95% das requisições responderam em menos de 4.24ms, bem abaixo do threshold definido de 500ms
Taxa de erro: 0.00% — nenhuma requisição falhou, todas retornaram status 200
Média de duração: 3.14ms
Máximo registrado: 103.22ms (pico pontual, provavelmente na primeira conexão TCP)

- **Gargalos identificados:**
O único pico relevante foi o max de 103.22ms, que ocorreu no estabelecimento inicial da conexão TCP (visível no http_req_connecting: max=0.53ms e http_req_blocked). É um comportamento esperado na primeira requisição — as subsequentes aproveitam a conexão já estabelecida e ficam abaixo de 4ms. Para uma aplicação em produção, o que seria feito para melhorar seria testar rotas mais pesadas (catálogo, detalhes de livro, recomendações) com maior carga de VUs, e implementar cache HTTP nas rotas de leitura para reduzir consultas ao banco sob alta concorrência.
