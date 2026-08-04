# DECISIONS

Quatro perguntas. Responda todas — é aqui que a gente entende as suas escolhas, e cada
resposta vira conversa na entrevista.

Objetividade vale mais que volume. Duas frases boas batem dois parágrafos genéricos.

---

## 1. O que acontece quando o fornecedor B demora 8 segundos?

E por que você escolheu essa estratégia e não outra?

Cada fornecedor tem timeout individual (`SUPPLIER_TIMEOUT_MS`, padrão 5,5s). As três chamadas rodam em `Promise.allSettled`, então o B estoura o timeout enquanto A e C seguem. A resposta volta parcial com `meta.suppliers.B.reason = timeout`, dentro do teto de 6s — sem esperar os 8s do mock.

Não usei retry no B nesta versão: com o orçamento de 6s, um retry poderia piorar o rate limit (429) sem ganho garantido.

---

## 2. Como você garante uma única reserva sob concorrência?

E o que quebra se subirem três instâncias da aplicação?

`idempotencyKey` tem `UNIQUE` no Postgres. O fluxo é `create` direto; em `P2002`, busco o registro existente e devolvo a mesma resposta. Não há Map em memória.

Com três instâncias continua funcionando: a garantia está no banco, não no processo Node. O que não escala entre instâncias é cache de busca e circuit breaker (estado em memória local) — cada instância tem o seu.

---

## 3. Como você usou IA?

Quais ferramentas (Claude Code, Codex, Cursor, ChatGPT…), com que método (spec-driven, TDD
com agente, pair, revisão) — e **um ponto concreto onde você discordou dela** e seguiu por
outro caminho.

Usei **Cursor** em modo pair/spec-driven: regras em `.cursor/rules`, plano por RF, commits pequenos e `npm test` como verificação.

Discordância concreta: a IA sugeriu checar idempotência com `findFirst` + `create` e cache proativo de fornecedores. Mantive `create` + `P2002` (atômico no banco) e cache **reativo** só para a mesma busca repetida em TTL curto — sem antecipar chamadas aos mocks.

---

## 4. Quanto tempo você demorou para concluir o desafio?

**[Ajustar com o tempo real antes de enviar]** — estimativa: ~2 dias de implementação focada (RF1–RF4 + bônus de cache, circuit breaker e paginação), distribuídos ao longo da janela de 7 dias do desafio.

---

### Bônus implementados (referência)

- Cache reativo (`origin:destination:date`, TTL 30s, `meta.cached`).
- Circuit breaker só no fornecedor B (`circuit_open` após falhas consecutivas).
- Paginação no `/search` + botão "Carregar mais" no front.

Não implementado: sync/cache proativo, SSE/WebSocket, job assíncrono com polling.
