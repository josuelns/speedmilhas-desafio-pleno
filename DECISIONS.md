# DECISIONS

Quatro perguntas. Responda todas — é aqui que a gente entende as suas escolhas, e cada
resposta vira conversa na entrevista.

Objetividade vale mais que volume. Duas frases boas batem dois parágrafos genéricos.

---

## 1. O que acontece quando o fornecedor B demora 8 segundos?

E por que você escolheu essa estratégia e não outra?

Cada fornecedor tem timeout próprio (`SUPPLIER_TIMEOUT_MS`, 5,5s), e chamo os três com `Promise.allSettled` — nunca `Promise.all`, porque um único fornecedor falhando derrubaria A e C junto com ele. Quando o B trava nos 8s do mock, ele estoura o timeout sozinho aos 5,5s; A e C respondem normal. A API devolve em até 6s um resultado parcial: `meta.partial: true`, `meta.suppliers.B = { ok: false, reason: "timeout" }`, e `results` só com A e C. O front mostra um banner avisando qual fornecedor falhou, em vez de sumir com a informação.

Exemplo: busca `GRU → GIG` com o B lento — em ~6s o usuário já vê A e C na lista, com o aviso de que um fornecedor não respondeu, em vez de a tela travar por 8s ou voltar vazia.

Não fiz retry no B: dentro do orçamento de 6s não sobra tempo pra uma segunda tentativa, e insistir num fornecedor que já dá 429 tende a piorar, não resolver. Preferi devolver parcial com o motivo explícito.

---

## 2. Como você garante uma única reserva sob concorrência?

E o que quebra se subirem três instâncias da aplicação?

`idempotencyKey` é `@unique` no schema do Prisma — a garantia é do Postgres, não de código. Em `OrdersService.create` eu tento o `create` direto, sem checar antes se já existe; se der conflito (`P2002`), busco (`findUnique`) o registro que já foi criado e devolvo a mesma resposta (mesmo `id`) pra quem chegou depois.

Vale separar dois cenários: João reservando uma cotação e Maria reservando outra **não colide** — cada clique gera sua própria `idempotencyKey` (`crypto.randomUUID()` em `QuoteList.tsx`), então são duas linhas diferentes, sem erro. O conflito só existe quando a **mesma** chave chega duas vezes — ex: a chamada do João deu timeout de rede e foi reenviada com a mesma chave. Nesse caso a segunda chamada não dá erro: devolve a reserva que já existia.

Não usei `findFirst` + `create` porque é uma race condition clássica: duas requisições quase simultâneas podem ver "não existe" ao mesmo tempo e ambas criarem. Testei isso no RF4 — duas instâncias (portas diferentes, mesmo banco) recebendo a mesma `idempotencyKey` em paralelo — e confirmo uma única linha no banco e o mesmo `id` nas duas respostas. Com 3, 10 ou 100 instâncias o resultado é o mesmo, porque a garantia está no Postgres.

O que **não** escalaria com múltiplas instâncias: cache de busca e circuit breaker do B são estado em memória por processo — cada instância teria seu próprio cache e seu próprio circuito. Pra produção, moveria isso pra um Redis compartilhado.

---

## 3. Como você usou IA?

Quais ferramentas (Claude Code, Codex, Cursor, ChatGPT…), com que método (spec-driven, TDD
com agente, pair, revisão) — e **um ponto concreto onde você discordou dela** e seguiu por
outro caminho.

Usei o **Cursor** do início ao fim. Antes de pedir código, escrevi regras em `.cursor/rules` — um arquivo por requisito (`rf1-busca-agregada.mdc`, `rf2-idempotencia.mdc`, `rf3-frontend.mdc`, `rf5-decisions-e-bonus.mdc`) e um `00-contexto-geral.mdc` com o que nunca fazer: `Promise.all` sem `Settled`, idempotência com Map em memória, `findFirst` + `create` separados, cache proativo. Método: RF por RF, plano curto antes de codar, implementação, `npm test` passando antes de seguir pro próximo, commits pequenos a cada etapa.

Duas discordâncias concretas, rastreáveis no código:

1. **Idempotência**: a sugestão inicial foi `findFirst` e, se não existir, `create` — parece certo, mas é race condition (duas requisições podem ver "não existe" ao mesmo tempo). Troquei por `create` direto + tratamento de `P2002`, atômico porque a constraint `UNIQUE` está no banco.
2. **Cache de busca**: a sugestão foi cache proativo, chamando os fornecedores em background pra adiantar resultado. Recusei porque mascararia a instabilidade real que o RF1 quer expor. Fiz cache reativo, só pra mesma busca repetida num TTL de 30s.

Um terceiro ponto mais geral: em alguns momentos a IA sugeriu abstrações que deixavam o código mais difícil de ler sem resolver nada que o requisito exigisse — por exemplo, um job assíncrono com `jobId` e polling pro `/search`, que faz sentido se o fornecedor demorar minutos, não segundos. Nesses casos o critério foi sempre o mesmo: se a versão simples resolve o requisito como escrito, fico com ela.

---

## 4. Quanto tempo você demorou para concluir o desafio?

**Cerca de 5 horas**, dentro da janela de 7 dias corridos do desafio. RF1 e RF2 levaram a maior parte do tempo — são os de maior risco de erro sutil (race condition, timeout, resposta parcial). RF3 e RF4 vieram em cima de uma base já estável, e os bônus (cache, circuit breaker, paginação) só entraram depois de RF1–RF4 sólidos e testados.

---

### Bônus implementados

- **Cache reativo** (`origin:destination:date`, TTL 30s, `meta.cached: true`) — só serve a mesma busca repetida dentro da janela; nunca chamo fornecedores em background.
- **Circuit breaker no fornecedor B** (`circuit_open` após falhas consecutivas). Testado forçando 3 falhas seguidas: na 4ª busca o circuito já abre e responde em <2s sem tentar o B. Depois de `CIRCUIT_B_OPEN_MS`, ele testa uma chamada real (meio-aberto) antes de fechar de novo.
- **Paginação no `/search`** (`page`/`pageSize`, `meta.pagination.hasMore`/`total`) + "Carregar mais" no front — a chamada aos fornecedores só acontece na 1ª página; as demais usam o cache.
- **Segundo teste do RF1** usando `force-fail`/`force-slow` do mock, pra reproduzir falha parcial sem depender de sorteio de probabilidade.

### O que ficou de fora (e como faria com mais tempo)

- **Log estruturado por fornecedor**: hoje é `console.warn` em texto. Trocaria por um logger (ex: Pino) emitindo JSON com `supplierId`, `reason` e item descartado, pra dar pra filtrar em produção.
- **Sync/cache proativo de cotações**: descartado por decisão, não por falta de tempo — mascararia a instabilidade real que o RF1 quer expor.
- **Streaming (SSE/WebSocket) ou job assíncrono com polling**: faria sentido se os fornecedores demorassem minutos, não segundos. Com teto de 6s, só adicionaria complexidade sem resolver nada do escopo atual.
