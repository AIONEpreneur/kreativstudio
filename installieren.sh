#!/bin/bash
# Bench Studio — Ein-Befehl-Installation für Mac (und Linux).
# Führt aus: Node prüfen/installieren, Abhängigkeiten laden, ~/.env vorbereiten.
set -e

echo ""
echo "🎬  Kreativstudio wird eingerichtet …"
echo ""

# ---------- 1. Node.js 24 sicherstellen ----------
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local major minor
  major=$(node -p 'process.versions.node.split(".")[0]')
  minor=$(node -p 'process.versions.node.split(".")[1]')
  [ "$major" -gt 22 ] || { [ "$major" -eq 22 ] && [ "$minor" -ge 13 ]; }
}

if node_ok; then
  echo "✓ Node.js $(node --version) ist bereits installiert."
else
  echo "→ Node.js 24 wird über nvm installiert (dein System bleibt unverändert) …"
  export NVM_DIR="$HOME/.nvm"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi
  . "$NVM_DIR/nvm.sh"
  nvm install 24
  nvm use 24
  echo "✓ Node.js $(node --version) installiert."
fi

# ---------- 2. Abhängigkeiten installieren ----------
cd "$(dirname "$0")"
echo "→ Abhängigkeiten werden installiert (dauert 1–2 Minuten) …"
npm install --silent
echo "✓ Abhängigkeiten installiert."

# ---------- 3. ~/.env vorbereiten ----------
ENV_FILE="$HOME/.env"
if grep -q "^FAL_KEY=" "$ENV_FILE" 2>/dev/null; then
  echo "✓ ~/.env mit FAL_KEY ist bereits vorhanden."
else
  {
    echo ""
    echo "# --- Bench Studio ---"
    echo "# Pflicht: Key von https://fal.ai/dashboard/keys (dort Guthaben aufladen, z. B. 10 \$)"
    echo "FAL_KEY=HIER_DEINEN_FAL_KEY_EINTRAGEN"
    echo "# Optional: bessere Prompts — Key von https://aistudio.google.com/apikey"
    echo "# GOOGLE_API_KEY=HIER_EINTRAGEN"
    echo "# Optional: Sprachausgabe — Key von https://elevenlabs.io/app/settings/api-keys"
    echo "# ELEVENLABS_API_KEY=HIER_EINTRAGEN"
  } >> "$ENV_FILE"
  echo "✓ Vorlage in ~/.env angelegt."
fi

echo ""
echo "──────────────────────────────────────────────────────"
echo "Fast geschafft! Noch zwei Schritte:"
echo ""
echo "1. Öffne die Datei ~/.env und trage deinen fal.ai-Key ein:"
echo "   open -e ~/.env"
echo ""
echo "2. Starte danach dein Studio mit:"
echo "   npm run dev"
echo ""
echo "   Dann im Browser öffnen:  http://localhost:5200"
echo "──────────────────────────────────────────────────────"
echo ""
