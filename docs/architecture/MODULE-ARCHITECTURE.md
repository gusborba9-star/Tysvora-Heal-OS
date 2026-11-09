# Tysvora Heal OS — Module & Capability Architecture

## 1. Distinções

- **Engine:** capacidade compartilhada com contrato estável.
- **Module:** pacote de software delimitado que entrega uma capacidade de domínio.
- **Program:** configuração operacional versionada, composta por engines, workflows, protocolos e módulos.
- **Protocol:** artefato técnico/profissional versionado e aprovado.
- **Vertical adapter:** adaptação de terminologia, regras, dados e integrações de um domínio.

Não criar um módulo de código para cada programa quando a diferença puder ser representada por configuração segura.

## 2. Manifesto de módulo

Cada módulo declara: identificador, nome, owner, versão, compatibilidade Core, dependências, permissões, escopos, dados, migrações, APIs, eventos, configuração, integrações, feature flags, health checks, política de upgrade/downgrade, exportação e desativação.

## 3. Ciclo de vida

DISCOVERED → AVAILABLE → CONTRACTED → CONFIGURING → HOMOLOGATING → ACTIVE → SUSPENDED → DEACTIVATED → RETIRED.

Transições exigem autorização, pré-condições, auditoria e plano de reversão quando aplicável. Estado comercial não substitui estado técnico.

## 4. Registry e catálogo

Registry é autoridade técnica para versão, dependências, compatibilidade, ativação e saúde. Catálogo pode apresentar capacidades comerciais. Configuração não concede permissões; feature flag não é controle de segurança.

## 5. Programas

Program Engine compõe capacidades sem confundir enrollment com ativação de módulo. Programa possui template, versão, vigência, elegibilidade, etapas, metas, instrumentos, protocolos, papéis, tarefas, indicadores, comunicação, integrações e regras de saída.

## 6. Extensibilidade

Preferência: configuração declarativa validada → adapter de domínio → módulo específico → serviço independente somente quando justificado. Fork por cliente é exceção com ADR e custo de manutenção explícito.

## 7. Propriedade de dados

Cada bounded context é dono de suas regras e dados. Contratos de leitura/escrita são explícitos. Nenhum módulo redefine tenancy, identidade ou autorização global.

## 8. Migração e compatibilidade

Mudanças de manifest, schema e API são versionadas. Upgrade deve validar dependências, preservar histórico, permitir rollback compatível e registrar migrações. Desativação não elimina dados regulados.
