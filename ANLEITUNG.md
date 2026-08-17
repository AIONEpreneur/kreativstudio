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
| **Einen Computer (Mac, Windows oder Linux)** | Das Studio läuft lokal bei dir | — |

> 💡 **Wichtig:** fal.ai ist reines Pay-per-Use — du lädst Guthaben auf und
> zahlst nur, was du nutzt. Nur ElevenLabs (Stimmen) hat ein eigenes
> Kontingent-Modell mit Gratis-Stufe.

---

## So bekommst du dein Studio

Du brauchst **kein Terminal** und musst nichts von Hand installieren —
das übernimmt Claude für dich.

1. Öffne **Claude Code** (kennst du aus dem Sprint 😉).
2. Kopiere diesen Auftrag hinein und schick ihn ab:

> Lies das Repository https://github.com/AIONEpreneur/kreativstudio und
> installiere mir daraus das Kreativstudio in einen Ordner
> „mein-kreativstudio“. Sorge zuerst dafür, dass Node.js 24 installiert ist
> (Mac: das Skript installieren.sh erledigt alles; Windows: Node direkt von
> nodejs.org installieren, dann npm install ausführen). Hilf mir danach
> Schritt für Schritt, meinen fal.ai-Key in die Datei .env in meinem
> Benutzerordner einzutragen — ich erstelle ihn auf fal.ai/dashboard/keys,
> sag mir genau, wo ich klicken muss. Starte dann das Studio und sag mir,
> wann ich http://localhost:5200 im Browser öffnen kann.

3. Claude erledigt den Rest und sagt dir genau, wann du was tun musst.
   Das Einzige, was du selbst machst: einmal ein Konto bei
   **[fal.ai](https://fal.ai)** anlegen und dort Guthaben aufladen
   (10 $ reichen für den Anfang) — Claude führt dich hindurch.

**Später wieder starten?** Sag Claude einfach: „Starte mein Kreativstudio.“

**Stimmen (Audio) oder bessere Prompts freischalten?** Sag Claude:
„Hilf mir, meinen ElevenLabs-Key / Google-Key ins Kreativstudio einzutragen.“

---

<details>
<summary><strong>Für Selbermacher: Installation ohne Claude (optional, Mac/Linux)</strong></summary>

Terminal öffnen (Mac: `cmd + Leertaste` → „Terminal“) und nacheinander:

```bash
git clone https://github.com/AIONEpreneur/kreativstudio mein-kreativstudio
cd mein-kreativstudio
./installieren.sh
```

Dann den fal.ai-Key (von [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys))
in die Datei `~/.env` eintragen (`open -e ~/.env`), optional Google- und
ElevenLabs-Key ergänzen, und starten mit:

```bash
npm run dev
```

Im Browser öffnen: **http://localhost:5200** — fertig. 🎉

</details>

---

## Was kann das Studio?

- **Erstellen** — Bilder und Videos mit 37 Top-Modellen. Referenzbild
  anhängen (z. B. dein Produktfoto), Modus wählen (UGC-Werbung, Unboxing,
  Produktfoto …), Idee in normalen Worten hinschreiben, „Generieren“ klicken.
  Du siehst die **geschätzten Kosten vor dem Start**. Mit dem optionalen
  Google-Key erscheint zusätzlich „Prompt verfeinern“: Das Studio übersetzt
  deine Idee dann erst in einen Profi-Prompt für genau dieses Modell, den du
  vor dem Generieren prüfen und anpassen kannst.
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

## Wo werden meine Bilder und Videos gespeichert?

Alles bleibt **lokal auf deinem Rechner** — in deinem Studio-Ordner unter
`mein-kreativstudio/data/`:

- **`data/outputs/`** — alle fertigen Bilder, Videos und Audio-Dateien (PNG, MP4, MP3)
- **`data/inputs/`** — Kopien der Referenzbilder, die du hochgeladen hast
- **`data/bench.db`** — die kleine Datenbank dazu: welcher Prompt, welches Modell, was es gekostet hat

Im Alltag brauchst du diesen Ordner nicht: Der Reiter **„Ergebnisse“** zeigt
alles mit Vorschau, und jedes Ergebnis hat einen **„Herunterladen“**-Knopf,
mit dem du die Datei dorthin speicherst, wo du sie haben willst (z. B. in
deinen Projektordner fürs nächste Reel).

Gut zu wissen: Wenn du ein Ergebnis im Studio löschst, verschwinden die
lokale Datei und der Eintrag im Kostenbuch — der Modell-Anbieter (fal) kann
auf seinen Servern aber eine Kopie behalten, darauf hat das Studio keinen
Zugriff. Und wer viel Video generiert: Der `data/`-Ordner wächst mit der
Zeit — alte Ergebnisse kannst du einfach im Studio löschen.

---

## Häufige Fragen

**Läuft das auch auf Windows?**
Ja — über den Claude-Weg oben funktioniert es auch auf Windows (Claude
installiert Node dann direkt statt über das Mac-Skript). Entwickelt und
ausgiebig getestet haben wir auf dem Mac; wenn auf Windows etwas hakt, gib
Claude einfach die Fehlermeldung. Die Key-Datei liegt dort unter
`C:\Users\<DeinName>\.env`.

**Wie erfahre ich von Updates?**
Gar nicht nötig, dich darum zu kümmern: Das Studio prüft beim Öffnen selbst,
ob es eine neue Version gibt, und zeigt dir dann oben einen Hinweis — mit dem
fertigen Satz, den du Claude sagst. Installiert wird nie etwas automatisch.

**Muss ich programmieren können oder das Terminal benutzen?**
Nein. Du kopierst einen Auftrag in Claude Code, Claude macht den Rest.
Danach ist alles klickbare Oberfläche im Browser.

**Was kostet mich das im Monat?**
Nur was du generierst. Bilder oft 1–5 Cent, Videos je nach Modell ein paar
Cent bis ca. 1 $ für 8 Sekunden. Ohne Nutzung: 0 €.

**Sind meine Keys sicher?**
Ja. Die Keys liegen nur in der Datei `~/.env` auf deinem Rechner und werden
nie an den Browser oder an Dritte geschickt.

**„Der Studio-Server ist nicht erreichbar“?**
Meist fehlt der fal.ai-Key oder das Studio läuft gerade nicht. Sag Claude:
„Mein Kreativstudio ist offline — starte es und prüfe, ob mein Key stimmt.“

**Es klappt etwas nicht — was tun?**
Sag es Claude, am besten mit der Fehlermeldung, die du siehst. Claude kennt
dieses Projekt und löst so etwas in der Regel selbstständig.

---

*Herausgeberin dieser Edition: **Kirsten Biema** · [kirstenbiema.com](https://www.kirstenbiema.com)
(„KI, aber richtig“). Angepasst für diese Community: deutsche Oberfläche,
ElevenLabs-Sprachausgabe, Hell-/Dunkel-Design, vereinfachte Installation.
Basis: das Open-Source-Projekt
[Bench Studio](https://github.com/promptadvisers/bench-studio-public) (MIT-Lizenz).*
