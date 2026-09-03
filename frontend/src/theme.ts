import { createTheme, responsiveFontSizes } from "@mui/material/styles";

/**
 * Design system da Cidade — horror gótico contemporâneo.
 *
 * A direção vem da linguagem visual do World of Darkness: canvas quase preto,
 * texto branco, e o oxblood `#430017` como chão de seção sangrada de largura
 * total. Todos os três valores saíram medidos da referência, não estimados.
 *
 * A regra que não é óbvia, e que define o uso do vermelho: `#430017` contra
 * `#101010` dá 1,13:1. Como preenchimento de card ele simplesmente some. Na
 * referência funciona porque a seção ocupa a largura inteira e é lida pelo
 * conteúdo e pela troca de temperatura, não por uma borda. Então oxblood é
 * chão de seção, com texto branco por cima (16,79:1) — nunca fundo de card,
 * nunca borda, nunca texto.
 *
 * Para o que é interativo sobre o canvas o oxblood não serve: vermelho escuro
 * sobre preto é justamente o par que a intuição erra. O acento é um vermelho
 * claro o bastante para passar como texto — `#e05561` dá 5,11:1, contra os
 * 3,46:1 de um carmesim de brasão.
 */

const sans = '"Source Sans 3", "Source Sans Pro", system-ui, -apple-system, "Segoe UI", sans-serif';

export const brand = {
  base: "#101010",
  surface: "#1a1518",
  raised: "#221a1e",
  text: "#f4f1f1",
  /** Quente, não cinza: sobre superfície tingida, secundário cinza suja a cor. */
  muted: "#b0a5a8",
  line: "#332a2e",
  accent: "#e05561",
  accentDim: "#d64b56",
  /** Só como chão de seção sangrada, com texto branco. Ver o comentário acima. */
  oxblood: "#430017",
  oxbloodDeep: "#2c000f",
} as const;

/**
 * Escala de 4px. Os nomes existem para que "espaço entre seções" seja uma
 * decisão tomada uma vez, e não um número digitado de novo em cada arquivo.
 */
export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
  section: 96,
} as const;

export const layout = {
  maxWidth: 1200,
  /** Duração única de transição; movimento aqui é acento, não espetáculo. */
  motion: "160ms cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/** O gesto do cenário: caixa alta, peso, e muito espacejamento. */
const label = {
  fontFamily: sans,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
};

export const theme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: "dark",
      background: { default: brand.base, paper: brand.surface },
      primary: { main: brand.accent, dark: brand.accentDim, contrastText: "#160408" },
      secondary: { main: brand.text, contrastText: brand.base },
      error: { main: "#ef6b73", dark: "#8c1f28" },
      warning: { main: "#d1a24a" },
      text: { primary: brand.text, secondary: brand.muted },
      divider: brand.line,
    },
    shape: { borderRadius: 2 },
    typography: {
      fontFamily: sans,
      h1: { fontFamily: sans, fontWeight: 700, fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.02, letterSpacing: "0.02em", textTransform: "uppercase" },
      h2: { fontFamily: sans, fontWeight: 700, fontSize: "2.25rem", lineHeight: 1.12, letterSpacing: "0.01em", textTransform: "uppercase" },
      h3: { fontFamily: sans, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.2, letterSpacing: "0.01em" },
      h4: { fontFamily: sans, fontWeight: 600, fontSize: "1.125rem", lineHeight: 1.3 },
      subtitle1: { fontFamily: sans, fontWeight: 400, fontSize: "1.125rem", color: brand.muted },
      body1: { fontSize: "1rem", lineHeight: 1.7 },
      body2: { fontSize: "0.9375rem", lineHeight: 1.65 },
      overline: { ...label, fontSize: "0.75rem", color: brand.muted },
      button: { ...label, fontSize: "0.8125rem" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: brand.base,
            backgroundImage: "none",
          },
          /**
           * As superfícies que o navegador desenha por conta própria.
           *
           * Seleção, cursor, barra de rolagem e anel de foco vêm com o padrão
           * do sistema, que não pertence a design system nenhum. Vestir os
           * quatro é o sinal mais barato de que a página foi construída.
           */
          "::selection": { backgroundColor: brand.oxblood, color: "#ffffff" },
          html: { caretColor: brand.accent, scrollbarColor: `${brand.line} ${brand.base}`, scrollbarWidth: "thin" },
          "::-webkit-scrollbar": { width: 10, height: 10 },
          "::-webkit-scrollbar-track": { background: brand.base },
          "::-webkit-scrollbar-thumb": { background: brand.line, border: `2px solid ${brand.base}` },
          "::-webkit-scrollbar-thumb:hover": { background: brand.raised },
          ":focus-visible": { outline: `2px solid ${brand.accent}`, outlineOffset: 2 },
          /** Números de tabela alinhados por coluna: atributos e censo são dados. */
          "table, [data-numeric]": { fontVariantNumeric: "tabular-nums" },
        },
      },
      MuiButton: {
        defaultProps: { variant: "contained", disableElevation: true },
        styleOverrides: {
          root: { minHeight: 48, borderRadius: 2, paddingInline: 24, transition: `background-color ${layout.motion}, border-color ${layout.motion}, color ${layout.motion}` },
          containedPrimary: {
            backgroundColor: brand.accent,
            "&:hover": { backgroundColor: brand.accentDim },
          },
          outlined: {
            borderColor: brand.line,
            color: brand.text,
            "&:hover": { borderColor: brand.accent, backgroundColor: "rgba(224,85,97,0.08)" },
          },
          text: { color: brand.text, "&:hover": { backgroundColor: "rgba(224,85,97,0.08)" } },
        },
      },
      MuiCard: {
        defaultProps: { variant: "outlined" },
        styleOverrides: {
          root: {
            backgroundColor: brand.surface,
            backgroundImage: "none",
            borderColor: brand.line,
            boxShadow: "none",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: brand.base,
            backgroundImage: "none",
            borderBottom: `1px solid ${brand.line}`,
            boxShadow: "none",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: brand.surface,
            backgroundImage: "none",
            borderRight: `1px solid ${brand.line}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 2, letterSpacing: "0.06em" },
          colorSecondary: {
            backgroundColor: "transparent",
            color: brand.text,
            border: `1px solid ${brand.line}`,
            fontWeight: 700,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: brand.accent,
            textDecorationColor: "rgba(224,85,97,0.4)",
            textUnderlineOffset: "0.2em",
          },
        },
      },
      MuiTextField: { defaultProps: { fullWidth: true, variant: "outlined" } },
      MuiListSubheader: {
        styleOverrides: { root: { ...label, backgroundColor: "transparent", color: brand.muted } },
      },
    },
  }),
);
