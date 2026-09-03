# Estúdio narrativo — desenho

**Data:** 2026-09-03
**Entrega 1 de 4:** fundação e segredo

O Estúdio passa a ser o painel editorial do Narrador: onde a cosmologia da
crônica é escrita, relacionada e mantida. Substitui as seções espalhadas de
hoje — Bíblia, Canônico, Registro e a ficha de Clã — por sete entidades com
relações entre si.

## O que isto não é

O "Estúdio" de hoje é um gerador de imagens: prompt, entidade visual, cânone de
aparência. Ele não some — muda de nome para **Imagens** e sai do caminho. O nome
Estúdio passa para o editor narrativo, que é o que a palavra descreve.

## Decisões tomadas

**Substitui, não convive.** Um lugar por coisa. Escrever a mesma personagem em
dois formulários diferentes é como o cânone de uma crônica se contradiz.

**Clã e Personagem são ambos entidades.** A spec original tratava Clã como um
campo de texto dentro de Personagem. O motor faz o contrário: o clã é o ponto no
mapa, o remetente de carta, o nó de distância, o dono da escassez. Seguir a spec
ao pé da letra teria matado o mapa e a diplomacia.

A conciliação: o clã guarda o que é do clã (domínio, coordenada, escassez), e o
personagem aponta para um clã. **O elenco de um clã passa a ser derivado** — são
os personagens que apontam para ele — e o líder também, pelo personagem marcado
como quem responde. Nada é digitado duas vezes.

**Uma entidade, duas projeções.** O segredo não é um `if` na tela.

## O segredo, e por que assim

`/api/cla` é público e devolve a ficha inteira. No instante em que um campo
secreto entrasse nela, vazaria para quem abrisse a URL — sem erro, sem aviso.

Cada entidade guarda tudo junto no banco e é projetada por duas funções puras:

- `paraNarrador(x)` devolve o objeto inteiro.
- `paraJogador(x)` devolve um tipo **mais estreito**, que não tem os campos
  secretos.

O ganho está no tipo, não na função: `PersonagemPublico` não declara `poder`,
`objetivos` nem `relacoes`. Uma rota pública que tentasse devolver o objeto
completo não compila. Esquecer de filtrar deixa de ser um vazamento em produção
e passa a ser um erro de build.

Alternativas descartadas: **duas tabelas** torna o vazamento impossível mas faz
toda leitura do Narrador virar duas consultas e um merge, e deixa segredo órfão
quando a entidade some; **filtrar campo a campo na rota** é o que a maioria faz,
e é exatamente como todo vazamento acontece — alguém adiciona um campo seis
meses depois e esquece de uma rota.

Uma varredura de teste popula toda entidade com segredos reconhecíveis, chama
`paraJogador` e falha se qualquer um deles aparecer no JSON resultante. É o
teste que sobrevive a campos futuros.

## As sete entidades

`Cidade` é registro único; as outras seis são coleções.

| Entidade | Público | Só o Narrador |
|---|---|---|
| **Cidade** | nome, descrição | segredos |
| **Bairro** | nome, descrição, atmosfera | segredos |
| **Clã** | nome, refúgio, coordenada, perfil, dossiê | segredos |
| **Personagem** | nome, história, tipo, clã | poder, objetivos, relações |
| **Local** | nome, bairro, descrição | segredos |
| **Trama** | nome, importância, status, descrição pública | verdade do Mestre, elenco, locais |
| **Conto** | título, história, tipo, período | o conto inteiro, quando marcado Só Mestre |

A Trama tem dois níveis: quando `visivel` é falso, **nem a descrição pública
sai** — a trama inteira desaparece das rotas de jogador, e não apenas a verdade.

## Como o motor continua alimentado

`aplicarCanon` deixa de ler o elenco de dentro da ficha de clã e passa a montá-lo
a partir dos personagens:

- `SEATS` ← os clãs, com coordenada e refúgio.
- `LEADER_PERSONAS` ← o personagem marcado como líder de cada clã, com sua voz.
- `HOUSE_CHARACTERS` ← os personagens agrupados por clã.
- `HOUSE_PROFILE` e `HOUSE_CANON` ← o perfil e o dossiê do clã.

Como hoje, aplicar substitui o cânone inteiro: um personagem apagado precisa
sumir da lista de destinatários, e acumular deixaria fantasmas recebendo carta.

## Fora desta entrega

- **Revisar com IA** e o diff lado a lado (entrega 2).
- **Busca global, dashboard e relações M:N com papéis** (entrega 3). Nesta
  entrega os vínculos existem como listas de id; a interface rica vem depois.
- **Histórico de versões e autosave** (entrega 4).
- **Migrar o que já está escrito** na Bíblia e no Canônico. A wiki continua
  servindo a enciclopédia pública enquanto os Contos não a substituem; ripar as
  duas no mesmo passo em que sete entidades nascem é como se perde conteúdo.

## Critérios de aceite desta entrega

Da lista original: 1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14, 16, 26.

O que os prova: um teste que cadastra uma cosmologia inteira, chama toda rota
pública e falha se um segredo aparecer; e um teste que cadastra um clã com
personagem-líder e confirma que ele vira destinatário de carta sem passo extra.
