/**
 * As Histórias Contadas: verbetes da crônica narrados em áudio.
 *
 * Nasce vazia. As narrações que viviam aqui eram de outra campanha, num bucket
 * que não é o desta — deixá-las seria servir a história de outro mundo com o
 * nome deste. Quem grava as da Cidade é o Narrador; a lista é curada à mão até
 * serem muitas o bastante para virar um registro no banco.
 */
export interface HistoriaContada {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  /** Narrador, para alternarmos as vozes entre uma história e outra. */
  voice: string;
  /** Verbete de origem na Enciclopédia, quando houver. */
  section?: string;
  /** Duração aproximada, para o ouvinte saber no que está entrando. */
  duration?: string;
}

export const HISTORIAS: HistoriaContada[] = [];
