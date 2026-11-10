# Modular Commerce & Tysvora Store

**Status:** ESPECIFICAÇÃO DOCUMENTAL — NÃO IMPLEMENTADA.  
**Escopo:** catálogo, planos, adicionais, direitos, capacidade, contratação, provisionamento, medição e cobrança.  
**Regra:** preços abaixo são hipóteses comerciais para planejamento; não autorizam publicação, venda ou cobrança.

## 1. Princípios

- Uma plataforma multi-tenant compartilhada; cada assinatura e entitlement pertence a uma organização contratante.
- Catálogo dinâmico governado pelo Tysvora Control Center.
- Autoatendimento no Tysvora Institution, sujeito a autorização e elegibilidade.
- Funcionalidade só pode ser vendida quando implementada, testada, provisionável e suportada.
- Feature flag não substitui autorização server-side nem entitlement.
- Direitos, limites, consumo e cobrança devem ser auditáveis e reconciliáveis.
- Pacientes não pagam individualmente para acessar o Tysvora Patient.
- Não cobrar por cadastro histórico de paciente nem por mensagem clínica individual.
- Programas e especialidades básicas não são SKUs separados.

## 2. Planos iniciais de referência

| Plano | Preço de referência | Público |
|---|---:|---|
| Tysvora Start | R$ 199/mês | Profissional independente/pequena operação |
| Tysvora Institution | R$ 899/mês | Clínica/instituição de uma unidade |
| Tysvora Network | R$ 3.990/mês | Rede/múltiplas unidades |
| Tysvora Public & Enterprise | A partir de R$ 12.000/mês | Município, secretaria, hospital ou grande operação |

Franquias preliminares para validação: Start 1 profissional/1 unidade; Institution 10 profissionais/1 unidade; Network 50 profissionais/5 unidades; Public & Enterprise dimensionado em contrato. Administradores e acessos operacionais devem ter franquias próprias. Pacientes não consomem assentos profissionais.

Acessos adicionais serão contratados conforme categoria e capacidade. A referência discutida para profissional adicional é R$ 35/mês, ainda não aprovada. Contagem deve considerar usuário profissional ativo/atribuído, não convites pendentes nem contas desativadas. Uma identidade individual por profissional é obrigatória; contas compartilhadas são proibidas.

## 3. Adicionais de referência

| Add-on | Preço de referência |
|---|---:|
| UIP Advanced | R$ 699/mês |
| Connector Agent adicional | R$ 299/mês |
| Field Operations | R$ 899/mês |
| Sentinela Intelligence | R$ 699/mês |
| Advanced Analytics | R$ 499/mês |
| Communication Hub | R$ 249/mês |
| AI Services | Pacotes a partir de R$ 99 ou consumo medido |
| Premium Support / SLA | R$ 699/mês |

Serviços profissionais separados: implantação assistida, integração personalizada, migração e saneamento de dados, treinamento e suporte presencial. Valores devem ser orçados por escopo, sem bloquear autoimplantação padrão.

## 4. Superfícies

**Tysvora Institution / Store:** consultar plano atual, franquias, elegibilidade, adicionais disponíveis, preço, consumo, acessos, contratação, upgrade/downgrade, cancelamento, pagamentos e histórico.

**Tysvora Control Center:** criar/editar/arquivar SKUs, planos, preços, versões, franquias, limites, elegibilidade, add-ons, descontos autorizados, contratos, assinaturas, direitos, consumo, billing, reconciliação, inadimplência e disponibilidade. Alterações devem ser versionadas e auditadas.

## 5. Modelo de domínio mínimo

- Product / Plan / AddOn / ServiceSKU;
- PriceVersion / Currency / BillingInterval;
- PlanEntitlement / FeatureEntitlement / CapacityEntitlement;
- OrganizationSubscription / SubscriptionItem;
- Contract / ContractAmendment;
- SeatAssignment / SeatCategory;
- UsageEvent / UsageAggregate / UsageLimit;
- ProvisioningJob / EntitlementState;
- Invoice / Payment / ReconciliationRecord;
- Discount / Trial / GracePeriod;
- AuditEntry.

