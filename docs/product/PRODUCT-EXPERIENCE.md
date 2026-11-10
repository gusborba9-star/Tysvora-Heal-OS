# Product Experience — Institution, Patient & Field

## 1. Princípio

Três experiências sobre a mesma plataforma e identidade, com contexto, permissões e objetivos distintos. Não são três produtos independentes.

## 2. Tysvora Institution

Workspace de instituição, rede, clínica ou serviço público. Deve permitir administrar organizações/unidades/equipes, programas, inscrições, jornadas, atendimentos, contexto longitudinal autorizado, filas, manifestações, tarefas, comunicação, encaminhamentos, indicadores, integrações e configuração.

## 3. Unified Care Workspace

Ao abrir um sujeito/ocorrência, mostrar:
1. identificação, vínculo e contexto institucional;
2. histórico relevante e fonte/data;
3. estado atual, manifestação e prioridade;
4. plano e ordens vigentes;
5. tarefas e ações autorizadas;
6. responsável, prazo e trilha.

Exibir apenas o necessário à finalidade e ao perfil. Não substituir o prontuário de origem nem agregar tudo indiscriminadamente.

## 4. Tysvora Patient

Uma identidade de acesso com vários contextos institucionais segregados. O paciente pode receber planos, orientações, mensagens, documentos, tarefas de acompanhamento e participar de programas. Deve diferenciar mensagem, orientação profissional, prescrição válida, alerta e confirmação.

## 5. Convite e ativação

Instituição inicia convite vinculado a sujeito, organização, contexto e escopo. Usuário valida identidade com método proporcional ao risco, recebe transparência e concede permissões/consentimentos quando aplicáveis. Convite não concede acesso automático irrestrito. Deve haver expiração, revogação e recuperação segura.

## 6. Tysvora Field

Interface para equipes externas: agenda, tarefas, competência, território, rotas, navegação, check-in/out, evidência, formulários, sincronização e encerramento. Acesso mínimo e proteção de dados no dispositivo; offline apenas com política e criptografia.

## 7. Acessibilidade e experiência

Mobile-first onde adequado, acessibilidade, linguagem clara, baixo consumo de dados, suporte a conectividade limitada, estados de sincronização e confirmação inequívoca de ações. Não esconder falhas de envio/sincronização.

 
## 8. Institutional Workspace Premium

Painel central da instituição, rede, clínica ou serviço público para administrar e operar sua estrutura dentro do tenant e dos escopos autorizados. Deve consolidar organizações/unidades, equipes, profissionais, pacientes vinculados, programas, jornadas, filas, manifestações, tarefas, comunicação, encaminhamentos, visitas, integrações/Easy Connect, importações, indicadores, capacidade, configurações e auditoria.

A visão é abrangente dentro da finalidade, organização, unidade, equipe e papel do usuário. Não equivale a acesso irrestrito a todo conteúdo clínico. Dados sensíveis devem ser filtrados por necessidade e contexto, com fonte e atualização visíveis quando relevantes.

## 9. Tysvora Professional

Experiência própria do profissional, distinta do painel administrativo institucional. Inclui agenda e atribuições, pacientes/CareSubjects autorizados, Unified Care Workspace, manifestações, planos e documentos vigentes, decisões, orientações, ordens/prescrições dentro do escopo legal, tarefas, comunicação e acompanhamento. Acesso depende de habilitação, vínculo, papel, unidade, finalidade e relação de cuidado.

## 10. Tysvora Control Center — administração interna da plataforma

Painel privilegiado da equipe Tysvora para tenants, organizações contratantes, planos/direitos, módulos, versões, Connector Registry, homologação de adapters, saúde operacional, releases, ambientes, incidentes, suporte, telemetria, billing e políticas globais.

Superadmin da plataforma não é superusuário clínico universal. Por padrão, o Control Center acessa metadados, configurações, status e telemetria minimizada. Acesso excepcional a conteúdo de cliente exige ticket/finalidade, autorização, escopo mínimo, duração limitada, justificativa, registro auditável e revisão posterior. Suporte não pode impersonar profissional ou paciente sem fluxo formal e visível.

