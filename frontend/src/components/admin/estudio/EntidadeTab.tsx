import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import type { EstudioCompleto } from "../../../api/client";
import { rotuloDeEscolha, type Campo, type DefinicaoDeEntidade } from "./campos";

/**
 * O formulário de qualquer entidade do Estúdio.
 *
 * Um componente para as cinco abas, dirigido pela definição de campos. Cinco
 * formulários quase iguais seriam cinco lugares para o mesmo defeito: o campo
 * secreto sem cadeado, o enum aceitando texto livre, o salvar que esquece de
 * recarregar o cânone.
 *
 * O cadeado não esconde nada — o backend é quem impede o campo de sair. Ele
 * serve para o Narrador saber, no instante em que escreve, o que está do lado
 * de dentro.
 */

function ler(item: Record<string, unknown>, caminho: string): unknown {
  return caminho.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | null)?.[k], item);
}

function escrever(item: Record<string, unknown>, caminho: string, valor: unknown): Record<string, unknown> {
  const [cabeca, ...resto] = caminho.split(".");
  if (resto.length === 0) return { ...item, [cabeca]: valor };
  const filho = (item[cabeca] ?? {}) as Record<string, unknown>;
  return { ...item, [cabeca]: escrever(filho, resto.join("."), valor) };
}

function rotuloCom(campo: Campo): string {
  return campo.segredo ? `🔒 ${campo.rotulo}` : campo.rotulo;
}

interface Props {
  def: DefinicaoDeEntidade;
  itens: Record<string, unknown>[];
  /** As outras coleções, para os campos que apontam para elas. */
  mundo: EstudioCompleto;
  onSalvar: (item: Record<string, unknown>) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
  ocupado: boolean;
}

export function EntidadeTab({ def, itens, mundo, onSalvar, onRemover, ocupado }: Props) {
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const opcoesDe = useMemo(() => {
    return (campo: Campo): { valor: string; rotulo: string }[] => {
      if (!campo.de) return [];
      const lista = (mundo[campo.de] ?? []) as unknown as Record<string, unknown>[];
      return lista.map((x) => ({
        valor: String(x.id ?? x.key ?? ""),
        rotulo: String(x.nome ?? x.name ?? x.titulo ?? x.id ?? ""),
      }));
    };
  }, [mundo]);

  const visivel = (campo: Campo, atual: Record<string, unknown>): boolean =>
    !campo.quando || ler(atual, campo.quando.campo) === campo.quando.valor;

  const salvar = async () => {
    if (!draft) return;
    setErro(null);
    try {
      await onSalvar(draft);
      setDraft(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  };

  const novo = () => {
    const inicial: Record<string, unknown> = {};
    for (const c of def.campos) {
      if (c.tipo === "escolha" && c.opcoes) Object.assign(inicial, escrever(inicial, c.nome, c.opcoes[0]));
      if (c.tipo === "booleano") Object.assign(inicial, escrever(inicial, c.nome, false));
    }
    setDraft(inicial);
  };

  return (
    <Stack spacing={3}>
      {erro && <Alert severity="error" onClose={() => setErro(null)}>{erro}</Alert>}

      {!draft && <Box><Button onClick={novo}>{def.genero === "f" ? "Nova" : "Novo"} {def.singular}</Button></Box>}

      {draft && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {def.campos.filter((c) => visivel(c, draft)).map((campo) => {
                const valor = ler(draft, campo.nome);
                const aoMudar = (v: unknown) => setDraft((d) => (d ? escrever(d, campo.nome, v) : d));

                if (campo.tipo === "booleano") {
                  return (
                    <Box key={campo.nome}>
                      <FormControlLabel
                        control={<Checkbox checked={valor === true} onChange={(e) => aoMudar(e.target.checked)} />}
                        label={rotuloCom(campo)}
                      />
                      {campo.ajuda && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4 }}>
                          {campo.ajuda}
                        </Typography>
                      )}
                    </Box>
                  );
                }

                if (campo.tipo === "escolha" || campo.tipo === "referencia") {
                  const opcoes = campo.tipo === "escolha"
                    ? (campo.opcoes ?? []).map((o) => ({ valor: o, rotulo: rotuloDeEscolha(o) }))
                    : opcoesDe(campo);
                  return (
                    <TextField
                      key={campo.nome}
                      select
                      size="small"
                      label={rotuloCom(campo)}
                      helperText={campo.ajuda}
                      value={String(valor ?? "")}
                      onChange={(e) => aoMudar(e.target.value || null)}
                    >
                      {campo.tipo === "referencia" && <MenuItem value="">— nenhum —</MenuItem>}
                      {opcoes.map((o) => <MenuItem key={o.valor} value={o.valor}>{o.rotulo}</MenuItem>)}
                    </TextField>
                  );
                }

                return (
                  <TextField
                    key={campo.nome}
                    size="small"
                    label={rotuloCom(campo)}
                    helperText={campo.ajuda}
                    multiline={campo.tipo === "longo"}
                    minRows={campo.tipo === "longo" ? (campo.linhas ?? 4) : undefined}
                    value={String(valor ?? "")}
                    onChange={(e) => aoMudar(e.target.value)}
                  />
                );
              })}

              <Stack direction="row" spacing={2}>
                <Button onClick={() => void salvar()} disabled={ocupado || !String(ler(draft, def.titulo) ?? "").trim()}>
                  {ocupado ? "Salvando…" : "Salvar"}
                </Button>
                <Button variant="outlined" onClick={() => setDraft(null)} disabled={ocupado}>Cancelar</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Divider />

      {itens.length === 0 ? (
        <Typography color="text.secondary">
          {def.genero === "f" ? "Nenhuma" : "Nenhum"} {def.singular} ainda.{" "}
          {def.genero === "f" ? "A primeira" : "O primeiro"} que você escrever já entra na cosmologia.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {itens.map((item) => (
            <Card key={String(item.id)} variant="outlined">
              <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight="bold">{String(ler(item, def.titulo) ?? "sem nome")}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {def.resumo
                        .map((c) => ler(item, c))
                        .filter((v) => v !== null && v !== undefined && v !== "")
                        .map((v) => rotuloDeEscolha(String(v)))
                        .join(" · ") || "sem detalhe ainda"}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={() => setDraft({ ...item })}>Editar</Button>
                  <IconButton
                    aria-label={`Remover ${String(ler(item, def.titulo) ?? "")}`}
                    onClick={() => {
                      if (confirm(`Remover ${String(ler(item, def.titulo) ?? "")}?`)) void onRemover(String(item.id));
                    }}
                  >
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
