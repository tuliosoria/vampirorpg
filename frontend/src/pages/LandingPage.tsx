import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SEATS } from "@vampiro/content";
import { useApi } from "../api/ApiProvider";
import { Layout } from "../components/Layout";
import { LoadingState } from "../components/LoadingState";
import { HeroVideo } from "../components/HeroVideo";
import { layout } from "../theme";
import type { CampaignSummary } from "../types/api";

const STEPS: { title: string; text: string }[] = [
  {
    title: "Escolha o seu clã",
    text: "Crie um vampiro, escolha o clã a que ele pertence e distribua 10 pontos entre Sangue, Influência, Rebanho e Máscara. Defina o símbolo, o lema e a noite em que foi abraçado.",
  },
  {
    title: "Aja a cada noite",
    text: "Leia o que a Cidade viu e o que só você sabe. Depois escreva o que faz, em texto livre, sem menus rígidos: apenas a sua jogada.",
  },
  {
    title: "A Cidade responde",
    text: "O Narrador resolve a noite: seus atributos mudam, segredos vazam, pactos se rompem e a história avança de um jeito diferente para cada personagem.",
  },
  {
    title: "Acompanhe a crônica",
    text: "Cada acontecimento marcante vira uma imagem na Galeria e entra na wiki viva da Cidade. No fim, você percorre a história inteira como uma crônica ilustrada.",
  },
];

/**
 * Quantos clãs a home apresenta.
 *
 * Derivado do cânone, não escolhido à mão: a crônica nasce vazia e é o Narrador
 * quem cadastra os clãs, então a home não pode citar nenhum pelo nome. Mostra
 * os primeiros que existirem, e nada enquanto não existir nenhum.
 */
const DESTAQUES = 3;

/**
 * Faixa de conteúdo padrão da home. O hero é a única coisa que sangra.
 *
 * O `id` existe para dar link direto a uma seção — e é o que torna a página
 * verificável por captura, já que o hero ocupa a altura da janela inteira e
 * nenhum tamanho de viewport revelaria o que vem abaixo dele.
 */
function Band({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <Container
      id={id}
      component="section"
      maxWidth={false}
      // `alignSelf: center` é o que realmente centraliza aqui, e `mx: auto`
      // sozinho não bastava — foi a primeira tentativa e ela falhou em
      // silêncio. O pai é um Stack, ou seja, um flex em coluna: com
      // `align-items: stretch`, o item é esticado à largura toda, o max-width
      // o corta em 1200 e ele fica ancorado à esquerda. As margens automáticas
      // existem na regra CSS mas nunca chegam a absorver espaço livre.
      sx={{
        maxWidth: layout.maxWidth,
        alignSelf: "center",
        mx: "auto",
        px: { xs: 3, md: 6 },
        scrollMarginTop: 80,
      }}
    >
      {children}
    </Container>
  );
}

