# Tysvora Heal OS — AI Architecture

## 1. AI Gateway

```
Tysvora
   │
   ▼
AI Gateway
   │
   ├── Provider Adapter
   ├── Model Router
   ├── Policy Layer
   ├── Cost Control
   ├── Safety Layer
   ├── Observability
   └── Audit
          │
          ▼
      Providers
```

The application never depends directly on a model provider as a domain contract.

OpenRouter may be used as a provider/router through this boundary, but it is not structurally required.

## 2. Provider abstraction

Provider adapters translate a stable internal AI contract into provider-specific APIs. Providers and models must be replaceable.

## 3. Model routing

Routing may consider task policy, capability, latency, cost, availability and safety. A route must not silently change clinical meaning or safety posture.

## 4. Fallback

Fallbacks require explicit policy. A fallback model must be compatible with the task's minimum capability and safety constraints.

## 5. Reliability

AI calls require bounded timeout and retry policies. Retries must respect idempotency and provider cost.

## 6. Cost tracking

Track model/provider, request class, token/usage measures where available, latency and estimated cost. Tenant attribution must be supported for governed billing/observability.

## 7. Policy and safety

Policy checks occur before and/or after model execution as appropriate. Sensitive clinical use cases require human oversight and explicit governance.

## 8. Prompt and version management

Prompts/instructions used as system assets must be versioned, reviewable and attributable to a release.

## 9. Structured outputs

Where downstream logic depends on AI output, use schema-constrained/validated structured output where supported. Invalid or incomplete output must not bypass deterministic validation.

## 10. Separation of concerns

```
Deterministic Rules
Protocol Engine
Calculation Engine
AI
```

AI must not replace deterministic rules when a deterministic rule is appropriate.

## 11. Audit and observability

AIRequest/AIResponse metadata, policy decisions, model selection, usage and outcome status require appropriate auditability without indiscriminately storing sensitive prompts/responses.

## 12. Caching

Caching may be used where response reuse is safe. Patient-specific or sensitive outputs require strict cache isolation and policy review.

## 13. Human oversight

Critical decisions remain under professional responsibility. AI output is advisory and must not be treated as autonomous clinical authority.

**DECISION PENDING:** exact provider set, model policy catalogue, retention of prompts/responses and final AI evaluation methodology.
