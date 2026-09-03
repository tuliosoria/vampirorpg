import { describe, it, expect } from "vitest";
import { DEFAULT_PROJECT_TEMPLATES } from "./projectTemplates.js";
import { auditarCarta } from "./projectBalance.js";
import { CARTAS_DO_PORTO } from "./porto.js";

describe("a biblioteca respeita o trato", () => {
  it("nenhuma carta foge da sua faixa", () => {
    const ruins = DEFAULT_PROJECT_TEMPLATES
      .map((t) => ({ id: t.id, problemas: auditarCarta(t) }))
      .filter((r) => r.problemas.length > 0);
    const relatorio = ruins.map((r) => `  ${r.id}: ${r.problemas.join("; ")}`).join("\n");
    expect(relatorio).toBe("");
  });

  it("toda carta concede alguma coisa", () => {
    const mudas = DEFAULT_PROJECT_TEMPLATES.filter((t) => {
      const e = t.completionEffects;
      if (t.pagamentoNarrativo?.trim()) return false;
      return !e.attributeChanges.length && !e.favors.length && !e.assets.length && !e.unlocks.length;
    });
    expect(mudas.map((t) => t.id)).toEqual([]);
  });

  /**
   * O pagamento narrativo é auto-declarado: nada no motor confere que a frase
   * seja verdade. Então toda carta que promete briefing do Porto tem que estar
   * registrada em CARTAS_DO_PORTO, senão a promessa não tem quem a cumpra e o
   * jogador paga o Recurso por nada.
   */
  it("quem promete briefing do Porto está registrado para recebê-lo", () => {
    const mentirosas = DEFAULT_PROJECT_TEMPLATES
      .filter((t) => t.pagamentoNarrativo?.includes("Informação privada"))
      .filter((t) => !(t.id in CARTAS_DO_PORTO));

    expect(mentirosas.map((t) => t.id)).toEqual([]);
  });

  it("todo desbloqueio aponta para uma carta que existe", () => {
    const ids = new Set(DEFAULT_PROJECT_TEMPLATES.map((t) => t.id));
    const quebrados: string[] = [];
    for (const t of DEFAULT_PROJECT_TEMPLATES) {
      for (const u of t.completionEffects.unlocks) {
        if (!ids.has(u)) quebrados.push(`${t.id} -> ${u}`);
      }
    }
    expect(quebrados).toEqual([]);
  });

  it("nenhuma carta desbloqueia a si mesma", () => {
    const bobas = DEFAULT_PROJECT_TEMPLATES.filter((t) => t.completionEffects.unlocks.includes(t.id));
    expect(bobas.map((t) => t.id)).toEqual([]);
  });
});

/** Qual atributo cada tipo de custo debita. */