/**
 * O título de uma seção.
 *
 * Era um `overline` em caixa alta acima de um `h2` — o rótulo que não diz nada
 * que o título já não diga. O título carrega o próprio peso; a etiqueta acima
 * dele só ocupava espaço e roubava a primeira linha da leitura.
 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="h2" component="h2" sx={{ mb: 3, maxWidth: "26ch" }}>
      {children}
    </Typography>
  );
}

export function LandingPage() {
  const api = useApi();
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [emblems, setEmblems] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getCampaign().then(setCampaign).catch(() => setError("Não foi possível carregar a campanha."));
  }, [api]);

  // Verbetes e brasões enriquecem a home mas não a definem: se o acervo não
  // responder, os blocos caem para o cânone compilado em vez de sumirem.
  useEffect(() => {
    api.getWiki().then((entries) => setEntryCount(entries.length)).catch(() => undefined);
  }, [api]);

  useEffect(() => {
    api
      .getVisualGallery()
      .then((assets) => {
        const found: Record<string, string> = {};
        for (const asset of assets) {
          const key = asset.entityId?.startsWith("emblem-") ? asset.entityId.slice(7) : null;
          if (key) found[key] = asset.thumbnailUrl ?? asset.storageUrl;
        }
        setEmblems(found);
      })
      .catch(() => undefined);
  }, [api]);

  if (error) {
    return (
      <Layout>
        <Alert severity="error">{error}</Alert>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <LoadingState />
      </Layout>
    );
  }

  const lead = campaign.introduction.split("\n\n")[0] ?? "";

  return (
    <Layout bleed>
      <HeroVideo>
        <Box sx={{ maxWidth: layout.maxWidth, mx: "auto", width: "100%" }}>
          <Typography variant="h1" sx={{ maxWidth: 900 }}>
            {campaign.title}
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 3, maxWidth: 620 }}>
            {lead}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 5 }}>
            <Button component={RouterLink} to="/criar" size="large">
              Criar seu vampiro
            </Button>
            <Button component={RouterLink} to="/cidade" variant="outlined" size="large">
              Explorar a Cidade
            </Button>
          </Stack>
        </Box>
      </HeroVideo>

      <Stack spacing={{ xs: 8, md: 12 }} sx={{ py: { xs: 8, md: 12 } }}>
        <Band>
          <SectionTitle>Uma cidade dividida, e nenhum dado sobre a mesa.</SectionTitle>
          <Typography sx={{ color: "text.secondary", maxWidth: 720 }}>
            Cada jogador conduz um vampiro. Não há tabuleiro: você escreve o que faz em texto livre e o
            Narrador costura isso na história da Cidade. A cada noite alguma coisa muda de dono — um
            bairro, um refúgio, um segredo que era seu.
          </Typography>
        </Band>

        <Band id="estado">
          <SectionTitle>O estado da campanha</SectionTitle>
          <Box
            sx={{
              display: "grid",
              gap: 0,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            {[
              { value: String(SEATS.length), label: "Potências na cidade" },
              { value: entryCount === null ? "—" : String(entryCount), label: "Verbetes na crônica" },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  py: 4,
                  borderBottom: 1,
                  borderColor: "divider",
                  borderRight: { sm: 1 },
                  "&:last-of-type": { borderRight: 0 },
                  pr: { sm: 3 },
                }}
              >
                <Typography sx={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1 }}>
                  {stat.value}
                </Typography>
                <Typography variant="overline" sx={{ display: "block", mt: 1 }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Band>

        <Band id="clas">
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ mb: 2, flexWrap: "wrap", gap: 2 }}
          >
            <SectionTitle>Os clãs</SectionTitle>
            <Link component={RouterLink} to="/clas" variant="body2">
              Ver todos
            </Link>
          </Stack>
          <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
            {SEATS.slice(0, DESTAQUES).map((seat) => {
              const key = seat.key;
              return (
                <Card key={key}>
                  <CardActionArea component={RouterLink} to={`/cla/${key}`} sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {emblems[key] && (
                        <Box
                          component="img"
                          src={emblems[key]}
                          alt={`Símbolo do ${seat.name}`}
                          sx={{ width: 56, height: 56, objectFit: "contain", flexShrink: 0 }}
                        />
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h4">{seat.name}</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {seat.seat}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        </Band>

        <Band id="como-se-joga">
          <SectionTitle>Como se joga</SectionTitle>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            }}
          >
            {STEPS.map((step, i) => (
              <Card key={step.title} component="section">
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="overline" sx={{ color: "primary.main" }}>
                    {String(i + 1).padStart(2, "0")}
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 1, mb: 1.5 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {step.text}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Band>

        <Band>
          <Box
            sx={{
              borderTop: 1,
              borderBottom: 1,
              borderColor: "divider",
              py: { xs: 6, md: 8 },
              textAlign: "center",
            }}
          >
            <Typography variant="h2" sx={{ mb: 2 }}>
              A Cidade não espera o amanhecer.
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: 560, mx: "auto", mb: 4 }}>
              Escolha um clã antes que escolham por você.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
              <Button component={RouterLink} to="/criar" size="large">
                Criar seu vampiro
              </Button>
            </Stack>
          </Box>
        </Band>
      </Stack>
    </Layout>
  );
}
