import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Cidade } from "@vampiro/content";
import { useApi } from "../../../api/ApiProvider";
import { useRecarregarCanon } from "../../../api/CanonProvider";
import { LoadingState } from "../../LoadingState";
import type { ColecaoDoEstudio, EstudioCompleto } from "../../../api/client";
import { ENTIDADES } from "./campos";
import { EntidadeTab } from "./EntidadeTab";

/**
 * O Estúdio: onde a cosmologia da crônica é escrita.
 *
 * Carrega tudo de uma vez, e não coleção por coleção, porque as fichas se
 * referenciam: escolher o bairro de um local exige a lista de bairros, e um
 * carregamento por aba faria o formulário abrir com as listas vazias.
 *
 * Toda gravação recarrega o cânone. Sem isso o Narrador salva um personagem e o
 * resto do site continua sem enxergá-lo até a próxima recarga de página.
 */
export function AdminEstudio({ adminToken }: { adminToken: string }) {
  const api = useApi();
  const recarregarCanon = useRecarregarCanon();
  const [mundo, setMundo] = useState<EstudioCompleto | null>(null);
  const [aba, setAba] = useState<string>("cidade");
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

  const def = ENTIDADES.find((e) => e.colecao === aba);

  return (
    <Stack spacing={3}>
      <Tabs value={aba} onChange={(_e, v) => setAba(v)} variant="scrollable" scrollButtons="auto">
        <Tab value="cidade" label="Cidade" />
        {ENTIDADES.map((e) => (
          <Tab
            key={e.colecao}
            value={e.colecao}
            label={`${e.rotulo}${mundo[e.colecao].length ? ` (${mundo[e.colecao].length})` : ""}`}
          />
        ))}
      </Tabs>

      {erro && <Alert severity="error" onClose={() => setErro(null)}>{erro}</Alert>}
      {aviso && <Alert severity="success" onClose={() => setAviso(null)}>{aviso}</Alert>}

      {aba === "cidade" && (
        <AbaCidade
          cidade={mundo.cidade}
          ocupado={ocupado}
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

      {def && (
        <EntidadeTab
          def={def}
          itens={mundo[def.colecao] as unknown as Record<string, unknown>[]}
          mundo={mundo}
          ocupado={ocupado}
          onSalvar={(item) => salvarItem(def.colecao, item)}
          onRemover={(id) => removerItem(def.colecao, id)}
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
  cidade, ocupado, onSalvar,
}: { cidade: Cidade; ocupado: boolean; onSalvar: (c: Cidade) => Promise<void> }) {
  const [draft, setDraft] = useState<Cidade>(cidade);
  useEffect(() => setDraft(cidade), [cidade]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            A cidade onde a crônica acontece. É o pano de fundo que a IA assume em tudo que escreve.
          </Typography>
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
          <Box>
            <Button onClick={() => void onSalvar(draft)} disabled={ocupado || !draft.nome.trim()}>
              {ocupado ? "Salvando…" : "Salvar cidade"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
