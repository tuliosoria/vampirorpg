# vampirorpg — desenho

**Data:** 2026-09-02
**Estado:** sub-projeto 1 em implementação; 2 a 5 por planejar

Um jogo de crônica por turnos ambientado em *Vampiro: A Máscara*, com a mesma
mecânica do jogo de origem (`turnbasedrpg`) e nenhum do seu conteúdo. O site nasce com
estrutura e sem mundo: quem crià Cidade, os clãs e as figuras é o Narrador,
pela interface do Admin.

## Decisões tomadas

**Fork independente.** `vampirorpg` começa como cópia do código do jogo de origem e
segue vida própria. O a Cidade está em campanha ativa e não é tocado. O custo
aceito é que uma correção feita num não chega ao outro.

O histórico do git **não** foi copiado, e nenhuma pasta de cânone veio junto. O
repositório é público, e `cidade-context/MESTRE/` contém o metaplot secreto da
campanha do jogo de origem.

**O jogador controla um vampiro, não um clã.** Ele cria um personagem Kindred e
*escolhe* um clã de uma lista que o Narrador cadastrou. O clã é cenário
compartilhado, não propriedade: vários jogadores podem ser do mesmo. Isso
diverge do jogo de origem, onde o jogador inventava a própria Casa.

**Escopo: tudo.** Todos os subsistemas do jogo de origem vêm junto — correspondência,
pactos, projetos, energia, espionagem, mercado de rumores, NPCs vivos, registro
de fatos, enciclopédia visual.

**Vocabulário.** Casa → Personagem · Reino → Cidade · Coroa → Corte ·
Mestre → Narrador · turno → noite · Grandes Casas → Clãs e Seitas.

**Atributos.** Riqueza → **Sangue** · Recursos → **Influência** ·
Soldados → **Rebanho** · Controle → **Máscara**. Estabilidade → **Humanidade**.
As *chaves* internas continuam as do jogo de origem (`riqueza`, `recursos`…) por ora;
só os rótulos mudaram. A renomeação das chaves é mecânica, atravessa 68
arquivos e não muda nada para quem joga — fica para uma passada própria.

## Arquitetura: cânone compilado, injetado pelas `Deps`

O a Cidade lê conteúdo por `import` de constantes TypeScript, de forma síncrona,
em cerca de 140 arquivos. Tirar o conteúdo dali e pôr no banco é a mudança de
fundo deste projeto.

O Narrador edita fichas no banco. Ao publicar, um passo de compilação gera um
documento único de cânone e o congela. O backend o carrega uma vez e o entrega
via `deps.canon` — o router já costura `Deps` em toda rota, então é o encaixe
natural. O frontend recebe o mesmo documento num boot, como `/api/campaign` já
faz. As funções continuam síncronas e puras.

As alternativas descartadas: **ler do banco a cada request** torna `async` toda
função de leitura de cânone, contaminando prompts, handlers e componentes, por
uma imediatez que o Narrador não precisa; **exportar e commitar** contraria o
objetivo, porque o mundo não seria criado pelo site.

O portão explícito de publicação é um ganho, não um custo: combina com a cultura
de "o Mestre aprova antes de virar verdade" que a Cidade já tem.

### O ponto de costura de hoje

Até o sub-projeto 2 existir, as funções ainda leem de constantes de módulo. Os
testes semeiam um cânone sintético escrevendo dentro dessas constantes
(`shared/src/test/fixtures.ts`, `semearCanon()` / `limparCanon()`). É deliberado
e temporário: é exatamente esse ponto que `deps.canon` substitui.

Duas derivações no carregamento do módulo já foram corrigidas por causa disso —
`CHAVES` em `factExtraction.ts` e `SEAT_TOKENS` em `housePrompt.ts` congelavam
uma lista vazia para sempre. Qualquer código novo que derive de `SEATS`,
`LEADER_PERSONAS` ou afins **precisa** fazê-lo dentro da função, não no topo do
arquivo.

## Os cinco sub-projetos

