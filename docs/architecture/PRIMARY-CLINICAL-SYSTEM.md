# Primary Clinical System, Secure Care Messaging & Relationship Lifecycle

**Status:** ESPECIFICAÇÃO DOCUMENTAL — NÃO IMPLEMENTADA POR ESTE DOCUMENTO.  
**Escopo:** operação nativa como sistema principal, integração/híbrido, chat bidirecional, documentos e ciclo de vida do vínculo assistencial.

## 1. Modos institucionais

Cada organização configura modo por domínio/unidade quando necessário:

- **Primary System:** Tysvora mantém os registros assistenciais nativos para o escopo contratado.
- **Integrated Platform:** sistema externo permanece fonte de registro; Tysvora ingere dados autorizados e coordena continuidade/operação.
- **Hybrid:** sistemas externos e registros nativos coexistem por domínio/atributo, com autoridade e sincronização explícitas.

A configuração exige fonte de verdade, autoridade por atributo, política de conflito, proveniência, retenção e responsabilidade. Não permitir duplicidade ambígua ou sobrescrita silenciosa.

## 2. Clinical Record Core mínimo

Entidades e capacidades: Person/CareSubject, CareRelationship, Professional, Unit/Team, Encounter, ClinicalNote/Evolution, Assessment, CarePlan/Version, CareOrder, Prescription, ClinicalDocument, Attachment, signature metadata, audit and provenance.

O Core deve suportar autoria, timestamps, status, correção não destrutiva, versionamento, integridade, acesso contextual, exportação conforme direito e retenção. A implementação de agenda, faturamento ou módulos especializados será delimitada em especificações próprias.

Tysvora não diagnostica nem prescreve autonomamente. Documentos e prescrições devem atender requisitos legais e assinatura válida quando exigida; um PDF não se torna documento válido apenas por aparência.

## 3. Secure Care Messaging

Conversa entre paciente e profissional/equipe autorizados, com contexto explícito: tenant, instituição, CareRelationship, Encounter, programa, CarePlan ou CareEvent quando aplicável.

Capacidades padrão:
- mensagens de texto bidirecionais;
- envio/recebimento de imagens, PDFs e tipos documentais permitidos;
- estados de envio, entrega e leitura quando disponíveis;
- notificações configuráveis, fila institucional e atribuição;
- histórico íntegro, busca autorizada e auditoria;
- encaminhamento/transferência de conversa;
- limites de tamanho, tipo, frequência e retenção.

Não oferecer áudio no padrão inicial. A ausência de áudio não bloqueia texto e anexos.

## 4. Gestão de documentos

Clinical Document Management classifica e armazena prescrição, atestado, laudo, resultado, pedido de exame, encaminhamento, orientação e documento administrativo. Cada documento deve incluir tipo, emissor, destinatário, instituição, data, contexto, versão, status, integridade e assinatura quando aplicável.

Arquivos ficam em storage privado com criptografia, autorização contextual, URLs assinadas de curta duração, verificação antimalware, validação de MIME/tamanho, trilha de acesso/download e política de retenção. A conversa referencia documento gerenciado; não deve duplicar cópias sem necessidade.

## 5. Áudio como recurso opcional

Áudio é recurso futuro opcional, não requisito do chat inicial. Feature flag global/plano é administrada pelo Control Center; habilitação por tenant/instituição depende de elegibilidade e opt-in do administrador institucional. Default OFF. Se habilitado: formatos permitidos, limite de duração/tamanho, quota, custo de storage/tráfego, retenção, consentimento/transparência, controles de abuso, acessibilidade e auditoria definidos. Transcrição e análise por IA são capacidades separadas, com custos e autorização próprios.

Desativar áudio bloqueia novos envios; não apaga retroativamente mensagens preservadas conforme política. O sistema deve informar claramente a disponibilidade. Nenhuma cobrança de áudio sem metering e preço explícitos.

## 6. Silenciar e preferências

Silenciar é preferência individual de notificação do profissional: suprime notificações comuns da conversa para aquele profissional, mas não remove mensagens, não bloqueia o canal institucional, não altera o vínculo e não oculta alertas críticos/escalonamentos obrigatórios.

Preferências de comunicação podem definir horário/canal e encaminhamento conforme política. Mensagens urgentes devem seguir fluxo institucional adequado e apresentar orientação de emergência; chat não deve ser vendido como serviço de emergência ou monitoramento contínuo sem cobertura contratada.

## 7. Encerramento e transferência de vínculo

CareRelationship lifecycle: pending → active → paused (quando aplicável) → transfer_pending → transferred ou ended. Estados e transições devem ser validados por política institucional.

Encerramento deve registrar ator, escopo, motivo, justificativa quando necessária, timestamp, comunicação, aprovação exigida, situação de tratamento em curso e plano de transição quando aplicável. Não apagar Person, CareSubject, Encounter, documentos, notas ou histórico. Encerrar vínculo profissional não encerra automaticamente vínculo institucional ou outros programas.

Não permitir encerramento como mecanismo de abandono, discriminação, retaliação, supressão de registros ou impedimento de direitos. Fluxo deve contemplar urgência, continuidade, encaminhamento, acesso a documentos, exportação quando aplicável, retenção e revisão. Paciente pode manter acesso aos documentos conforme direitos e política legal aplicável.

## 8. Acesso, segurança e governança

RBAC + ABAC/contexto por tenant, instituição, unidade, equipe, relação, finalidade e papel. Profissional só administra relações dentro de sua autoridade. Administrador institucional possui poderes conforme delegação, não acesso clínico irrestrito por padrão. Acesso de suporte excepcional é justificado, limitado e auditado.

## 9. Testes E2E obrigatórios

1. Clínica sem sistema externo cria paciente, atendimento, evolução, plano e documento válido.
2. Clínica integrada recebe dados de fonte externa sem duplicar ou sobrescrever autoridade.
3. Paciente envia texto/anexo e profissional responde com documento classificado.
4. Arquivo malicioso, excessivo ou tipo proibido é bloqueado e auditado.
5. Silenciar profissional não suprime fila institucional ou alerta crítico.
6. Transferir/encerrar vínculo preserva histórico e direciona continuidade.
7. Paciente com múltiplos vínculos mantém segregação entre instituições.
8. Áudio desligado não permite upload; áudio habilitado respeita quota, flag e política.
9. Assinatura/documento inválido não é apresentado como documento clínico válido.

## 10. Gate

A capacidade só é considerada pronta após testes funcionais, negativos, segurança, privacidade, retenção, assinatura/legal, recuperação e acessibilidade; homologação clínica e legal é separada de teste técnico. O escopo validado deve ser declarado por vertical e jurisdição.