O modelo deve separar catálogo (o que pode ser comprado), contrato (o que foi acordado), entitlement (o que pode ser usado), provisionamento (o que foi ativado), metering (o que foi consumido) e billing (o que foi cobrado/pago).

## 6. Fluxo de contratação

1. Institution consulta catálogo e elegibilidade.
2. Usuário autorizado seleciona SKU, quantidade, franquias e condições.
3. Backend recalcula preço e valida permissões, contrato, capacidade e dependências.
4. Termos são apresentados e aceitos por representante autorizado.
5. Subscription é criada em estado pendente.
6. Provedor processa pagamento/mandato conforme modelo.
7. Webhook assinado é validado e idempotente.
8. Reconciliação confirma estado financeiro.
9. Entitlements são concedidos e Provisioning Engine ativa a capacidade.
10. Evento auditável confirma ativação; UI mostra estado e pré-requisitos restantes.

Não habilitar direito apenas porque o usuário clicou em contratar ou porque o frontend reportou sucesso.

## 7. Lifecycle e exceções

Estados mínimos: draft, pending_payment, trialing, active, past_due, grace_period, suspended, canceled, expired. Upgrade/downgrade devem ter regra explícita de proration, data de efeito, capacidade, dados e reversibilidade. Cancelar assinatura não apaga dados clínicos nem encerra CareRelationship. Suspensão por inadimplência não pode violar retenção legal, exportação de dados, continuidade assistencial ou obrigações contratuais. Definir janela de tolerância e processo de disputa.

## 8. Entitlements e capacidade

- Enforcement server-side em toda API/ação sensível.
- Isolamento por tenant e organização; sem direitos globais acidentais.
- Separar profissionais, administradores, equipe operacional, unidades, pacientes ativos e quotas de consumo.
- Convites pendentes não contam como assentos ativos; revogação/desativação libera capacidade conforme política.
- Add-ons podem ter dependências e conflitos declarados.
- Provisionamento idempotente, com retries, estado visível, rollback e suspensão.
- Feature flags controlam rollout/disponibilidade; entitlements determinam direito contratado; permissões determinam quem pode executar.

## 9. Usage metering e custos variáveis

Medir quando aplicável: tokens/requests de IA, OCR/documentos processados, mensagens por canal, armazenamento, tráfego, sincronização e áudio opcional. Definir unidade, franquia, alertas, teto, preço de excedente e política de bloqueio antes de cobrar. Não incluir áudio ou transcrição como consumo ilimitado no plano básico.

## 10. Segurança, auditoria e finanças

- Webhooks assinados, idempotência, deduplicação e reconciliação independente.
- Segredos fora do frontend e rotação de credenciais.
- Registro de ator, organização, SKU, preço/versão, quantidade, moeda, estado anterior/novo e timestamps.
- Segregação entre metadados comerciais e conteúdo clínico.
- Acesso do suporte a billing sem acesso clínico global.
- Exportação de faturas, relatórios e trilha de auditoria.
- Revisão legal/fiscal/contratual e privacidade por jurisdição.

## 11. Critérios de aceitação

- Um tenant não consegue visualizar, comprar ou usar assinatura de outro.
- Preço e entitlement são calculados no backend.
- Pagamento pendente não concede acesso pago.
- Webhook repetido não duplica cobrança ou entitlement.
- Falha de provisionamento pode ser retomada sem duplicar recursos.
- Upgrade, downgrade, cancelamento, inadimplência, tolerância e reativação são testados.
- Assentos contam usuários ativos segundo categoria.
- Add-on só aparece como disponível se houver readiness técnica/comercial.
- Consumo e cobrança são reconciliáveis.
- Suspensão comercial não apaga prontuário nem histórico.
- Logs não expõem dados clínicos desnecessários.

## 12. Gate de lançamento

Nenhum plano/add-on pode ser publicado ou cobrado antes de: custos e margem validados; termos e regras fiscais revisados; provedor e webhooks homologados; entitlement enforcement; provisionamento; metering; billing/reconciliação; suporte e runbooks; testes E2E/segurança; aceite formal do CTO.
