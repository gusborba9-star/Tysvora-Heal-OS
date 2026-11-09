# Data Provenance, Lineage & Reconciliation

## 1. Regra

Todo dado externo ou derivado relevante deve permitir responder: de onde veio, quem o produziu, quando ocorreu, quando foi recebido, como foi transformado, qual versão do mapeamento foi aplicada e se existe conflito.

## 2. Metadados mínimos

source_system, source_record_id, source_tenant/organization, source_timestamp, observed_at, ingested_at, actor/source identity, extraction method, connector/version, mapping version, transformation history, validation status, quality/confidence, sync status, correlation and consent/legal-purpose context where applicable.

## 3. Tempo

Separar event time, record time, ingestion time e valid/effective time. Não substituir timestamp da fonte pelo horário de ingestão.

## 4. Autoridade por atributo

Definir fonte preferencial por domínio/atributo e contexto. Não presumir que um EHR ou Tysvora é autoridade para todos os campos. Conflitos são explicitados e encaminhados para regra ou revisão.

## 5. Correções

Correção gera novo registro/versão com referência ao anterior, autor, motivo e horário. Dados clínicos históricos não são sobrescritos silenciosamente.

## 6. Qualidade

Validar completude, formato, terminologia, consistência temporal, duplicidade e plausibilidade. Qualidade baixa deve ser marcada; não inventar valores faltantes.

## 7. Exposição

UI mostra fonte e atualização em informação relevante. Analytics carrega lineage, definição e qualidade; métricas não devem ocultar dados faltantes.
