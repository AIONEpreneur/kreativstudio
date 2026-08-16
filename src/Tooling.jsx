import React, { useEffect, useMemo, useState } from "react";

// „Claude verbinden“ — bewusst unlocker und Schritt für Schritt, damit auch
// Nicht-Techniker:innen ankommen. Die Fachbegriffe (MCP, Codex, Cursor)
// stehen erst hinter „Für Fortgeschrittene“.

export default function Tooling() {
  const [config, setConfig] = useState(null);
  const [copied, setCopied] = useState(false);
  const [client, setClient] = useState("claude");

  useEffect(() => {
    fetch("/api/tooling").then((response) => response.json()).then(setConfig).catch(() => {});
  }, []);

  const snippet = useMemo(() => {
    if (!config) return "Lokale Konfiguration wird geladen…";
    if (client === "codex") {
      return [
        "[mcp_servers.kreativstudio]",
        `command = ${JSON.stringify(config.command)}`,
        `args = ${JSON.stringify(config.args)}`,
        "",
        "[mcp_servers.kreativstudio.env]",
        `BENCH_URL = ${JSON.stringify(config.environment.BENCH_URL)}`,
      ].join("\n");
    }
    return JSON.stringify({
      mcpServers: {
        kreativstudio: {
          command: config.command,
          args: config.args,
          env: config.environment,
        },
      },
    }, null, 2);
  }, [client, config]);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="connect-page">
      <div className="connect-hero">
        <div>
          <div className="eyebrow">Claude verbinden</div>
          <h1>Sag Claude einfach, was du brauchst.</h1>
          <p>
            Einmal verbunden, kannst du in Claude schreiben: „Erstelle mir ein Produktfoto von meiner
            Kerze auf einem Frühstückstisch“ — und Claude nutzt dafür dein Studio, mit deinen Modellen
            und deiner Kostenübersicht. Ganz ohne diese Oberfläche zu öffnen.
          </p>
        </div>
        <span className="local-pill"><i /> Alles bleibt auf deinem Rechner</span>
      </div>

      <div className="connect-grid">
        <article className="connect-card connect-config">
          <div className="connect-card-head">
            <div><span>01</span><h2>Diesen Text kopieren</h2></div>
            <button type="button" onClick={copy}>{copied ? "✓ Kopiert" : "Kopieren"}</button>
          </div>
          <p>
            Klick einfach auf <strong>Kopieren</strong> — was da genau drinsteht, musst du nicht
            verstehen. Es ist die „Adresse“, unter der Claude dein Studio findet. Dein Studio
            erzeugt diesen Text speziell für deinen Rechner — deshalb steht dort dein
            Benutzername drin. Er verlässt deinen Computer nicht.
          </p>
          <pre tabIndex="0" aria-label="Verbindungs-Text für Claude Desktop"><code>{snippet}</code></pre>
        </article>

        <article className="connect-card">
          <div className="connect-card-head">
            <div><span>02</span><h2>In Claude Desktop einfügen</h2></div>
          </div>
          <ol className="connect-steps">
            <li>Öffne <strong>Claude Desktop</strong> (das Claude-Programm auf deinem Mac).</li>
            <li>Oben in der Menüleiste: <strong>Claude → Einstellungen</strong> (oder <code>⌘ + ,</code>).</li>
            <li>Links auf <strong>Entwickler</strong> klicken, dann auf <strong>„Konfiguration bearbeiten“</strong>.</li>
            <li>Es öffnet sich eine Textdatei. <strong>Alles darin löschen</strong> und den kopierten Text einfügen. Speichern (<code>⌘ + S</code>).</li>
            <li>Claude Desktop <strong>komplett beenden und neu starten</strong>.</li>
          </ol>
        </article>

        <article className="connect-card">
          <div className="connect-card-head">
            <div><span>03</span><h2>Ausprobieren</h2></div>
          </div>
          <p>Wichtig: Dein Studio muss dabei laufen (das Terminal-Fenster mit <code>npm run dev</code> offen lassen). Dann schreib in Claude zum Beispiel:</p>
          <p className="example-prompt">„Erstelle mir mit dem Kreativstudio ein 9:16-Video: eine Frau zeigt begeistert meine Handcreme in ihrem Badezimmer.“</p>
          <div className="connect-note">
            Claude sucht das passende Modell, schreibt den Prompt, zeigt dir vorher die Kosten —
            und das Ergebnis landet wie immer unter „Ergebnisse“.
          </div>
        </article>
      </div>

      <details className="connect-advanced">
        <summary>Für Fortgeschrittene: Claude Code, Codex, Cursor &amp; Skill</summary>
        <div className="connect-grid">
          <article className="connect-card connect-config">
            <div className="connect-card-head">
              <div><h2>Andere Programme verbinden</h2></div>
              <button type="button" onClick={copy}>{copied ? "✓ Kopiert" : "Kopieren"}</button>
            </div>
            <div className="client-switch" role="tablist" aria-label="Programm wählen">
              <button type="button" role="tab" aria-selected={client === "claude"} className={client === "claude" ? "active" : ""} onClick={() => setClient("claude")}>Claude Desktop / Code</button>
              <button type="button" role="tab" aria-selected={client === "codex"} className={client === "codex" ? "active" : ""} onClick={() => setClient("codex")}>Codex</button>
              <button type="button" role="tab" aria-selected={client === "cursor"} className={client === "cursor" ? "active" : ""} onClick={() => setClient("cursor")}>Cursor</button>
            </div>
            <pre tabIndex="0" aria-label="MCP-Konfiguration"><code>{snippet}</code></pre>
            <p>
              Für <strong>Claude Code</strong> geht es auch mit einem Satz im Terminal:
              {" "}<code>claude mcp add kreativstudio -- {config ? `${config.command} ${config.args?.join(" ")}` : "…"}</code>
            </p>
          </article>

          <article className="connect-card connect-skill">
            <div className="connect-card-head">
              <div><h2>Skill für Claude Code</h2></div>
              <a className="connect-primary-action" href={config?.skill?.download_url ?? "/api/tooling/skill"} download>ZIP herunterladen</a>
            </div>
            <p>Der Skill gibt Claude Code zusätzlich Urteilsvermögen mit: welches Modell wofür, Umgang mit Referenzbildern, Kostendisziplin.</p>
            <p className="install-path">Entpacken nach <code>{config?.skill?.installs?.claude_code ?? "~/.claude/skills/bench-studio"}</code></p>
          </article>
        </div>
      </details>
    </section>
  );
}
