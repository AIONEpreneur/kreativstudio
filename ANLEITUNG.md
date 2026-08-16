# 🎬 Kreativstudio — dein eigenes KI-Studio statt noch ein Abo

Mit diesem Studio erstellst du **Bilder, Videos und Sprachausgaben** mit den
aktuell besten KI-Modellen (Veo, Kling, Flux, Seedream, ElevenLabs u. v. m.) —
auf deinem eigenen Rechner, mit voller Kostenkontrolle und **ohne
Monats-Abo** bei Anbietern wie Higgsfield.

Das Prinzip: Du zahlst nur die **rohen Modellpreise pro Generierung**
(Pay-per-Use). Ein 8-Sekunden-Video kostet dich z. B. wenige Cent bis ca.
einen Dollar — je nach Modell. Und du siehst **vor jedem Klick**, was es
kosten wird, und danach, was es wirklich gekostet hat.

---

## Was du brauchst (einmalig, ca. 15 Minuten)

| Was | Wofür | Kosten |
| --- | --- | --- |
| **fal.ai-Konto + API-Key** | Bilder & Videos (Pflicht) | Pay-per-Use — Guthaben aufladen, z. B. 10 $, kein Abo |
| **Google-AI-Studio-Key** | Automatische Prompt-Verbesserung (optional) | Kostenlose Stufe reicht |
| **ElevenLabs-Konto + Key** | Sprachausgabe / Voiceover (optional) | Gratis-Kontingent (10.000 Zeichen/Monat); mehr ab 5 $/Monat |
| **Einen Mac oder Linux-Rechner** | Das Studio läuft lokal bei dir | — |

> 💡 **Wichtig:** fal.ai ist reines Pay-per-Use — du lädst Guthaben auf und
> zahlst nur, was du nutzt. Nur ElevenLabs (Stimmen) hat ein eigenes
> Kontingent-Modell mit Gratis-Stufe.

---

## Der einfachste Weg: Lass Claude das für dich machen

Wenn du **Claude Code** hast (kennst du aus dem Sprint 😉), musst du fast
nichts selbst tun. Öffne Claude Code und füge diesen Auftrag ein:

> Installiere mir das Kreativstudio von <DEIN-REPO-LINK-HIER> in einen Ordner
> „mein-kreativstudio“. Führe das Skript installieren.sh aus, hilf mir danach,
> meinen fal.ai-Key in ~/.env einzutragen (ich erstelle ihn auf
> fal.ai/dashboard/keys), starte das Studio mit npm run dev und sag mir, wann
> ich http://localhost:5200 öffnen kann.

Claude erledigt den Rest und sagt dir genau, wann du was tun musst.
Die Schritte darunter brauchst du dann nur, wenn du es lieber selbst machst.

---

## Schritt 1: Studio herunterladen

Öffne das Programm **Terminal** (auf dem Mac: `cmd + Leertaste` → „Terminal“
tippen → Enter) und füge diese zwei Zeilen ein:

```bash
git clone <DEIN-REPO-LINK-HIER> mein-kreativstudio
cd mein-kreativstudio
```

## Schritt 2: Installieren (ein Befehl)

```bash
./installieren.sh
```

Das Skript prüft, ob Node.js da ist (installiert es sonst automatisch),
lädt alle Bausteine und legt dir eine Vorlage für deine Keys an.

## Schritt 3: Deinen fal.ai-Key eintragen

1. Konto anlegen auf **[fal.ai](https://fal.ai)** → oben rechts **Dashboard**
2. Unter **Billing** Guthaben aufladen (10 $ reichen für den Anfang)
3. Unter **Keys** einen neuen API-Key erstellen und kopieren
4. Im Terminal die Key-Datei öffnen:

```bash
open -e ~/.env
```

5. Dort `HIER_DEINEN_FAL_KEY_EINTRAGEN` durch deinen echten Key ersetzen
   und speichern.

**Optional dazu (empfohlen):**
- **Google-Key** (macht aus deiner kurzen Idee automatisch einen starken,
  modell-spezifischen Prompt): auf
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey) erstellen
  und in derselben Datei bei `GOOGLE_API_KEY=` eintragen (das `#` am
  Zeilenanfang entfernen).
