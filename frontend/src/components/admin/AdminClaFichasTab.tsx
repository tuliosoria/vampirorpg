import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import { chaveDeCla, fichaVazia, type ClaFicha } from "@vampiro/content";
import { useApi } from "../../api/ApiProvider";
import { useRecarregarCanon } from "../../api/CanonProvider";
import { LoadingState } from "../LoadingState";

/**
 * Onde o Narrador constrói a Cidade, um clã por vez.
 *
 * A ficha é longa de propósito, mas só o nome é obrigatório: um clã pode entrar
 * na Cidade sendo um nome no mapa e ganhar corte, elenco e escassez depois. O
 * que ficar em branco não alimenta o motor, e o sistema que dependia daquilo
 * fica quieto em vez de inventar — é isso que o texto de cada bloco explica,
 * para o Narrador saber o que ganha ao preencher.
 */
function Campo(props: React.ComponentProps<typeof TextField>) {
  return <TextField size="small" {...props} />;
}

function Bloco({ titulo, porque, children }: { titulo: string; porque: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>{titulo}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{porque}</Typography>
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}

export function AdminClaFichasTab({ adminToken }: { adminToken: string }) {
  const api = useApi();
  const recarregarCanon = useRecarregarCanon();
  const [fichas, setFichas] = useState<ClaFicha[] | null>(null);
  const [draft, setDraft] = useState<ClaFicha | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setFichas(await api.listCla());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao carregar os clãs.");
    }
  }, [api]);

  useEffect(() => { void carregar(); }, [carregar]);

  const set = <K extends keyof ClaFicha>(campo: K, valor: ClaFicha[K]) =>
    setDraft((d) => (d ? { ...d, [campo]: valor } : d));

  const salvar = async () => {
    if (!draft) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.adminSaveCla(adminToken, draft);
      await carregar();
      // Sem isto o Narrador salva e o resto do site continua sem enxergar o
      // clã até a próxima recarga de página.
      await recarregarCanon();
      setAviso(`${draft.name} entrou na Cidade.`);
      setDraft(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (f: ClaFicha) => {
    if (!confirm(`Remover ${f.name} da Cidade?\n\nO que já foi escrito sobre ele na crônica continua lá.`)) return;
    try {
      await api.adminDeleteCla(adminToken, f.key);
      await carregar();
      await recarregarCanon();
      setAviso(`${f.name} saiu do mapa.`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao remover.");
    }
  };

  if (!fichas) return <LoadingState />;

  return (
    <Stack spacing={3}>
      {erro && <Alert severity="error" onClose={() => setErro(null)}>{erro}</Alert>}
      {aviso && <Alert severity="success" onClose={() => setAviso(null)}>{aviso}</Alert>}

      {!draft && (
        <Box>
          <Button onClick={() => setDraft(fichaVazia("", ""))}>Novo clã</Button>
        </Box>
      )}

      {draft && (
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Bloco
                titulo="O clã"
                porque="O nome é a única coisa obrigatória. A chave nasce dele e não muda depois: cartas e imagens já gravadas apontam para ela."
              >
                <Campo
                  label="Nome do clã"
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((d) => (d ? { ...d, name, key: d.key || chaveDeCla(name) } : d));
                  }}
                />
                <Campo
                  label="Chave"
                  value={draft.key}
                  onChange={(e) => set("key", e.target.value)}
                  helperText="Minúsculas, números e hífen. Ex.: cla-ventrue"
                />
                <Campo
                  label="👁 Descrição — os jogadores leem"
                  multiline
                  minRows={3}
                  value={draft.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                />
                <Campo
                  label="🔒 Segredos — só você"
                  multiline
                  minRows={3}
                  value={draft.segredos}
                  onChange={(e) => set("segredos", e.target.value)}
                  helperText="Nunca sai por rota de jogador. A IA lê para saber o que o clã esconde."
                />
              </Bloco>

              <Divider />

              <Bloco
                titulo="Onde fica"
                porque="A coordenada não é enfeite: dela sai a distância até os outros clãs, e da distância o número de cartas por noite. O mapa tem 1536 por 1024."
              >
                <Campo label="Refúgio (o endereço que identifica o clã)" value={draft.refugio} onChange={(e) => set("refugio", e.target.value)} />
                <Campo
                  label="Outros lugares, separados por vírgula"
                  value={draft.outrosLugares.join(", ")}
                  onChange={(e) => set("outrosLugares", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))}
                  helperText="Endereços que também nomeiam este clã em verbetes e imagens."
                />
                <Stack direction="row" spacing={2}>
                  <Campo label="X" type="number" value={draft.x} onChange={(e) => set("x", Number(e.target.value))} />
                  <Campo label="Y" type="number" value={draft.y} onChange={(e) => set("y", Number(e.target.value))} />
                </Stack>
              </Bloco>

              <Divider />

              <Bloco
                titulo="O que tem e o que falta"
                porque="A escassez é o motor da mesa: é ela que faz um clã escrever para quem detesta. Escreva a sobra, depois a palavra falta, depois a carência — o motor lê a virada da frase."
              >
                <Campo label="Recursos" multiline minRows={2} value={draft.perfil?.resources ?? ""} onChange={(e) => set("perfil", { ...(draft.perfil ?? vazioPerfil()), resources: e.target.value })} helperText='Ex.: "Bancos e um juiz de plantão; falta-lhe silêncio."' />
                <Campo label="Dinheiro e influência" multiline minRows={2} value={draft.perfil?.wealth ?? ""} onChange={(e) => set("perfil", { ...(draft.perfil ?? vazioPerfil()), wealth: e.target.value })} />
                <Campo label="Quem luta por ele" multiline minRows={2} value={draft.perfil?.soldiers ?? ""} onChange={(e) => set("perfil", { ...(draft.perfil ?? vazioPerfil()), soldiers: e.target.value })} />
                <Campo label="Como manda" multiline minRows={2} value={draft.perfil?.control ?? ""} onChange={(e) => set("perfil", { ...(draft.perfil ?? vazioPerfil()), control: e.target.value })} />
              </Bloco>

              <Stack direction="row" spacing={2}>
                <Button onClick={() => void salvar()} disabled={salvando || !draft.name.trim()}>
                  {salvando ? "Salvando…" : "Salvar clã"}
                </Button>
                <Button variant="outlined" onClick={() => setDraft(null)} disabled={salvando}>
                  Cancelar
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Divider />

      {fichas.length === 0 ? (
        <Typography color="text.secondary">
          Nenhum clã ainda. O primeiro que você cadastrar já aparece no mapa, na home e na lista de
          destinatários de carta.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {fichas.map((f) => (
            <Card key={f.key} variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight="bold">{f.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[f.refugio, f.segredos ? "tem segredos" : null]
                        .filter(Boolean)
                        .join(" · ") || "só um nome no mapa, por enquanto"}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => setDraft(f)}>Editar</Button>
                  <IconButton aria-label={`Remover ${f.name}`} onClick={() => void remover(f)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}


function vazioPerfil() {
  return { wealth: "", resources: "", soldiers: "", control: "" };
}
