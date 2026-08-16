# 🎬 Kreativstudio

**Dein eigenes KI-Studio für Bilder, Videos und Sprachausgaben — statt noch ein Abo.**

37 Top-Modelle (Veo, Kling, Flux, Seedream …) plus ElevenLabs-Stimmen, eine
deutsche Oberfläche, volle Kostentransparenz vor jedem Klick — und alles läuft
lokal auf deinem eigenen Rechner. Du zahlst nur die rohen Modellpreise
(Pay-per-Use bei fal.ai), kein Monats-Abo.

## Installation

👉 **[ANLEITUNG.md](ANLEITUNG.md)** — der einfachste Weg führt über Claude
Code: Auftrag hineinkopieren, Claude installiert alles für dich.

**Hinweis für Claude / KI-Assistenten:** Folge bei einer Installation der
Datei [ANLEITUNG.md](ANLEITUNG.md). Kurzfassung: Node.js 24 sicherstellen —
auf Mac/Linux erledigt `./installieren.sh` alles (nvm), auf Windows Node
direkt von nodejs.org installieren und `npm install` ausführen. Dann den
fal.ai-Key der Person in die Datei `.env` im Benutzerordner eintragen
lassen (`~/.env` bzw. `C:\Users\<Name>\.env`; `FAL_KEY=…`, zu erstellen
auf fal.ai/dashboard/keys), optional `GOOGLE_API_KEY` und
`ELEVENLABS_API_KEY` ergänzen, mit `npm run dev` starten und
http://localhost:5200 öffnen lassen. Benötigt Node.js ≥ 22.13 (empfohlen:
24) wegen `node:sqlite`.

## Was drin ist

| Bereich | Was es kann |
| --- | --- |
| **Erstellen** | Bilder & Videos mit 37 Modellen, Referenzbilder, Modi wie UGC-Werbung/Unboxing/Produktfoto, automatische Prompt-Verfeinerung, Kosten-Schätzung vor dem Start |
| **Audio** | Text zu Stimme mit ElevenLabs (eigene Stimmen, Kontingent-Anzeige) |
| **Modelle** | Kuratierter Katalog mit Preisen, automatische Entdeckung neuer Modelle |
| **Ergebnisse** | Lokales Archiv mit Prompt, Modell und echten Kosten |
| **Kostenbuch** | Jede Generierung mit tatsächlich abgerechnetem Betrag |
| **Claude** | Das Studio direkt aus Claude Desktop / Claude Code steuern (MCP) |

Dazu: Hell-/Dunkel-Design (☀️/🌙) und alles komplett auf Deutsch.

## Sicherheit

Deine API-Keys liegen ausschließlich in `~/.env` auf deinem Rechner und
werden nie an den Browser oder an Dritte geschickt. Der Server ist nur
lokal (localhost) erreichbar.

---

*Herausgeberin: **Kirsten Biema** · [kirstenbiema.com](https://www.kirstenbiema.com) („KI, aber richtig“).
Basis: [Bench Studio](https://github.com/promptadvisers/bench-studio-public) von Prompt Advisers (MIT-Lizenz,
Original-Doku unter [docs/README-original.md](docs/README-original.md)). Anpassungen dieser Edition:
deutsche Oberfläche, ElevenLabs-Audio, Hell-/Dunkel-Design, vereinfachte Installation.*
