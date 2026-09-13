# vampirorpg — instruções do projeto

Crônica por turnos em **Vampiro: A Máscara**. Cada jogador conduz um vampiro na
mesma Cidade; a cada noite lê o que a Cidade viu e o que só ele sabe, escreve em
texto livre, e o Narrador resolve. Monorepo TypeScript: `shared`
(`@vampiro/content`) · `backend` (Lambda + SAM + DynamoDB) · `frontend` (React +
Vite + MUI). **Interface e ficção em português.**

- Amplify `d3co8wcisz2isc` · stack SAM `vampirorpg` · tabela `vampirorpg-game`
- API: `https://ydbfudws0i.execute-api.us-east-1.amazonaws.com` · região `us-east-1`
- O site **nasce sem mundo**: clã, bairro, personagem e carta não são versionados.

## Antes de mexer

- **`vitest` não faz typecheck.** Rode `tsc --noEmit` nos três pacotes, sempre.
- **Mudou `shared`? Rode `npm run build:shared`** antes de o backend ver o símbolo novo.
- Deploy é **manual e em dois passos** — veja a skill `deploy`.
- Segredos nunca vão para arquivo nem commit. Puxe da config da Lambda em memória.

## As cartas

```
escritor (1 chamada) → revisor (1 chamada) → grava
```

| Módulo | Papel |
|---|---|
| `ai/diplomacy/housePrompt.ts` | Prompt de RESPOSTA a carta de jogador. |
| `ai/diplomacy/outreachPrompt.ts` | Prompt da carta PROATIVA. |
| `ai/diplomacy/revisor.ts` | Segunda leitura, com o MESMO material do escritor. |
| `ai/diplomacy/estagio.ts` · `leitura.ts` · `voice.ts` · `escala.ts` | Regras compartilhadas pelos dois prompts. |
| `ai/diplomacy/dossie.ts` · `estado.ts` | Portados e prontos, **ainda não ligados** — veja "o que falta". |

### Regras que o sistema garante

- **O revisor falha para o lado seguro.** Vazio, JSON quebrado ou carta truncada
  e vale o rascunho. Ele pode melhorar uma carta; nunca fazê-la sumir.
- **`troca` é opcional.** Carta de aviso ou ameaça tem `troca: null`, e isso é o
  certo. Quando era obrigatório, toda carta virava nota de mercadoria.

### A armadilha principal: regra acumula

Este pipeline nasceu do projeto irmão (Valdren), onde quebrou **quatro vezes pelo
mesmo motivo** — alguém somou uma regra para consertar uma falha, e a soma das
regras virou um formulário:

```
carta vazia  → "toda carta precisa de movimento concreto"
             → tudo virou escambo
             → "seja concreto no que o assunto pedir"
             → prazo em 17 de 18 cartas
             → o jogador disse que parecia robô

carta melosa → "cordial não é o padrão"
             → todo o cenário virou o mesmo diplomata rancoroso
```

**Antes de somar regra, tente tirar.** E se a regra é fiscalização — "isto não pode
faltar" — ela pertence ao **revisor**, que lê a carta pronta, e não ao escritor,
que só consegue adivinhar antes de existir texto.

Use a skill `mexer-em-prompt-de-carta`: ela obriga medir antes e depois.

### Modelos e tetos

- **Tokens de raciocínio saem do MESMO orçamento da resposta.** Teto baixo devolve
  **string vazia**, não erro. A carta proativa já esteve em 900 e voltava vazia em
  3 de 3 chamadas. Piso: 2200, sempre com uma repetição — vazio é aleatório.
- Timeout do cliente: **180s** para modelo de raciocínio. Uma carta leva de 25 a
  70 segundos; 60s cortava as mais pensadas e o erro chegava como "Falha ao
  contatar a IA", que parece rede e é relógio.
- **Nada de IA na requisição do gateway: são 30s.** Use worker, como o visual já faz.

## O que falta, e por quê

Estas peças vieram do projeto irmão mas **ainda não estão ligadas**. Cada uma
depende de um passo anterior:

1. **A resposta a carta ainda é gerada dentro da requisição**, com Lambda de 30s.
   Enquanto for assim, ela não pode ter revisor — seriam duas chamadas de até 70s
   cada. O conserto é o mesmo do visual: extrair para um worker de 900s e disparar
   com `InvocationType: "Event"`.
2. **`dossie.ts` está portado e não é usado.** Ele monta o fio completo entre as
   duas partes. Sem ele, a carta proativa escreve para quem já conhece há turnos
   sem ver uma linha da conversa.
3. **`estado.ts` está portado e não é usado.** Traz humor, medo, o que a pessoa
   recusa e quantas cartas mandou sem resposta. É o que separa uma carta de
   pessoa de uma carta de chancelaria.
