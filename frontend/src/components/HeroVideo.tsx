import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ReactNode } from "react";
import { brand } from "../theme";

// A crônica nasce sem mídia própria: enquanto estes dois arquivos não existirem
// em `public/`, o hero cai no fundo sólido do tema e a home continua inteira.
const VIDEO = "/hero.mp4";
const POSTER = "/hero-poster.jpg";

/**
 * O fundo de vídeo da home, com o texto por cima.
 *
 * Hero em vídeo falha de três maneiras conhecidas, e as três têm defesa aqui:
 *
 * 1. O primeiro quadro demora. O `poster` cobre o intervalo, então nunca há
 *    um retângulo preto.
 * 2. O navegador nega o autoplay. Como o vídeo é mudo, isso é raro — e se
 *    acontecer, o poster continua no lugar e a página não perde nada.
 * 3. O usuário pediu menos movimento, ou está no celular pagando dados. Aí o
 *    `<video>` não é montado: sem elemento, sem download dos 2,9 MB.
 *
 * O vídeo é diurno e claro — céu azul, floresta verde — e a paleta do site é
 * grafite quase preto. Sem tratamento, ou o texto fica ilegível ou o véu mata
 * a arte. O acordo é rebaixar saturação e brilho no próprio vídeo e escurecer
 * só a base com um gradiente, deixando o topo do quadro legível como imagem.
 */
export function HeroVideo({ children }: { children: ReactNode }) {
  // `noSsr` porque a decisão precisa valer já na primeira pintura: montar o
  // vídeo e removê-lo em seguida desperdiçaria justamente o download que a
  // preferência do usuário pede para evitar.
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });
  const narrow = useMediaQuery("(max-width: 900px)", { noSsr: true });
  const showVideo = !reducedMotion && !narrow;

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: { xs: "72vh", md: "88vh" },
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
        // O chão do hero é desenhado, não emprestado do vídeo.
        //
        // A crônica nasce sem mídia, e um hero que só existia quando o vídeo
        // carregava deixava seiscentos pixels de preto no topo da home — que é
        // exatamente o que faz um site parecer quebrado. O oxblood profundo
        // sobe pela esquerda como uma luz baixa; o poster entra por cima
        // quando existir, e some sem deixar buraco quando não existir.
        backgroundColor: brand.base,
        backgroundImage:
          `url(${POSTER}), ` +
          `radial-gradient(95% 78% at 22% 82%, ${brand.oxblood} 0%, ${brand.oxbloodDeep} 38%, ${brand.base} 78%)`,
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
      }}
    >
      {showVideo && (
        <Box
          component="video"
          data-testid="hero-video"
          src={VIDEO}
          poster={POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "saturate(0.72) brightness(0.62)",
          }}
        />
      )}

      {/* Gradiente da base para o texto ter contraste, mais vinheta para
          fechar as bordas. Decorativos, então fora da árvore de acessibilidade. */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          background:
            `linear-gradient(to top, ${brand.base} 1%, rgba(16,16,16,0.6) 22%, transparent 55%),` +
            "radial-gradient(120% 90% at 50% 30%, transparent 45%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <Box sx={{ position: "relative", width: "100%", px: { xs: 3, md: 6 }, pb: { xs: 6, md: 10 } }}>
        {children}
      </Box>
    </Box>
  );
}
