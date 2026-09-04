import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

/**
 * As duas versões, lado a lado, e a decisão com o Narrador.
 *
 * A IA não escreve por cima. Ela propõe, e nada entra no formulário sem alguém
 * escolher — porque o texto do outro lado é trabalho de quem escreveu, e uma
 * ferramenta que melhora sozinha o parágrafo de alguém está apagando a decisão
 * dele de escrevê-lo assim.
 *
 * A escolha é campo a campo. Numa mesma revisão o Narrador costuma gostar da
 * descrição e achar que a IA errou o tom do segredo; um botão só para as duas o
 * obrigaria a jogar fora a metade boa.
 *
 * E a versão da IA é editável aqui mesmo: quase certo é o caso comum, e mandar
 * a pessoa aceitar-para-depois-corrigir custa uma viagem de ida e volta pelo
 * formulário.
 */
export interface CampoEmRevisao {
  nome: string;
  rotulo: string;
  segredo: boolean;
  original: string;
  daIa: string;
}

interface Props {
  aberto: boolean;
  carregando: boolean;
  erro: string | null;
  campos: CampoEmRevisao[];
  onFechar: () => void;
  /** Só os campos que o Narrador aceitou, já com as edições dele. */
  onAceitar: (escolhidos: Record<string, string>) => void;
}

export function RevisaoDialog({ aberto, carregando, erro, campos, onFechar, onAceitar }: Props) {
  const [aceitos, setAceitos] = useState<Record<string, string>>({});

  const fechar = () => {
    setAceitos({});
    onFechar();
  };

  const aplicar = () => {
    onAceitar(aceitos);
    setAceitos({});
  };

  return (
    <Dialog open={aberto} onClose={fechar} maxWidth="lg" fullWidth>
      <DialogTitle>Revisão da IA</DialogTitle>
      <DialogContent dividers>
        {carregando && <Typography color="text.secondary">Lendo o que você escreveu…</Typography>}
        {erro && <Alert severity="error">{erro}</Alert>}

        {!carregando && !erro && campos.length === 0 && (
          <Typography color="text.secondary">
            Não há texto para revisar ainda. Escreva alguma coisa e peça de novo.
          </Typography>
        )}

        <Stack spacing={3} divider={<Divider />}>
          {campos.map((campo) => {
            const escolhido = aceitos[campo.nome];
            return (
              <Box key={campo.nome}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {campo.segredo ? `🔒 ${campo.rotulo}` : campo.rotulo}
                </Typography>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="overline" color="text.secondary">
                      O que você escreveu
                    </Typography>
                    {/* Não é campo de edição: é a referência contra a qual se
                        compara. Editar o original aqui gravaria por um caminho
                        que o botão de salvar não conhece. */}
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}
                    >
                      {campo.original || "(vazio)"}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="overline" color="text.secondary">
                      A versão da IA
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      size="small"
                      minRows={4}
                      label={`Versão da IA — ${campo.rotulo}`}
                      value={escolhido ?? campo.daIa}
                      onChange={(e) => setAceitos((a) => ({ ...a, [campo.nome]: e.target.value }))}
                    />
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mt: 1 }} alignItems="center">
                  <Button
                    size="small"
                    variant={escolhido === undefined ? "outlined" : "contained"}
                    onClick={() => setAceitos((a) => ({ ...a, [campo.nome]: campo.daIa }))}
                  >
                    Usar esta versão
                  </Button>
                  {escolhido !== undefined && (
                    <>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() =>
                          setAceitos((a) => {
                            const { [campo.nome]: _fora, ...resto } = a;
                            return resto;
                          })
                        }
                      >
                        Manter o meu
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Vai substituir o campo.
                      </Typography>
                    </>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={fechar}>
          Descartar a revisão
        </Button>
        <Button onClick={aplicar} disabled={Object.keys(aceitos).length === 0}>
          {/* Só escreve no formulário. Gravar continua sendo o botão de salvar,
              e a pessoa ainda pode mexer no texto depois. */}
          Levar {Object.keys(aceitos).length === 1 ? "o campo" : `os ${Object.keys(aceitos).length} campos`} para o formulário
        </Button>
      </DialogActions>
    </Dialog>
  );
}
