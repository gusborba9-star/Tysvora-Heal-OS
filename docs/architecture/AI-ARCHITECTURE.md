# Tysvora Heal OS — Governed AI Architecture

## 1. Papel

AI Gateway é uma capacidade transversal opcional. Nenhum domínio depende diretamente de provedor/modelo. IA não é autoridade clínica, regulatória ou operacional autônoma.

## 2. Pipeline

Use case → policy/pre-check → minimização/context assembly → provider/model routing → output schema validation → safety/post-check → human review when required → audit/metrics.

## 3. Separação

Deterministic Rules, Calculation Engine, Protocol Engine, workflow policies and AI são componentes distintos. Usar método determinístico quando suficiente. IA pode resumir, extrair, classificar ou sugerir dentro de escopo aprovado.

## 4. Governança

Catálogo de casos de uso e risco, modelos/provedores aprovados, prompt/version control, avaliação contínua, dataset governance, bias testing, red-team, drift monitoring, fallback seguro, limites de custo e revisão humana.

## 5. Dados

Minimização e finalidade; não enviar prontuário inteiro por conveniência. Avaliar retenção do fornecedor, localização, subprocessadores, treinamento, criptografia e contrato. Cache isolado por tenant/subject e somente quando seguro.

## 6. Segurança

Tratar documentos, mensagens e dados externos como conteúdo não confiável; resistir a prompt injection, data exfiltration e tool misuse. Ferramentas têm permissões mínimas e ações externas exigem confirmação/autoridade.

## 7. Supervisão

Prescrição, diagnóstico, mudança de tratamento, triagem clínica crítica e encerramento de risco não são executados autonomamente pela IA. Saída deve indicar incerteza, fonte e limites; profissional habilitado decide.

## 8. Observabilidade

Registrar caso de uso, versão, modelo, policy decision, latência, custo, validação, revisão humana e resultado sem reter conteúdo sensível desnecessariamente.

## 9. Avaliação

Métricas por tarefa: precisão, recall, calibração, taxa de abstenção, erro crítico, disparidade, custo e tempo. Bloquear release se limites de segurança não forem atendidos.
