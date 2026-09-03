import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { aplicarCanon } from "@vampiro/content";
import { useApi } from "./ApiProvider";
import { LoadingState } from "../components/LoadingState";

/**
 * Traz do backend o mundo que o Narrador escreveu e o entrega ao motor.
 *
 * O frontend lê cânone das mesmas constantes de módulo que o backend — `SEATS`,
 * `LEADER_PERSONAS`, `HOUSE_CHARACTERS` — e elas nascem vazias no bundle. Sem
 * este passo a página do clã não acha o clã, o mapa não tem ponto e a lista de
 * destinatários vem em branco, mesmo com tudo cadastrado no banco.
 *
 * Segura a árvore até a primeira carga terminar. Renderizar antes mostraria a
 * Cidade vazia por um quadro e depois povoada, e o leitor leria o piscar como
 * defeito — pior, quem carrega devagar chegaria a ver a mensagem de "não há
 * clã nenhum" numa crônica cheia.
 *
 * Falha de rede não trava o site: a Cidade aparece vazia, que é exatamente o
 * que ela é do ponto de vista de quem não conseguiu ler o cânone.
 */
const RecarregarContext = createContext<() => Promise<void>>(async () => undefined);

/** Para quem edita cânone: reaplica sem recarregar a página inteira. */
export function useRecarregarCanon(): () => Promise<void> {
  return useContext(RecarregarContext);
}

export function CanonProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const [pronto, setPronto] = useState(false);

  const carregar = useCallback(async () => {
    try {
      aplicarCanon(await api.listCla());
    } catch {
      aplicarCanon([]);
    } finally {
      setPronto(true);
    }
  }, [api]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (!pronto) return <LoadingState />;
  return <RecarregarContext.Provider value={carregar}>{children}</RecarregarContext.Provider>;
}
