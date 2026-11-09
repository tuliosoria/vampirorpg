# Proteções de autenticação e chamadas de IA

## Entrega e estado de ativação

Esta alteração adiciona limites persistentes de login e uma cota técnica global de cinco imagens de cadastro por campanha a cada janela de 24 horas. O cadastro continua possível sem imagem. Os contadores usam DynamoDB, portanto sobrevivem a instâncias Lambda diferentes. O IP vem de `requestContext.http.sourceIp`, não de um cabeçalho enviado pelo cliente. O login limita tentativas por IP e globalmente por campanha, com janelas de um minuto e sem bloqueio permanente de uma conta vítima. Contadores fixos permitem uma rajada próxima da troca da janela; não substituem WAF ou defesa contra DDoS distribuído.

O orçamento monetário é **opcional e permanece desativado**. Não foi definido nenhum valor para este projeto. Não houve deploy, mudança de credenciais, IAM, segurança da conta ou rotação de chaves.

## Reserva de custo antes do provedor

Todas as fábricas centrais de chat, geração e edição de imagens consultam a mesma proteção quando ativada. Inclui API, workers, chamadas de administrador e scripts que usam essas fábricas. O DynamoDB faz uma atualização condicional atômica no item `AI_BUDGET#<escopo> / MONTH#AAAA-MM`, usando mês UTC. Não há um item crescente por chamada. Prompts, chaves e referências não são gravados nesse item.

A política reserva antecipadamente um valor inteiro e conservador por operação. Erros, timeouts e novas tentativas não devolvem essa reserva: o provedor pode ter processado uma solicitação cuja resposta não chegou. O SDK já usa zero retries automáticos. Indisponibilidade do ledger, configuração incompleta, modelo não precificado ou entrada acima dos limites falham antes da chamada paga. Administradores não têm exceção.

## Rollout, somente depois de aprovação

1. O proprietário deve escolher o teto mensal deste projeto. Não reutilizar automaticamente o valor de outro projeto.
2. Conferir no provedor o preço e a cobrança de cada modelo exato em uso. Preparar `AI_BUDGET_POLICY_JSON` com:
   - `chat`: objeto por ID exato do modelo, cada regra com `reserveMicros`, `maxInputBytes` e `maxOutputTokens` inteiros positivos;
   - `images`: lista de regras com `model`, `size`, `quality`, `inputFidelity` (ou ausente), `reserveMicros`, `maxPromptBytes`, `maxReferenceBytes` e `maxReferences`.
3. Cada `reserveMicros` precisa cobrir o pior caso permitido daquela solicitação, incluindo tokens de raciocínio, entrada, saída e imagens de referência quando aplicável. Validar essa conta independentemente. Os limites de bytes restringem a entrada, mas não calculam tokens ou a fatura automaticamente. Novos modelos ou preços exigem revisão. Regras de imagem devem cobrir geração e edição, usando o custo maior quando compartilham parâmetros.
4. Aprovar os limites de saída: ao ativar, uma chamada antes ilimitada recebe `maxOutputTokens`; um teto explícito acima do aprovado é recusado, não truncado silenciosamente. Testar resoluções longas de turno antes de produção.
5. Configurar os quatro parâmetros SAM em **todas** as funções: `AiBudgetEnabled=true`, `AiBudgetMonthlyMicros`, `AiBudgetScope` e `AiBudgetPolicyJson`. Um USD equivale a 1.000.000 micros. Deixar desativado até que os valores sejam aprovados. Scripts precisam das mesmas variáveis, tabela e escopo.
6. Confirmar que a role já autorizada pode executar `dynamodb:UpdateItem` na tabela. Não ampliar IAM automaticamente. Fazer teste em staging com saldo próximo do limite, chamadas concorrentes, timeout, troca de mês e indisponibilidade do DynamoDB. Verificar que nenhuma chamada ao provedor ocorre após a recusa.
7. Separar a chave/projeto OpenAI dos outros aplicativos e ativar alertas no provedor com aprovação. Conferir fatura real versus reservas e alertar antes de 80%/90% do limite. Não apagar o ledger, trocar o escopo, reduzir reservas nem reprocessar chamadas incertas para liberar saldo.

## Limitações

O limite aplica-se às reservas deste código e depende de uma política conservadora correta. Não garante a fatura total do provedor: uso da chave fora dessas fábricas, funções com configuração divergente, alterações de preços ou reservas insuficientes ficam fora dessa garantia. A cota técnica de cadastro não é um teto em dólares. O orçamento desativado não oferece contenção monetária global até o rollout aprovado.

Testes automatizados cobrem concorrência lógica entre instâncias no limite do DynamoDB, falha fechada, parâmetros não precificados, troca de mês, ordem reserva/provedor e ausência de reembolso após timeout. A validação remota em DynamoDB/AWS e a revisão de preços continuam obrigatórias antes de ativar.
