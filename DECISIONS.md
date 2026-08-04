# DECISIONS

Quatro perguntas. Responda todas — é aqui que a gente entende as suas escolhas, e cada
resposta vira conversa na entrevista.

Objetividade vale mais que volume. Duas frases boas batem dois parágrafos genéricos.

---

## 1. O que acontece quando o fornecedor B demora 8 segundos?

E por que você escolheu essa estratégia e não outra?

Dei um timeout individual pra cada fornecedor (`SUPPLIER_TIMEOUT_MS`, 5,5s por padrão) e chamei os três com `Promise.allSettled`. Assim, quando o B trava nos 8s do mock, ele estoura o timeout sozinho e não arrasta A e C junto — a resposta sai em até 6s, com `partial: true` e `meta.suppliers.B.reason = "timeout"`.

Pensei em fazer retry no B, mas descartei: dentro de um orçamento de 6s não dá tempo de tentar de novo com segurança, e ainda corro o risco de bater no rate limit (429) do mock. Preferi devolver parcial e deixar claro no `meta` o que falhou, em vez de fingir que está tudo certo ou travar a resposta inteira esperando um fornecedor que já mostrou que está instável.

---

## 2. Como você garante uma única reserva sob concorrência?

E o que quebra se subirem três instâncias da aplicação?

Coloquei `UNIQUE` na coluna `idempotencyKey` no Postgres. Não faço `findFirst` pra checar se já existe e depois `create` — isso é uma race condition clássica quando duas requisições chegam quase juntas. Tento o `create` direto; se der conflito (`P2002`), busco o registro que já existe e devolvo a mesma resposta pra quem chamou. A garantia está no banco, não em código.

Se subirem três instâncias da aplicação, isso continua funcionando sem ajuste nenhum, porque quem garante a unicidade é o Postgres, não o processo Node — não tem Map nem variável em memória guardando estado de idempotência. O que quebraria entre instâncias são o cache de busca e o circuit breaker do fornecedor B: hoje são estado local de cada processo, então cada instância teria seu próprio cache e seu próprio circuito. Pra produção com múltiplas instâncias, moveria isso pra um Redis compartilhado.

---

## 3. Como você usou IA?

Quais ferramentas (Claude Code, Codex, Cursor, ChatGPT…), com que método (spec-driven, TDD
com agente, pair, revisão) — e **um ponto concreto onde você discordou dela** e seguiu por
outro caminho.

Usei o **Cursor** do início ao fim, mas não deixei ele "solto": escrevi regras em `.cursor/rules` pra cada RF (busca, idempotência, frontend, bônus) antes de pedir código, então a IA já sabia o que não podia fazer — por exemplo, nunca usar `Promise.all` sem `Settled`, nunca resolver idempotência com Map em memória. Fui RF por RF, com plano curto antes de codar e commits pequenos, e usei o `npm test` como critério de "terminei" antes de seguir pro próximo.

Onde discordei de verdade: em mais de um momento a IA sugeriu um caminho mais "engenhoso" mas pior na prática — código difícil de ler ou com performance ruim pra um caso simples. Dois exemplos concretos: (1) pra idempotência, ela sugeriu `findFirst` seguido de `create` como checagem; recusei porque isso é race condition na cara, e troquei por `create` direto tratando o erro `P2002` do Postgres, que é atômico. (2) pra busca, ela sugeriu cache proativo (ficar buscando fornecedores em background pra "adiantar" resultado); recusei porque isso mascararia exatamente a instabilidade dos fornecedores que o desafio quer avaliar — fiz cache reativo, só pra mesma busca repetida num TTL curto de 30s. Em geral, quando a sugestão parecia over-engineering pra reduzir a legibilidade sem ganho real de nada dentro do prazo que eu tinha, eu voltei pro caminho mais simples.

---

## 4. Quanto tempo você demorou para concluir o desafio?

**Cerca de 5 horas** de trabalho focado, dentro da janela de 7 dias corridos do desafio — RF1 a RF4, mais os bônus de cache, circuit breaker no fornecedor B, paginação e os testes e2e em cima disso tudo.

---

### Bônus implementados

- Cache reativo (`origin:destination:date`, TTL 30s, `meta.cached`) — só pra mesma busca repetida, nunca antecipando chamada aos fornecedores.
- Circuit breaker no fornecedor B (`circuit_open` após falhas consecutivas), com meio-aberto pra testar recuperação sem martelar o mock.
- Paginação no `/search` + botão "Carregar mais" no front.
- Segundo teste do RF1 usando `force-fail`/`force-slow` do próprio mock, pra não depender de sorteio de probabilidade pra reproduzir falha parcial.

### O que ficou de fora (e como faria com mais tempo)

- **Log estruturado por fornecedor**: hoje o log de item descartado por sujeira e de falha de fornecedor é só `console.warn`. Com mais tempo, trocaria por um logger (ex: Pino) emitindo JSON com `supplierId`, `reason` e o item descartado, pra dar pra filtrar em produção.
- **Sync/cache proativo, SSE/WebSocket, job assíncrono com polling**: descartados de propósito, não por falta de tempo — qualquer um deles mascararia a instabilidade dos fornecedores que o desafio quer expor na busca síncrona.
