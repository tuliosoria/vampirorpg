import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Cidade } from "@vampiro/content";
import { useApi } from "../../../api/ApiProvider";
import { useRecarregarCanon } from "../../../api/CanonProvider";
import { LoadingState } from "../../LoadingState";
import type { ColecaoDoEstudio, EstudioCompleto } from "../../../api/client";
import { ENTIDADES } from "./campos";
import { EntidadeTab } from "./EntidadeTab";
import { RevisaoDialog, type CampoEmRevisao } from "./RevisaoDialog";

/**
 * O Estúdio: onde a cosmologia da crônica é escrita.
 *
 * Carrega tudo de uma vez, e não coleção por coleção, porque as fichas se
 * referenciam: escolher o bairro de um local exige a lista de bairros, e um
 * carregamento por aba faria o formulário abrir com as listas vazias.
 *
 * Toda gravação recarrega o cânone. Sem isso o Narrador salva um personagem e o
 * resto do site continua sem enxergá-lo até a próxima recarga de página.
 *
 * Não tem abas próprias: a fileira de seções do painel É a navegação. Ter as
 * duas criava um terceiro nível, e quem chegava para escrever um bairro
 * precisava acertar três cliques antes de ver um campo de texto.
 */
export function AdminEstudio({
  adminToken, secao, irPara,
}: { adminToken: string; secao: string; irPara: (secao: string) => void }) {
  const api = useApi();
  const recarregarCanon = useRecarregarCanon();
  const [mundo, setMundo] = useState<EstudioCompleto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setMundo(await api.getEstudio(adminToken));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar o Estúdio.");
    }
  }, [api, adminToken]);

  useEffect(() => { void carregar(); }, [carregar]);

  const depoisDeGravar = async (mensagem: string) => {
    await carregar();
    await recarregarCanon();
    setAviso(mensagem);
  };

  const salvarItem = async (colecao: ColecaoDoEstudio, item: Record<string, unknown>) => {
    setOcupado(true);
    try {
      await api.saveEstudioItem(adminToken, colecao, item);
      await depoisDeGravar("Salvo.");
    } finally {
      setOcupado(false);
    }
  };

  const removerItem = async (colecao: ColecaoDoEstudio, id: string) => {
    setOcupado(true);
    try {
      await api.deleteEstudioItem(adminToken, colecao, id);
      await depoisDeGravar("Removido.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao remover.");
    } finally {
      setOcupado(false);
    }
  };

  if (!mundo) {
    return erro ? <Alert severity="error">{erro}</Alert> : <LoadingState />;
  }

  const def = ENTIDADES.find((e) => e.colecao === secao);

  return (
    <Stack spacing={3}>
      {erro && <Alert severity="error" onClose={() => setErro(null)}>{erro}</Alert>}
      {aviso && <Alert severity="success" onClose={() => setAviso(null)}>{aviso}</Alert>}

      {secao === "cidade" && (
        <AbaCidade
          cidade={mundo.cidade}
          ocupado={ocupado}
          onRevisar={(c) => api.revisarEstudioItem(adminToken, "cidade", c)}
          onSalvar={async (c) => {
            setOcupado(true);
            try {
              await api.saveCidade(adminToken, c);
              await depoisDeGravar("Cidade salva.");
            } finally {
              setOcupado(false);
            }
          }}
        />
      )}

      {secao === "cidade" && <Roteiro mundo={mundo} irPara={irPara} />}

      {def && (
        <EntidadeTab
          def={def}
          itens={mundo[def.colecao] as unknown as Record<string, unknown>[]}
          mundo={mundo}
          ocupado={ocupado}
          onSalvar={(item) => salvarItem(def.colecao, item)}
          onRemover={(id) => removerItem(def.colecao, id)}
          onRevisar={(item) => api.revisarEstudioItem(adminToken, def.colecao, item)}
        />
      )}
    </Stack>
  );
}

/**
 * A cidade é registro único, e por isso não passa pelo componente de coleção:
 * não há lista, não há criar nem remover — só um formulário que já existe.
 */
