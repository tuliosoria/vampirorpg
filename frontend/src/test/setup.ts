import "@testing-library/jest-dom/vitest";
import { beforeEach, afterEach } from "vitest";
import { semearCanon, limparCanon } from "@vampiro/content/test-fixtures";

/**
 * A crônica nasce vazia, e uma tela sem cânone não tem o que renderizar.
 *
 * Semear aqui, e não arquivo a arquivo, porque quase toda página do site existe
 * para mostrar cânone: sem clã nenhum cadastrado, a página do clã, a ficha do
 * personagem e a biblioteca de cartas ficam corretamente em branco, e o teste
 * deixa de exercitar qualquer coisa. Um teste que precise da tela vazia chama
 * `limparCanon()` no próprio corpo.
 */
beforeEach(semearCanon);
afterEach(limparCanon);

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: () => ({
    setTransform: () => undefined,
    clearRect: () => undefined,
    createRadialGradient: () => ({ addColorStop: () => undefined }),
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    globalCompositeOperation: "source-over",
    fillStyle: "",
  }),
});
