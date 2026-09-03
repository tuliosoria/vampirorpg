# vampirorpg

Um jogo de crônica por turnos ambientado em *Vampiro: A Máscara*.

Cada jogador conduz um vampiro na mesma Cidade. A cada noite lê o que a Cidade
viu e o que só ele sabe, escreve o que faz em texto livre, e o Narrador resolve.

O site nasce **sem mundo**. Não há clã, bairro, personagem ou carta versionados
em código: quem cria a Cidade é o Narrador, pela interface do Admin. O que está
aqui é a máquina — turnos, correspondência, pactos, empreitadas, espionagem,
mercado de rumores, NPCs vivos e enciclopédia visual — mais o esqueleto de
cânone que ele preenche.

## Como rodar

```
npm install
npm run dev            # frontend em modo mock, sem backend
npm test               # shared + backend + frontend
npm run build          # build de produção do frontend
npm run build:backend  # bundle das Lambdas
```

## Estrutura

- `shared/` — o domínio, importado pelos dois lados. Tipos, motor de
  empreitadas, energia, diplomacia, espionagem, cânone e o modelo visual.
- `backend/` — uma Lambda atrás de um router próprio, mais um worker de imagens.
  DynamoDB em tabela única, S3 para o acervo, OpenAI para texto e imagem.
- `frontend/` — React + Vite + MUI.
- `docs/superpowers/specs/` — o desenho, e por que cada decisão foi tomada.

## Onde o cânone entra

O motor lê o cânone de constantes de módulo que **nascem vazias**
(`SEATS`, `LEADER_PERSONAS`, `HOUSE_CHARACTERS`, `DEFAULT_WIKI_ENTRIES`,
`DEFAULT_PROJECT_TEMPLATES`). Os testes as semeiam com um cânone sintético via
`@vampiro/content/test-fixtures`.

Isso é temporário e está desenhado para sair: o sub-projeto do cânone editável
troca essas constantes por um documento de cânone injetado pelas `Deps`. Até lá,
**qualquer código que derive de uma delas precisa fazê-lo dentro da função** —
derivar no topo do arquivo congela uma lista vazia para sempre.

## Aviso

*Vampire: The Masquerade* é propriedade da Paradox/White Wolf. Este é um projeto
não-comercial de mesa; leia as regras da Dark Pack antes de publicar.
