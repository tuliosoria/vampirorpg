import type {
  Bairro, BairroPublico, Cidade, CidadePublica, Conto, ContoPublico,
  Local, LocalPublico, Personagem, PersonagemPublico, Trama, TramaPublica,
} from "./modelos.js";

/**
 * A fronteira entre o que o Narrador vê e o que sai para o jogador.
 *
 * Este é o único lugar autorizado a fazer a travessia. Toda rota pública devolve
 * o resultado de uma função daqui, e nunca a entidade crua — o tipo de retorno
 * não tem os campos secretos, então tentar devolver o objeto inteiro não
 * compila.
 *
 * O descarte é por desestruturação, e não por lista de campos permitidos: uma
 * lista aceitaria em silêncio um campo secreto acrescentado seis meses depois,
 * que é exatamente como um segredo vaza.
 *
 * A conversão para o tipo marcado acontece aqui, e só aqui. É a única mentira
 * que o arquivo conta ao compilador, e ela é o que faz a marca valer alguma
 * coisa em todo o resto do sistema.
 */

export function cidadeParaJogador(c: Cidade): CidadePublica {
  const { segredos: _segredos, ...publico } = c;
  return publico as CidadePublica;
}

export function bairroParaJogador(b: Bairro): BairroPublico {
  const { segredos: _segredos, ...publico } = b;
  return publico as BairroPublico;
}

export function personagemParaJogador(p: Personagem): PersonagemPublico {
  const { poder: _poder, objetivos: _objetivos, relacoes: _relacoes, ...publico } = p;
  return publico as PersonagemPublico;
}

export function localParaJogador(l: Local): LocalPublico {
  const { segredos: _segredos, ...publico } = l;
  return publico as LocalPublico;
}

export function tramaParaJogador(t: Trama): TramaPublica {
  const { verdadeDoMestre: _v, personagens: _p, localIds: _l, ...publico } = t;
  return publico as TramaPublica;
}

/**
 * As tramas que os jogadores podem sequer saber que existem.
 *
 * Filtrar ANTES de projetar, e não depois: uma conspiração invisível não pode
 * aparecer numa lista com o nome à mostra, mesmo sem a verdade junto. O nome de
 * uma trama já é meio caminho do enredo.
 */
export function tramasParaJogador(tramas: Trama[]): TramaPublica[] {
  return tramas.filter((t) => t.visivel).map(tramaParaJogador);
}

/** Um conto marcado como do Mestre não sai pela metade: não sai. */
export function contosParaJogador(contos: Conto[]): ContoPublico[] {
  return contos.filter((c) => c.visibilidade === "PUBLICO") as ContoPublico[];
}
