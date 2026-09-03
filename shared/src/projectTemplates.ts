import type { ProjectTemplate } from "./projects.js";

/**
 * Os modelos de empreitada que o jogador pode iniciar.
 *
 * Nasce vazio de propósito. Na Cidade esta lista era mil e duzentas linhas de
 * cartas escritas à mão e versionadas em código; aqui ela é cânone da crônica,
 * criada pelo Mestre na interface do Admin e guardada no banco. O motor não
 * precisa conhecer nenhuma carta para funcionar — só precisa saber a forma
 * delas, que vive em `projects.ts`.
 */
export const DEFAULT_PROJECT_TEMPLATES: ProjectTemplate[] = [];

export function getTemplate(id: string): ProjectTemplate | undefined {
  return DEFAULT_PROJECT_TEMPLATES.find((t) => t.id === id);
}