| # | Sub-projeto | Entrega |
|---|---|---|
| 1 | **Fundação** | Fork limpo, conteúdo do jogo de origem arrancado, vocabulário trocado, tema visual, stack própria e domínio no ar. |
| 2 | **Cânone editável** | As fichas (Cidade, Bairro, Clã, Seita, NPC, Local) no DynamoDB + CRUD no Admin + wiki gerada delas. Substitui `characters.ts`, `geography.ts`, `leaders.ts`, `houseCanon.ts`. |
| 3 | **Bíblia da Crônica + Gerador** | Os princípios que o Narrador define antes de gerar, e o gerador que povoà Cidade a partir deles. |
| 4 | **Religar os sistemas** | Diplomacia, projetos, espionagem e NPCs vivos passam a ler das fichas; prompts reescritos para o tom de Vampiro. |
| 5 | **Enciclopédia visual** | Bíblia de estilo, entidades e geração de retratos. |

A ordem 1→2→3 é obrigatória (o gerador precisa saber em que formato gerar) e
2→4 também. O 5 pode ir por último ou em paralelo.

## Sub-projeto 3: a Bíblia da Crônica

O Narrador preenche os princípios **antes** de a IA gerar qualquer coisa. Sem
eles o gerador produz o conteúdo genérico que é o risco conhecido dessa
abordagem; com eles, escreve a crônica daquele Narrador.

| Campo | Para quê |
|---|---|
| **Cidade** | Nome e cidade real de referência. Ancora bairros, economia e geografia em algo verificável. |
| **Ano de início** | Quando a crônica começa. |
| **Idade dos personagens** | Há quanto tempo os Kindred da corte estão mortos. Define quem lembra do quê. |
| **Atmosfera** | O tom em uma ou duas frases. É o que mais muda a prosa. |
| **Quem manda** | Camarilla firme, Anarquistas no controle, ou disputa aberta. Define a corte e os cargos. |
| **Conspirações ativas** | Uma linha por trama em curso, com quem sabe e quem não sabe. |
| **Guerras ativas** | Conflitos abertos entre clãs, seitas ou com caçadores. |
| **Caçadores** | Ausentes, boato, ou operando de fato. |
| **Limites** | O que a crônica *não* tem — sem lobisomens, sem magos, sem Sabá. Impede que a IA traga metade do World of Darkness. |

A Bíblia da Crônica é um registro só, editável, e passa a ser o cabeçalho de
**todo** prompt de IA do site — não apenas do gerador. É a `WorldBible` do
a Cidade promovida de texto livre para campos estruturados.

## O que o sub-projeto 1 entrega

Conteúdo removido: 3.452 linhas de lore (elenco, geografia, líderes, perfis,
wiki, bíblia do GM, 1.198 linhas de templates de carta), mais 32 scripts de
migração pontual da campanha do jogo de origem e toda a mídia de `public/`.

Motor re-tematizado, não apenas renomeado:

- `geography.ts` perdeu o atlas do reino-ilha e a capital cravada em código;
  distância virou geometria pura sobre um mapa urbano.
- `starterCards.ts` deixou de ser uma tabela de ids escritos à mão e passou a
  casar as palavras da especialidade contra o texto de qualquer catálogo.
- `MERCADORIAS` (o que um clã quer do outro) trocou grão, ferro e madeira por
  sangue, silêncio, informação, dinheiro, influência, documentos, músculo,
  refúgio, carniçais e território.
- O mercado de rumores saiu do Porto Cinzento para a rua.
- As 23 seções da wiki foram reescritas parà Cidade; a seção de regras de
  D&D 5.5 e a atribuição do SRD saíram junto com o guia.
- Os títulos da corte (Príncipe, Primogênita, Xerife, Senescal, Arauto) entraram
  no detector de menções, que antes só conhecia títulos de nobreza medieval.

## Fora deste desenho

- **Renomear as chaves internas** (`House` → `Personagem`, `houseId`,
  `riqueza`…). Mecânico, invisível ao jogador, e melhor feito num commit próprio.
- **Deploy.** Precisa da conta AWS, de uma stack SAM própria e do DNS de
  `vampirorpg.com`.

## Aviso

*Vampire: The Masquerade* é propriedade da Paradox/White Wolf. Num domínio
público isso pesa diferente de uma campanha privada — a Dark Pack tem regras de
uso não-comercial que valem a leitura antes do lançamento.
