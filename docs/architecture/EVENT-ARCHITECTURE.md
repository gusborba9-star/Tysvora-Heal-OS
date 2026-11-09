# Tysvora Heal OS — Event Architecture

## 1. Propósito

Eventos representam fatos de domínio, integrações e operação. Não são sinônimo de log, notificação ou comando.

## 2. Categorias

- Domain event: fato ocorrido no domínio.
- Integration event: contrato externo publicado.
- Command: solicitação de ação.
- Notification: intenção de entrega.
- Audit record: trilha de ação/acesso.
- Technical log/metric/trace: diagnóstico operacional.

## 3. Envelope mínimo

event_id, event_type, schema_version, occurred_at, recorded_at, tenant_id quando aplicável, organization/unit context, actor/source, subject/reference, correlation_id, causation_id, idempotency_key, payload e classificação de sensibilidade.

## 4. Semântica

Assumir at-least-once até prova em contrário; consumidores idempotentes. Eventos são imutáveis; correções produzem novos fatos. Ordenação é definida por agregado/stream quando necessária. Não prometer exactly-once.

## 5. Eventos de programa e cuidado

Exemplos conceituais: program.enrollment.created, program.stage.changed, care.event.reported, care.event.triaged, care.plan.versioned, care.task.assigned, care.task.completed, encounter.closed, prescription.issued, integration.record.reconciled. Eventos não expõem dados clínicos desnecessários no payload.

## 6. Confiabilidade

Para eventos críticos, usar padrão transacional apropriado (ex.: outbox) quando aprovado. Retry com backoff, dead-letter, replay controlado, deduplicação, schema registry/compatibilidade e observabilidade. Broker permanece ADR.

## 7. Segurança

Autorização de produtor/consumidor, classificação de payload, segregação por tenant, retenção e acesso auditado. Eventos não são canal para contornar autorização.
