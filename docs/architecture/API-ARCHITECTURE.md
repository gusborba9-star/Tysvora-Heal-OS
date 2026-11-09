# Tysvora Heal OS — API Architecture

## 1. Princípio

APIs expõem casos de uso e contratos de domínio, nunca CRUD indiscriminado de tabelas. Rotas versionadas; convenção inicial /api/v1.

## 2. Fronteiras

API Gateway aplica autenticação, contexto, autorização, rate limits, correlation, validação, observabilidade e políticas. Bounded contexts mantêm APIs próprias com contratos estáveis.

## 3. Contratos

OpenAPI ou mecanismo equivalente, schema validation, versionamento, compatibilidade, depreciação e documentação. Idempotency keys em comandos mutáveis/retryable. Paginação limitada e filtros allowlisted.

## 4. Segurança

Default deny, tenant/context propagation, autorização no servidor, validação de entrada e saída, proteção contra mass assignment, safe errors, quotas e limites de payload. Não confiar em tenant_id enviado pelo cliente sem validar contexto.

## 5. Integrações

APIs internas não devem expor diretamente tabelas. APIs externas usam escopos, client identity, versionamento, quotas, webhooks assinados, replay protection e rotação de credenciais.

## 6. Dados e auditoria

Mutações sensíveis geram audit e eventos confiáveis. Respostas minimizam dados clínicos e respeitam purpose limitation. Correlation IDs atravessam serviços e conectores.

## 7. Operação

Timeout, retry policy, circuit breaker quando aplicável, rate limits, SLOs, tracing e contract tests. Nenhum endpoint é considerado implementado por estar especificado.