- **ElevenLabs-Key** (für den Audio-Reiter): auf
  [elevenlabs.io](https://elevenlabs.io/app/settings/api-keys) erstellen und
  bei `ELEVENLABS_API_KEY=` eintragen (auch hier das `#` entfernen).

## Schritt 4: Starten

```bash
npm run dev
```

Dann im Browser öffnen: **http://localhost:5200**

Fertig. 🎉

> Zum Beenden im Terminal `Ctrl + C` drücken. Beim nächsten Mal reicht:
> im Projektordner wieder `npm run dev` ausführen.

---

## Was kann das Studio?

- **Erstellen** — Bilder und Videos mit 37 Top-Modellen. Referenzbild
  anhängen (z. B. dein Produktfoto), Modus wählen (UGC-Werbung, Unboxing,
  Produktfoto …), Idee in normalen Worten hinschreiben, „Prompt verfeinern“
  klicken — das Studio schreibt daraus den optimalen Prompt für genau dieses
  Modell. Du siehst die **geschätzten Kosten vor dem Start**.
- **Audio** — Text eingeben, Stimme aus deinem ElevenLabs-Konto wählen,
  fertig ist das Voiceover für Reels, Kurse oder Videos.
- **Modelle** — der Katalog zeigt alle Modelle mit Preis, Tempo und dem, was
  sie als Eingabe akzeptieren. Neue Modelle werden automatisch entdeckt.
- **Ergebnisse** — alles, was du erstellst, wird **lokal auf deinem Rechner**
  gespeichert, mit Prompt, Modell und echten Kosten.
- **Kostenbuch** — jede Generierung mit tatsächlich abgerechnetem Betrag.
  Keine Wundertüten-Credits.
- **Claude verbinden** — wer Claude Desktop oder Claude Code nutzt, kann das
  Studio auch direkt von dort steuern („Erstelle mir ein UGC-Video von …“).
  Der Reiter „Claude verbinden“ führt dich in drei einfachen Schritten durch.
- **Hell & Dunkel** — oben rechts kannst du zwischen hellem und dunklem
  Design umschalten (☀️/🌙).

---

## Häufige Fragen

**Muss ich programmieren können?**
Nein. Installation ist Copy-and-paste, danach ist alles klickbare Oberfläche.

**Was kostet mich das im Monat?**
Nur was du generierst. Bilder oft 1–5 Cent, Videos je nach Modell ein paar
Cent bis ca. 1 $ für 8 Sekunden. Ohne Nutzung: 0 €.

**Sind meine Keys sicher?**
Ja. Die Keys liegen nur in der Datei `~/.env` auf deinem Rechner und werden
nie an den Browser oder an Dritte geschickt.

**„Der Studio-Server ist nicht erreichbar“?**
Meist fehlt der FAL_KEY in `~/.env`, oder das Studio wurde nach dem
Eintragen nicht neu gestartet (`Ctrl + C`, dann wieder `npm run dev`).

**Es klappt etwas nicht — was tun?**
Terminal-Meldung kopieren und in Claude einfügen mit der Bitte, das Problem
zu lösen. Claude kennt dieses Projekt-Setup.

---

*Herausgeberin dieser Edition: **Kirsten Biema** · [kirstenbiema.com](https://www.kirstenbiema.com)
(„KI, aber richtig“). Angepasst für diese Community: deutsche Oberfläche,
ElevenLabs-Sprachausgabe, Hell-/Dunkel-Design, vereinfachte Installation.
Basis: das Open-Source-Projekt
[Bench Studio](https://github.com/promptadvisers/bench-studio-public) (MIT-Lizenz).*
