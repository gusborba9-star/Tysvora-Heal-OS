# Tysvora Heal OS — Security & Privacy Architecture

## 1. Modelo

Defense in depth: identidade, autenticação, autorização, tenant isolation, contexto, dados, aplicação, infraestrutura, observabilidade e resposta a incidentes.

## 2. Identidade e representação

UserIdentity autentica; Person representa pessoa; Professional representa contexto profissional; CareSubject recebe cuidado; Guardian representa sujeito quando autorizado. Uma identidade pode ter múltiplos vínculos sem fundi-los.

## 3. Autorização contextual

Combinar RBAC com atributos/contexto (ABAC): tenant, organization, unit, team, relação de cuidado, programa, finalidade, papel profissional, vínculo, estado do consentimento/base legal e sensibilidade do dado. Default deny. Acesso emergencial break-glass é justificado, limitado no tempo e auditado.

## 4. Escopos

Platform admin não recebe conteúdo clínico por padrão. Tenant admin não é automaticamente profissional. Participação em programa não concede acesso completo ao prontuário. Guardian tem escopo delegado e revogável. Operador técnico não recebe conteúdo assistencial por padrão.

## 5. Multi-instituição

Uma pessoa vinculada a instituições distintas mantém contextos segregados. Compartilhamento requer base legal, finalidade e autorização adequadas, além de trilha. Não inferir consentimento por convite ou login.

## 6. Autenticação e sessão

Autenticação segura, MFA conforme risco, recuperação, revogação, gestão de dispositivos e sessão, proteção contra CSRF/XSS, rate limiting e detecção de abuso. Provedor final permanece ADR.

## 7. Dados e documentos

Criptografia em trânsito/repouso, gestão de chaves, minimização, classificação, retenção, exportação e descarte. Documentos clínicos precisam de integridade, assinatura e verificação conforme exigência legal.

## 8. Auditoria

Acesso e mutações sensíveis registram actor, subject, tenant, organization, purpose, action, target, timestamp, correlation, source e resultado. Proteger contra alteração e acesso indevido. Logs técnicos não substituem audit trail.

## 9. Integrações e IA

Credenciais por conexão, least privilege, rotação, isolamento, allowlists, validação de payload e proteção contra replay. Dados enviados a IA passam por policy gate, minimização, controle de fornecedor/retention e avaliação de risco.

## 10. LGPD e governança

Finalidade, adequação, necessidade, transparência, segurança, prevenção e direitos do titular devem orientar o desenho. Consentimento não é única base legal e não deve ser presumido. Exigir avaliação jurídica/encarregado para tratamentos de maior risco e dados de saúde.

## 11. Testes

Tenant isolation, organization/unit boundaries, program scope, guardian scope, revoked access, break-glass, export, API abuse, secrets, audit integrity, prompt injection e leakage.
