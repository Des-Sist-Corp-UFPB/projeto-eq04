# Relatório de Observabilidade com OpenTelemetry

**Disciplina:** Desenvolvimento de Sistemas Corporativos (DSC) — UFPB  
**Equipe:** eq04  
**Projeto:** DSC E-books (Alelib)  
**Stack:** Next.js 14 · TypeScript · Prisma · PostgreSQL · Docker  

---

## 1. Backend no ar

O backend de observabilidade utilizado foi a imagem `grafana/otel-lgtm`, que integra em um único container o coletor OTLP, Loki (logs), Grafana (interface), Tempo (traces) e Mimir (métricas).

O serviço foi adicionado ao `docker-compose.yml` do projeto:

```yaml
otel-lgtm:
  image: grafana/otel-lgtm
  container_name: otel-lgtm
  ports:
    - "3001:3000"   # Grafana
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

> 📸 **[inserir print do Grafana com o service name `eq04-alelib` aparecendo no Tempo]**

---

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

> 📸 **[inserir print da cascata (waterfall) completa do trace de recomendações]**

---

## 3. Query SQL visível

Dentro do trace da requisição `GET /` (listagem do catálogo), a auto-instrumentação do Prisma captura automaticamente as queries SQL executadas como spans filhos.

O span de query SQL identificado representa a busca de todos os livros com seus autores e categorias para montar o catálogo da página inicial — operação na tabela `Book` com joins em `Author` e `Category`.

> 📸 **[inserir print do span de query SQL dentro do trace, mostrando a tabela/operação]**

---

## 4. Instrumentação manual

Foram adicionados spans manuais em duas regras de negócio críticas do sistema.

### 4.1 Span: `gerar-recomendacoes-ia`

Localização: `src/lib/openai.ts`

Cobre toda a regra de negócio de geração de recomendações — da consulta ao banco até a persistência dos resultados. A auto-instrumentação enxerga as queries SQL e a chamada HTTP isoladamente, mas não o fluxo de negócio como um todo. O span manual une essas peças e adiciona contexto de negócio.

Atributos customizados adicionados:

| Atributo | Valor exemplo | Finalidade |
|---|---|---|
| `usuario.id` | `cm123abc` | Rastrear qual usuário acionou a geração |
| `catalogo.candidatos` | `6` | Quantos livros foram enviados no prompt |
| `ia.recomendacoes_geradas` | `5` | Quantas recomendações a IA retornou |

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

> 📸 **[inserir print mostrando os spans `gerar-recomendacoes-ia` e `chamada-api-openai` aninhados no trace]**

### 4.2 Span: `finalizar-pedido`

Localização: `src/app/api/orders/route.ts`

Cobre o fluxo completo de compra — transação no banco (criação do pedido + liberação na biblioteca digital) e registro de auditoria. A auto-instrumentação captura as queries SQL individualmente, mas o span manual revela o valor e o contexto de negócio da operação como um todo.

Atributos customizados adicionados:

| Atributo | Valor exemplo | Finalidade |
|---|---|---|
| `pedido.usuario_id` | `cm123abc` | Rastrear qual usuário fez a compra |
| `pedido.quantidade_itens` | `2` | Quantos livros foram comprados |
| `pedido.valor` | `54.80` | Valor total da transação |
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

> 📸 **[inserir print mostrando o span `finalizar-pedido` aninhado no trace com os atributos de negócio]**

---

## 5. Diagnóstico de operação lenta

A operação mais lenta identificada pela telemetria é a **chamada à API de IA** (`chamada-api-openai`), dentro do fluxo de geração de recomendações.

Na cascata do trace, o span `chamada-api-openai` representa a maior fatia do tempo total da requisição — enquanto as queries ao banco levam dezenas de milissegundos, a chamada à IA pode levar vários segundos, dependendo da carga do modelo e da latência de rede até o servidor do LiteLLM.

> 📸 **[inserir print da cascata mostrando a duração de cada span, com destaque para `chamada-api-openai`]**

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
