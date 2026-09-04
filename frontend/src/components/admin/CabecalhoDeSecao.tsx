import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * O título e a frase de toda seção do painel.
 *
 * Existe porque a segunda fileira é uma lista de substantivos — "Contos",
 * "Acervo", "Escriba" — e quem chega para escrever o mundo pela primeira vez
 * não tem como saber o que cada um guarda sem clicar em todos. A frase diz o
 * que se adiciona ali e o que aquilo passa a fazer no jogo depois de salvo.
 *
 * Vive aqui, e não dentro de cada aba, porque antes cinco abas traziam a sua no
 * corpo, duas traziam duas, e catorze não traziam nenhuma. Um só lugar para a
 * explicação é o que garante que a próxima seção também tenha uma.
 */
export function CabecalhoDeSecao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <Box>
      <Typography variant="h4" component="h2" sx={{ mb: 0.5 }}>
        {titulo}
      </Typography>
      {/* Medida curta: a frase é para ser lida, e linha longa demais faz o olho
          perder o começo da seguinte. */}
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "68ch" }}>
        {descricao}
      </Typography>
    </Box>
  );
}
