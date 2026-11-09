import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { limparCanon } from "@vampiro/content/test-fixtures";
import { ApiProvider } from "./api/ApiProvider";
import { MockApiClient } from "./api/mockClient";
import { AppRoutes } from "./App";
import { AdminLivingTab } from "./components/admin/AdminLivingTab";

/**
 * A crônica de produção nasce vazia, e nenhum outro teste vê esse estado.
 *
 * O `setup.ts` semeia cânone antes de cada teste porque quase toda tela existe
 * para mostrar cânone — mas isso escondeu exatamente o estado em que o site
 * entra no ar. O painel do Narrador caía inteiro na primeira noite:
 * `addressableNpcs()[0].affiliation` num elenco vazio.
 *
 * Este arquivo limpa o cânone de propósito e exige que as telas abram assim.
 */
beforeEach(limparCanon);

async function abrir(rota: string) {
  await act(async () => {
    render(
      <ApiProvider client={new MockApiClient()}>
        <MemoryRouter initialEntries={[rota]}>
          <AppRoutes />
        </MemoryRouter>
      </ApiProvider>,
    );
  });
}

describe("a crônica vazia", () => {
  it.each(["/", "/clas", "/personagens", "/galeria", "/login", "/admin", "/criar"])(
    "abre %s sem cânone nenhum",
    async (rota) => {
      await abrir(rota);
      // Uma tela que quebrou não tem nem a barra de navegação.
      expect(document.body.textContent?.length ?? 0).toBeGreaterThan(20);
    },
  );

  it("o estado vivo diz que não há elenco, em vez de derrubar o painel", async () => {
    await act(async () => {
      render(
        <ApiProvider client={new MockApiClient()}>
          <AdminLivingTab adminToken="t" busy={false} />
        </ApiProvider>,
      );
    });
    expect(await screen.findByText(/Ainda não há personagem nenhum/i)).toBeInTheDocument();
  });
});

