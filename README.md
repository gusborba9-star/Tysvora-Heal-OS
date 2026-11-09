# Tysvora Heal OS

## Posicionamento

**Tysvora Heal OS** é uma plataforma universal de cuidado, programas e continuidade. Conecta organizações, profissionais, pessoas, sujeitos de cuidado, sistemas externos e operações para que o cuidado continue após cada atendimento.

Não é apenas um prontuário, agenda, ERP ou aplicativo de mensagens. É uma infraestrutura adaptável que pode operar diferentes verticais, especialidades, programas e linhas de cuidado sobre capacidades compartilhadas.

## O que a plataforma pretende suportar

- Saúde pública, municípios, UBS, redes e serviços privados;
- clínicas, consultórios e profissionais;
- especialidades médicas e multiprofissionais;
- programas como tabagismo, diabetes, hipertensão, depressão, saúde mental, nutrição, pré-natal, reabilitação e outros;
- saúde veterinária, com distinção entre sujeito animal e tutor/guardian;
- experiências Patient, Professional, Institution (Institutional Workspace Premium) e Field;
- Tysvora Control Center para administração interna da plataforma, segregado da operação institucional;
- UIP com Easy Connect, Connector Agent opcional, APIs, bancos, arquivos, CRM/ERP, upload e cadastro manual;
- integração progressiva com sistemas existentes e operação autônoma quando necessário.

A lista é aberta. A presença de uma capacidade na documentação não comprova implementação.

## Princípio arquitetural

Uma infraestrutura comum — Core, dados, UIP, segurança, workflow e inteligência — combinada com adaptadores, configurações e módulos de domínio. Easy Connect permite onboarding e integração self-service progressiva; Connector Agent executa acesso local autorizado. Patient, Professional, Institution e Field são experiências distintas. Control Center administra a plataforma sem acesso clínico global. Programas são entidades configuráveis e versionadas, não necessariamente módulos de código.

## Estado real do repositório

O Heal Core possui contratos e implementações iniciais documentados. Consulte:
- `docs/core/CORE-FOUNDATION.md`
- `docs/core/APPLICATION-LAYER.md`
- `docs/ROADMAP.md`

Não confundir visão/roadmap com funcionalidade entregue. Persistência de produção, integrações, experiências completas, programas, engines clínicos, Sentinela e operação produtiva só podem ser considerados implementados quando houver código e evidências específicas.

## Governança documental

`BLUEPRINT.md` define produto e princípios.  
`ROADMAP.md` define sequência e gates.  
Especificações definem contratos.  
Execuções autorizam escopo.  
Código implementa.

## Relação com Veritas-OS

Nenhum código do Veritas-OS é presumido incorporado. Reutilização futura exige avaliação explícita de REUTILIZAR / ADAPTAR / DESCARTAR / RECONSTRUIR, com segurança, domínio e dependências verificadas.

## Status

Em construção. Fase 2A — Product & Architecture Lock — está concluída no escopo documental; consulte `docs/architecture/PHASE-2A-CLOSURE-REPORT.md`. Fase 3 — Heal Core — permanece com o estado histórico registrado no Roadmap. Esta documentação não declara nova funcionalidade implementada nem autoriza expansão automática de código.
