import { describe, it, expect } from "vitest";
import { DEFAULT_PROJECT_TEMPLATES } from "./projectTemplates.js";
import { isProjectCategory } from "./projects.js";

/**
 * O catálogo nasce vazio: as cartas passam a ser cânone da crônica, criadas
 * pelo Narrador. O que se testa aqui é a forma que qualquer carta precisa ter,
 * e não quais cartas existem — por isso os testes valem tanto para o catálogo
 * vazio de hoje quanto para o que o Narrador escrever amanhã.
 */
describe("DEFAULT_PROJECT_TEMPLATES", () => {
  it("nasce vazio, para que a crônica não herde cartas de outro mundo", () => {
    expect(DEFAULT_PROJECT_TEMPLATES).toHaveLength(0);
  });

  it("toda carta é estruturalmente válida", () => {
    for (const t of DEFAULT_PROJECT_TEMPLATES) {
      expect(t.id).toMatch(/^[a-z0-9-]+$/);
      expect(isProjectCategory(t.category)).toBe(true);
      expect(t.durationTurns).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(t.costs)).toBe(true);
      expect(t.completionEffects).toBeDefined();
    }
  });

  it("não repete id", () => {
    const ids = DEFAULT_PROJECT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
