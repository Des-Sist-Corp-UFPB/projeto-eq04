# Relatório de Observabilidade com OpenTelemetry

**Disciplina:** Desenvolvimento de Sistemas Corporativos (DSC) — UFPB  
**Equipe:** eq04  
**Projeto:** DSC E-books (Alelib)  
**Stack:** Next.js· TypeScript · Prisma · PostgreSQL · Docker  

---

## 1. Backend no ar

O backend de observabilidade utilizado foi a imagem `grafana/otel-lgtm`, que integra em um único container o coletor OTLP, Loki (logs), Grafana (interface), Tempo (traces) e Mimir (métricas).

O serviço foi adicionado ao `docker-compose.yml` do projeto:

```yaml
otel-lgtm:
  image: grafana/otel-lgtm
  container_name: otel-lgtm
  ports:
    - "3001:3000"   # Grafana    // mudei a porta do grafana para 3001 porque minha aplicação executa na porta 3000
    - "4317:4317"   # OTLP via gRPC
    - "4318:4318"   # OTLP via HTTP
```

As variáveis de ambiente foram configuradas no serviço `app` para exportar a telemetria via OTLP HTTP:

```yaml
OTEL_SERVICE_NAME: eq04-alelib
OTEL_EXPORTER_OTLP_ENDPOINT: http://otel-lgtm:4318
OTEL_EXPORTER_OTLP_PROTOCOL: http/protobuf
OTEL_TRACES_EXPORTER: otlp
OTEL_METRICS_EXPORTER: otlp
OTEL_LOGS_EXPORTER: otlp
```

