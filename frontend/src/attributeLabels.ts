import type { AttributeKey } from "@vampiro/content";

/**
 * O que o jogador lê no lugar de cada atributo.
 *
 * As chaves ainda são as da Cidade; os rótulos já são os da Cidade. Trocar as
 * chaves é uma passada mecânica sobre 68 arquivos e não muda nada para quem
 * joga, então ficou separada — mas quem mexer aqui deve saber que
 * `riqueza` significa Sangue, e não riqueza.
 */
export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  riqueza: "Sangue",
  recursos: "Influência",
  soldados: "Rebanho",
  controle: "Máscara",
};
