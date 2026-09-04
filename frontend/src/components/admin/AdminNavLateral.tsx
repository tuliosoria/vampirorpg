import { useState } from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { pendenteNaSecao, type Pendencias } from "@vampiro/content";
import { ADMIN_GROUPS } from "./adminNav";

/**
 * A navegação do painel do Mestre: uma coluna, e os vinte destinos nela.
 *
 * A coluna e a gaveta têm nomes acessíveis distintos porque, com a gaveta
 * aberta, as duas listas coexistem no documento — e dois pontos de referência
 * chamados "Seções do painel" não são um ponto de referência.
 *
 * Eram duas fileiras de abas, uma dentro da outra. Abas se prestam a poucas
 * escolhas irmãs; vinte destinos em cinco famílias não são isso, e o segundo
 * nível escondia dezesseis deles atrás de um clique — quem não soubesse em qual
 * família o Escriba morava tinha de abrir as cinco para achá-lo.
 *
 * Nada colapsa aqui de propósito. Um grupo que fecha é o nível aninhado de
 * volta, disfarçado de seta: continuaria escondendo destinos, e o badge de
 * trabalho parado sumiria junto com eles. A coluna rola por conta própria.
 */
interface Props {
  grupoAberto: string;
  secaoAberta: string;
  pendencias: Pendencias;
  onIr: (grupo: string, secao: string) => void;
}

const LARGURA = 232;

function Lista({ grupoAberto, secaoAberta, pendencias, onIr, rotulo }: Props & { rotulo: string }) {
  return (
    <List
      component="nav"
      aria-label={rotulo}
      dense
      disablePadding
      sx={{ "& .MuiListSubheader-root": { bgcolor: "transparent", lineHeight: "2.2rem" } }}
    >
      {ADMIN_GROUPS.map((g) => (
        <li key={g.value}>
          <ListSubheader disableSticky sx={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.7rem" }}>
            {g.label}
          </ListSubheader>
          <List disablePadding>
            {g.sections.map((s) => {
              const aqui = g.value === grupoAberto && s.value === secaoAberta;
              const parado = pendenteNaSecao(pendencias, g.value, s.value);
              return (
                <ListItemButton
                  key={s.value}
                  selected={aqui}
                  // `selected` pinta, mas não conta: quem navega por leitor de
                  // tela precisa ouvir qual dos vinte é o aberto.
                  aria-current={aqui ? "page" : undefined}
                  onClick={() => onIr(g.value, s.value)}
                  sx={{ pl: 3, borderRadius: 1 }}
                >
                  <ListItemText primary={s.label} primaryTypographyProps={{ variant: "body2" }} />
                  {parado > 0 && (
                    // Dourado, e sempre visível: antes o número vivia na aba do
                    // grupo e desaparecia junto com ela.
                    <Badge badgeContent={parado} color="warning" sx={{ mr: 1.5 }} />
                  )}
                </ListItemButton>
              );
            })}
          </List>
        </li>
      ))}
    </List>
  );
}

export function AdminNavLateral(props: Props) {
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const grupo = ADMIN_GROUPS.find((g) => g.value === props.grupoAberto);
  const secao = grupo?.sections.find((s) => s.value === props.secaoAberta);
  const caminho = grupo && secao ? `${grupo.label} › ${secao.label}` : "Painel";

  const irEFechar = (g: string, s: string) => {
    props.onIr(g, s);
    setGavetaAberta(false);
  };

  return (
    <>
      {/* Telas estreitas: a coluna vira gaveta, aberta por um botão que diz
          onde você está. Deliberadamente não é o hambúrguer do topo — aquele
          abre a navegação do site público, e dois controles iguais com
          conteúdos diferentes seriam piores que as abas que saíram daqui. */}
      <Box sx={{ display: { xs: "block", md: "none" }, mb: 2 }}>
        <Button variant="outlined" endIcon={<ExpandMoreIcon />} onClick={() => setGavetaAberta(true)}>
          {caminho}
        </Button>
        <Drawer anchor="left" open={gavetaAberta} onClose={() => setGavetaAberta(false)}>
          <Box sx={{ width: LARGURA, py: 2 }}>
            <Lista {...props} onIr={irEFechar} rotulo="Seções do painel (gaveta)" />
          </Box>
        </Drawer>
      </Box>

      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "block" },
          width: LARGURA,
          flexShrink: 0,
          // Presa enquanto o formulário do lado rola. `top` desconta a barra do
          // site, que é sticky: sem isso a primeira seção nasce por baixo dela.
          position: "sticky",
          alignSelf: "flex-start",
          top: 80,
          maxHeight: "calc(100dvh - 96px)",
          overflowY: "auto",
          borderRight: 1,
          borderColor: "divider",
          pr: 1,
        }}
      >
        <Lista {...props} rotulo="Seções do painel" />
      </Box>
    </>
  );
}
