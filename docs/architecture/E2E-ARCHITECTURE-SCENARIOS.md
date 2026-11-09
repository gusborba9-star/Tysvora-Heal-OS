# End-to-End Architecture Scenarios

**Status:** cenários de arquitetura para modelagem e homologação futura; não são testes executados.

## Regras de leitura
- Todo ator opera em tenant e contexto institucional explícitos.
- Todo dado relevante mostra fonte, autoria e temporalidade.
- Toda ação sensível aplica autorização no servidor e registra auditoria.
- Mensagens, relatos, alertas, decisões, ordens e tarefas são tipos distintos.
- Nenhum cenário autoriza diagnóstico, prescrição ou triagem clínica autônoma.

## E2E-01 — Nutrição e revisão de plano
1. Instituição cria relação assistencial e convite limitado para a pessoa.
2. Pessoa valida identidade e acessa apenas o contexto autorizado.
3. Nutricionista registra atendimento e publica CarePlanVersion V1.
4. Pessoa relata dificuldade; relato referencia sujeito, plano V1 e contexto temporal.
5. Intake classifica a natureza da entrada e encaminha à fila responsável; não decide tratamento.
6. Profissional revisa contexto autorizado e registra decisão/orientação.
7. Se houver mudança, cria CarePlanVersion V2 com autoria, motivo e vigência; V1 permanece histórica.
8. Patient recebe orientação e confirma recebimento; confirmação não prova adesão.
9. Auditoria permite reconstruir o ciclo.

## E2E-02 — Medicina, ordem e prescrição
1. Atendimento gera Encounter e avaliação profissional.
2. Médico emite CareOrder/Prescription por mecanismo juridicamente válido.
3. Documento guarda autor, registro profissional, paciente, conteúdo, assinatura verificável, integridade, validade e status.
4. Paciente relata persistência de sintoma associado à ordem e atendimento corretos.
5. Sistema encaminha ao profissional responsável segundo política institucional e SLA.
6. Médico avalia dados e decide; Tysvora não recomenda aumento automático de dose.
7. Nova prescrição é novo documento/versão; anterior recebe estado apropriado e continua auditável.
8. Entrega, falha de entrega, revogação e substituição são estados explícitos.

## E2E-03 — UBS, programa e visita
1. CareSubject possui ProgramEnrollment ativo em programa de tabagismo.
2. Relato de recaída entra por canal autorizado e referencia inscrição e unidade.
3. Workspace apresenta apenas histórico necessário, fonte, data, equipe e contato autorizado.
4. Profissional define prioridade e ação; eventual classificação automatizada é apoio não decisório.
5. Mensagem enviada ao cidadão registra canal, entrega e confirmação separadamente.
6. Confirmação de disponibilidade pode criar solicitação de visita.
7. Profissional/equipe autorizada valida modalidade, prioridade e necessidade; Workflow cria CareTask idempotente.
8. Field Operations atribui por competência, território, disponibilidade e carga.
9. Equipe registra tentativa, execução, resultado e encaminhamento; falha cria próximo passo.
10. Encerramento da visita não encerra automaticamente o programa ou cuidado.

## E2E-04 — Programas simultâneos
Uma pessoa participa de diabetes, hipertensão e tabagismo. Cada inscrição aponta para ProgramVersion, unidade/equipe, finalidade e escopo. Profissional de um programa não recebe acesso irrestrito aos demais. Compartilhamento de contexto mínimo requer política explícita e auditoria.

## E2E-05 — Multi-instituição
Pessoa possui vínculo com clínica A e UBS B. Sessão e workspace indicam o contexto ativo. Não há leitura cruzada por coincidência de identidade. Compartilhamento pontual exige base legal, finalidade, autorização, escopo, validade e trilha de acesso.

## E2E-06 — Veterinária
CareSubject representa animal; Person representa tutor; Guardian registra delegação e escopo. Dados clínicos do animal usam modelos e protocolos veterinários. Não inferir que terminologias, prescrições ou regras humanas se aplicam à veterinária.

## E2E-07 — Integração e reconciliação
Conector recebe atualização externa e preserva payload bruto em área controlada, metadados e versão do mapeamento. Validação separa válido/inválido; matching segue política; divergência gera conflito. Regra de autoridade por atributo decide atualização automática permitida ou revisão humana. Reprocessamento não duplica eventos nem documentos.

## E2E-08 — Campo e capacidade
Tarefa aprovada entra na fila de campo. Motor sugere alocação respeitando competência, território, janela, carga, equipamento e prioridade profissional. Profissional pode aceitar/rejeitar com motivo. App Field usa dados mínimos, registra sincronização e resultado; offline só após política e threat model. Indicadores não expõem dados além da finalidade.