A instrumentação automática foi configurada via `instrumentation.ts` na raiz do projeto, utilizando o hook experimental do Next.js (`instrumentationHook: true` no `next.config.mjs`):

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'eq04-alelib',
      traceExporter: new OTLPTraceExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });
    sdk.start();
  }
}
```

> <img width="1365" height="573" alt="print 1 grafana" src="https://github.com/user-attachments/assets/4186ed59-8f62-4208-9671-c57f62281946" />
<img width="1365" height="638" alt="print 2 grafana" src="https://github.com/user-attachments/assets/025003cd-fc67-43b0-938f-6594d0beca93" />

## 2. Trace de uma operação real

A operação escolhida foi **gerar recomendações de livros com IA**, por ser a funcionalidade mais crítica e de maior impacto no sistema — ela envolve consultas ao banco, montagem de prompt, chamada a uma API externa (LiteLLM/Groq) e persistência dos resultados.

A cascata do trace revela claramente a jornada completa da requisição:

- Requisição HTTP `POST /api/recommendations`
- Consulta ao banco para buscar perfil e histórico do usuário
- Consulta ao catálogo de livros candidatos
- Chamada à API de IA (span mais longo)
- Persistência das recomendações geradas
- Registro no log de auditoria

A etapa que consome mais tempo é a **chamada à API de IA** (`chamada-api-openai`), que depende de latência de rede e tempo de processamento do modelo de linguagem.

> <img width="1063" height="576" alt="print 3 gerar-recomendacoes-ia" src="https://github.com/user-attachments/assets/4fe382e1-af1c-4646-b7e6-eb23a5f4586d" />

## 3. Query SQL visível

Dentro do trace da requisição `GET /` (listagem do catálogo), a auto-instrumentação do Prisma captura automaticamente as queries SQL executadas como spans filhos.

O span de query SQL identificado representa a busca de todos os livros com seus autores e categorias para montar o catálogo da página inicial — operação na tabela `Book` com joins em `Author` e `Category`.

> <img width="1365" height="637" alt="print 4 grafana query sql" src="https://github.com/user-attachments/assets/9124777c-ab03-458e-92a4-00d1ddf38fe9" />

## 4. Instrumentação manual

Foram adicionados spans manuais em duas regras de negócio críticas do sistema.

### 4.1 Span: `gerar-recomendacoes-ia`

Localização: `src/lib/openai.ts`

Cobre toda a regra de negócio de geração de recomendações — da consulta ao banco até a persistência dos resultados. A auto-instrumentação enxerga as queries SQL e a chamada HTTP isoladamente, mas não o fluxo de negócio como um todo. O span manual une essas peças e adiciona contexto de negócio.

Atributos customizados adicionados:

| Atributo | Valor exemplo | Finalidade |
|---|---|---|
| `usuario.id` | `cm123abc` | Rastrear qual usuário acionou a geração |
| `catalogo.candidatos` | `5` | Quantos livros foram enviados no prompt |
| `ia.recomendacoes_geradas` | `3` | Quantas recomendações a IA retornou |

Dentro desse span, um sub-span `chamada-api-openai` mede exclusivamente a latência da API externa:

```typescript
return tracer.startActiveSpan("gerar-recomendacoes-ia", async (span) => {
  span.setAttribute("usuario.id", userId);
  span.setAttribute("catalogo.candidatos", candidateBooks.length);
  // ...
  const completion = await tracer.startActiveSpan("chamada-api-openai", async (aiSpan) => {
    aiSpan.setAttribute("ia.modelo", "gpt-4o-mini");
    // ...
  });
  span.setAttribute("ia.recomendacoes_geradas", safeRecommendations.length);
});
```

> <img width="1363" height="605" alt="print 6 grafana span gerar recomendações ia" src="https://github.com/user-attachments/assets/8fa0f81b-55d2-45b7-b03c-7f6602b11e2c" />

### 4.2 Span: `finalizar-pedido`

Localização: `src/app/api/orders/route.ts`

Cobre o fluxo completo de compra — transação no banco (criação do pedido + liberação na biblioteca digital) e registro de auditoria. A auto-instrumentação captura as queries SQL individualmente, mas o span manual revela o valor e o contexto de negócio da operação como um todo.

Atributos customizados adicionados:

| Atributo | Valor exemplo | Finalidade |
|---|---|---|
| `pedido.usuario_id` | `cm123abc` | Rastrear qual usuário fez a compra |
| `pedido.quantidade_itens` | `1` | Quantos livros foram comprados |
| `pedido.valor` | `29.9` | Valor total da transação |
| `pedido.id` | `cm456def` | ID do pedido criado |

```typescript
const order = await tracer.startActiveSpan("finalizar-pedido", async (span) => {
  span.setAttribute("pedido.usuario_id", userId);
  span.setAttribute("pedido.quantidade_itens", books.length);
  span.setAttribute("pedido.valor", total);
  // ...
  span.setAttribute("pedido.id", created.id);
});
```

> <img width="1365" height="635" alt="print 5 grafana compra livro" src="https://github.com/user-attachments/assets/3047a9ba-f596-4c32-bc50-7adae9ab50fe" />

## 5. Diagnóstico de operação lenta

A operação mais lenta identificada pela telemetria é a **chamada à API de IA** (`chamada-api-openai`), dentro do fluxo de geração de recomendações.

Na cascata do trace, o span `chamada-api-openai` representa a maior fatia do tempo total da requisição — enquanto as queries ao banco levam dezenas de milissegundos, a chamada à IA pode levar vários segundos, dependendo da carga do modelo e da latência de rede até o servidor do LiteLLM.

<img width="1363" height="597" alt="print 8 grafana chamada api openai" src="https://github.com/user-attachments/assets/96559acd-4679-49a6-b00e-25b62c6d51df" />

<img width="1360" height="625" alt="print 9 grafana passo 5" src="https://github.com/user-attachments/assets/7445dafd-031e-4022-81f3-d249649f4c17" />

<img width="648" height="166" alt="print 11 grafana passo 5" src="https://github.com/user-attachments/assets/944c0c04-3554-4271-92c4-dd078ddeefde" />

**Onde está o gargalo:** na dependência de uma API externa (LiteLLM/Groq) para cada requisição de recomendação.

**O que seria feito para resolver:** implementar cache das recomendações geradas — por exemplo, armazenar o resultado no banco por 1 hora e só chamar a IA novamente quando o cache expirar ou quando o perfil do usuário mudar (novas compras, novos interesses). Isso reduziria chamadas à IA de centenas para dezenas por dia, diminuindo latência e custo.

---

## 6. Atributo customizado

Três atributos de negócio foram adicionados aos spans manuais e merecem destaque pela utilidade na investigação de problemas:

**`pedido.valor`** (span `finalizar-pedido`)  
Permite filtrar traces de transações acima de determinado valor. Útil para investigar pedidos de alto impacto financeiro ou detectar comportamentos anômalos (ex: pedidos com valor zerado que não deveriam existir).

**`ia.recomendacoes_geradas`** (span `gerar-recomendacoes-ia`)  
Indica quantas recomendações a IA retornou por chamada. Permite detectar quando o modelo está retornando menos resultados que o esperado (ex: sempre 0 ou sempre 1), o que pode indicar problema no prompt, catálogo vazio ou falha silenciosa na validação anti-alucinação.

**`catalogo.candidatos`** (span `gerar-recomendacoes-ia`)  
Mostra quantos livros foram enviados no prompt da IA. Se esse número for 0, a IA não tem o que recomendar — o que explicaria recomendações vazias sem nenhum erro visível. Combinar esse atributo com `ia.recomendacoes_geradas` permite diagnosticar rapidamente se o problema é falta de catálogo ou falha na IA.