function AbaCidade({
  cidade, ocupado, onSalvar, onRevisar,
}: {
  cidade: Cidade;
  ocupado: boolean;
  onSalvar: (c: Cidade) => Promise<void>;
  onRevisar: (c: Cidade) => Promise<Record<string, string>>;
}) {
  const [draft, setDraft] = useState<Cidade>(cidade);
  useEffect(() => setDraft(cidade), [cidade]);

  const [revisao, setRevisao] = useState<CampoEmRevisao[] | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [erroDaRevisao, setErroDaRevisao] = useState<string | null>(null);

  const ROTULOS: Record<string, { rotulo: string; segredo: boolean }> = {
    descricao: { rotulo: "Descrição", segredo: false },
    segredos: { rotulo: "Segredos da Cidade", segredo: true },
  };

  const revisar = async () => {
    setRevisando(true);
    setErroDaRevisao(null);
    setRevisao([]);
    try {
      const daIa = await onRevisar(draft);
      setRevisao(
        Object.entries(daIa).map(([nome, texto]) => ({
          nome,
          rotulo: ROTULOS[nome]?.rotulo ?? nome,
          segredo: ROTULOS[nome]?.segredo ?? false,
          original: String((draft as unknown as Record<string, unknown>)[nome] ?? ""),
          daIa: texto,
        })),
      );
    } catch (e) {
      setErroDaRevisao(e instanceof Error ? e.message : "A revisão falhou.");
    } finally {
      setRevisando(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <TextField
            size="small" label="Nome da Cidade" value={draft.nome}
            onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
          />
          <TextField
            size="small" label="Descrição" multiline minRows={10} value={draft.descricao}
            onChange={(e) => setDraft({ ...draft, descricao: e.target.value })}
            helperText="Aparência, história, atmosfera, quem manda de dia, o que se comenta à noite."
          />
          <TextField
            size="small" label="🔒 Segredos da Cidade" multiline minRows={6} value={draft.segredos}
            onChange={(e) => setDraft({ ...draft, segredos: e.target.value })}
            helperText="Nunca sai por rota de jogador. A IA lê para saber o que o cenário esconde."
          />
          <Stack direction="row" spacing={2}>
            <Button onClick={() => void onSalvar(draft)} disabled={ocupado || !draft.nome.trim()}>
              {ocupado ? "Salvando…" : "Salvar cidade"}
            </Button>
            <Button variant="outlined" onClick={() => void revisar()} disabled={ocupado || revisando}>
              {revisando ? "Revisando…" : "Revisar com IA"}
            </Button>
          </Stack>

          <RevisaoDialog
            aberto={revisao !== null}
            carregando={revisando}
            erro={erroDaRevisao}
            campos={revisao ?? []}
            onFechar={() => setRevisao(null)}
            onAceitar={(escolhidos) => {
              setDraft((d) => ({ ...d, ...escolhidos }));
              setRevisao(null);
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Os sete passos, na ordem em que um abre o seguinte. */
const PASSOS: { secao: string; label: string; conta: (m: EstudioCompleto) => number }[] = [
  { secao: "cidade", label: "Cidade", conta: (m) => (m.cidade.nome.trim() ? 1 : 0) },
  { secao: "bairros", label: "Bairros", conta: (m) => m.bairros.length },
  { secao: "clas", label: "Clãs", conta: (m) => m.clas.length },
  { secao: "personagens", label: "Personagens", conta: (m) => m.personagens.length },
  { secao: "locais", label: "Locais", conta: (m) => m.locais.length },
  { secao: "tramas", label: "Tramas", conta: (m) => m.tramas.length },
  { secao: "contos", label: "Contos", conta: (m) => m.contos.length },
];

/**
 * O mapa de por onde seguir, na tela onde se chega.
 *
 * As sete abas do Mundo aparecem lado a lado e com o mesmo peso, mas não são
 * intercambiáveis: um local pede um bairro e um personagem pede um clã, e quem
 * começasse pelas Tramas abriria o formulário com todos os menus vazios e sem
 * dizer por quê. A ordem está aqui, com o que já existe em cada passo, para que
 * a primeira noite de escrita não comece por tentativa e erro.
 */
function Roteiro({ mundo, irPara }: { mundo: EstudioCompleto; irPara: (secao: string) => void }) {
  const feitos = PASSOS.map((p) => p.conta(mundo));
  const proximo = feitos.findIndex((n) => n === 0);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h6">Por onde seguir</Typography>
            <Typography variant="body2" color="text.secondary">
              Nesta ordem, porque cada passo abre o seguinte: um local precisa de um bairro, e um
              personagem precisa de um clã. Nada aqui é obrigatório — a ordem só evita abrir um
              formulário com todos os menus vazios.
            </Typography>
          </Box>
          <Divider />
          <Stack spacing={0.5}>
            {PASSOS.map((passo, i) => (
              <Stack key={passo.secao} direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="body2" color="text.secondary" sx={{ width: "1.5rem" }}>
                  {i + 1}.
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => irPara(passo.secao)}
                  sx={{ justifyContent: "flex-start", minWidth: "8rem" }}
                >
                  {passo.label}
                </Button>
                {feitos[i] > 0 ? (
                  <Chip size="small" label={feitos[i]} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {i === proximo ? "comece por aqui" : "nada ainda"}
                  </Typography>
                )}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
