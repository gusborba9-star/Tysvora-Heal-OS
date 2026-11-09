# Program Engine Specification

## 1. Objetivo

Modelar, configurar, versionar, executar e medir programas de cuidado/serviço sobre engines compartilhados. Programa é entidade de domínio configurável, não sinônimo de módulo de código.

## 2. Estrutura de ProgramDefinition

- identity: id, code, name, description, owner;
- domain: vertical, specialty, population, subject type;
- governance: status, version, approver, approval date, effective period;
- eligibility: inclusion, exclusion, enrollment and exit criteria;
- pathway: stages, transitions, deadlines, recurrence and escalation;
- team: roles, competencies, responsible parties;
- care: goals, interventions, plan templates, assessments;
- protocols: approved protocol references and versions;
- operations: tasks, communication, appointments, field work;
- measures: process, outcome, safety and balancing indicators;
- data: required fields, sources, lineage, retention and sharing policy;
- integration: mappings and external references.

## 3. Entidades

ProgramDefinition, ProgramVersion, ProgramTemplate, ProgramEnrollment, EnrollmentStatusHistory, ProgramStage, ProgramGoal, ProgramAssessment, ProgramIndicator, ProgramTeamAssignment, ProgramExit and ProgramTransfer.

## 4. Ciclo de vida

DRAFT → REVIEW → APPROVED → PUBLISHED → ACTIVE → DEPRECATED → RETIRED. Publicação imutável. Nova alteração gera nova versão. Vigência e migração de participantes são políticas explícitas.

## 5. Enrollment

Enrollment liga CareSubject, programa, versão, instituição/unidade, equipe, responsável, data, elegibilidade, status e base legal/consentimento aplicável. Reentrada, transferência, pausa e encerramento são eventos auditáveis.

## 6. Configuração

Instância institucional pode parametrizar calendário, metas locais, equipe, mensagens, tarefas e integrações dentro do envelope permitido. Não pode sobrescrever requisitos de segurança, protocolo obrigatório ou regra legal sem governança.

## 7. Indicadores

Definir denominador, numerador, janela, fonte, frequência, exclusões, missing data e versão da definição. Distinguir processo, resultado, segurança e equilíbrio. Comparações entre instituições exigem normalização e contexto.

## 8. Extensibilidade

Novo programa deve preferir template/configuração + engines + protocolo aprovado. Código específico só quando regra de domínio não couber em contrato declarativo seguro. Testar compatibilidade entre versões e ausência de duplicação de Core.

## 9. Cenários mínimos

Tabagismo em UBS; diabetes em rede municipal; depressão em clínica; nutrição individual; veterinária com CareSubject animal e Guardian. Todos usam infraestrutura compartilhada, mantendo seus próprios protocolos e regras.
