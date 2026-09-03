#!/usr/bin/env bash
# Rebuilds the Lambda layers used by the visual encyclopedia worker/seed.
# These layers are gitignored (large binaries / images) and must be rebuilt
# before `sam deploy` on a fresh checkout.
#
#   1. sharp layer  -> layers/sharp/nodejs/node_modules  (linux-x64 native binaries)
#   2. seed images  -> layers/seed-images/seed-images/ (montada em /opt/seed-images)
#
# Usage: from backend/:  bash scripts/build-layers.sh
set -euo pipefail

SHARP_VERSION="0.35.3"
HERE="$(cd "$(dirname "$0")/.." && pwd)"          # backend/
REPO="$(cd "$HERE/.." && pwd)"

echo "==> Building sharp linux-x64 layer (sharp@$SHARP_VERSION)"
rm -rf "$HERE/layers/sharp"
mkdir -p "$HERE/layers/sharp"
# Install OUTSIDE the npm workspace tree so deps are not hoisted to the repo root.
TMP_SHARP="$(mktemp -d)"
mkdir -p "$TMP_SHARP/nodejs"
( cd "$TMP_SHARP/nodejs" \
    && npm init -y >/dev/null \
    && npm install --cpu=x64 --os=linux --libc=glibc "sharp@$SHARP_VERSION" >/dev/null )
test -f "$TMP_SHARP/nodejs/node_modules/@img/sharp-linux-x64/lib/sharp-linux-x64-$SHARP_VERSION.node" \
  || { echo "ERROR: linux-x64 sharp binary missing"; rm -rf "$TMP_SHARP"; exit 1; }
cp -R "$TMP_SHARP/nodejs" "$HERE/layers/sharp/nodejs"
rm -rf "$TMP_SHARP"
echo "    sharp layer ready"

# A cronica nasce sem acervo: nao ha arte previa para montar. A camada existe
# vazia porque o template a monta em /opt/seed-images e o worker espera o
# caminho existir; quem a povoa e o Narrador, pelo Estudio.
echo "==> Camada de imagens-semente (vazia por enquanto)"
rm -rf "$HERE/layers/seed-images"
mkdir -p "$HERE/layers/seed-images/seed-images"
# Um arquivo de verdade, e nao um .keep: dotfile e excluido do zip, e a Lambda
# recusa camada com arquivo vazio ("Uploaded file must be a non-empty zip").
cat > "$HERE/layers/seed-images/seed-images/LEIA-ME.txt" <<'TXT'
As imagens canonicas da cronica vivem aqui, montadas em /opt/seed-images.
Nascem vazias de proposito: quem povoa o acervo e o Narrador, pelo Estudio.
TXT
echo "==> Layers prontas. Pode rodar sam deploy."