## 11. Onboarding institucional, Easy Connect e Universal Data Intake

A instituição deve conseguir iniciar sem integração externa: configurar estrutura e papéis, convidar usuários, cadastrar dados manualmente e importar arquivos. Depois pode conectar API, banco, CRM/ERP, transferência segura ou Connector Agent. O fluxo Easy Connect orienta seleção da fonte, autenticação/pareamento, discovery, escolha de recursos, mapping sugerido, preview, validação, aprovação e monitoramento.

O Connector Agent é instalado em máquina/servidor institucional autorizado; o navegador administra, mas não acessa arbitrariamente redes privadas. Upload deve oferecer preview, validação, quarentena, detecção de duplicidade, mapping assistido, aprovação, relatório de erros e lineage. Extração/OCR pode sugerir conteúdo, mas dados clínicos extraídos exigem validação apropriada antes de se tornarem registros ativos.


## 12. Tysvora como sistema principal ou integrado

Cada instituição escolhe um modo de operação, podendo combinar capacidades:
- **Sistema principal:** utiliza o Clinical Record Core nativo para cadastro assistencial, atendimentos, evoluções, planos, ordens/documentos, comunicação, programas, acompanhamento e auditoria dentro do escopo contratado.
- **Plataforma integrada:** mantém seus sistemas existentes e utiliza UIP, Unified Care Workspace, comunicação, continuidade, tarefas, programas e operações do Tysvora.
- **Híbrido:** mantém sistemas externos para domínios específicos e utiliza capacidades nativas do Tysvora onde houver lacuna, com fonte de verdade e autoridade por atributo explícitas.

Onboarding não deve exigir integração externa. Cadastro manual e importação governada são caminhos de primeira classe. A afirmação de que Tysvora substitui integralmente um EHR/ERP depende de escopo funcional, validação clínica/legal e homologação; não é promessa genérica.

## 13. Chat bidirecional e documentos

O chat permite que paciente e profissional autorizado enviem e recebam mensagens e anexos. A conversa deve manter contexto de instituição, vínculo e, quando aplicável, atendimento, programa, plano ou ocorrência. Deve oferecer estados de envio/entrega, notificações, histórico, permissões, limites e auditoria.

Arquivos permitidos incluem imagens, PDFs e documentos. Prescrições, atestados, laudos, resultados, solicitações, encaminhamentos e orientações devem ser classificados e geridos pelo Clinical Document Management, com autoria, integridade, versão, status, assinatura válida quando exigida e vínculo contextual. Não tratar documento clínico como simples arquivo sem metadados.

Áudio não integra o padrão inicial do chat. Pode existir como capacidade opcional, desabilitada por padrão, habilitável pelo Control Center e, quando liberada, sujeita a opt-in/controle do administrador institucional. Deve ter limites de tamanho/duração, políticas de retenção, segurança, acessibilidade e medição de custos. Transcrição/IA é capacidade separada e não vem incluída automaticamente. Desabilitar áudio impede novos envios, sem apagar conteúdo previamente retido conforme política.

## 14. Preferências de comunicação e ciclo de vida do vínculo

No perfil/contexto do paciente, o profissional autorizado pode silenciar notificações comuns, configurar preferências permitidas, encaminhar conversas à equipe e iniciar encerramento/transferência de vínculo.

Silenciar não bloqueia mensagens recebidas pela instituição, não apaga histórico e não suprime alertas críticos definidos pela política institucional. O paciente deve ter canais e instruções claros para urgências e solicitações formais.

Encerramento de vínculo exige motivo, autoria, escopo, data, revisão conforme política, comunicação e plano de transição quando necessário. Encerra a relação definida, não a identidade da pessoa nem seu prontuário. Não pode ser usado para abandono, retaliação ou supressão de direitos. Acesso a documentos e retenção seguem legislação, contrato e política institucional.
