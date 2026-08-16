import React, { useEffect, useMemo, useState } from "react";

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
        "[mcp_servers.bench-studio]",
        `command = ${JSON.stringify(config.command)}`,
        `args = ${JSON.stringify(config.args)}`,
        "",
        "[mcp_servers.bench-studio.env]",
        `BENCH_URL = ${JSON.stringify(config.environment.BENCH_URL)}`,
      ].join("\n");
    }
    return JSON.stringify({
      mcpServers: {
        "bench-studio": {
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
          <div className="eyebrow">Claude & Co.</div>
          <h1>Nutze dein Studio direkt aus Claude.</h1>
          <p>Claude Desktop, Claude Code und andere KI-Werkzeuge können denselben Modell-Katalog, dieselbe Generierung und dasselbe Kostenbuch nutzen wie diese Oberfläche.</p>
        </div>
        <span className="local-pill"><i /> Läuft auf deinem Rechner</span>
      </div>

      <div className="connect-grid">
        <article className="connect-card connect-skill">
          <div className="connect-card-head">
            <div><span>01</span><h2>Skill installieren</h2></div>
            <a className="connect-primary-action" href={config?.skill?.download_url ?? "/api/tooling/skill"} download>ZIP herunterladen</a>
          </div>
          <p>Gibt Claude Code den kompletten Arbeitsablauf mit: Modellauswahl, Umgang mit Referenzen, Kostendisziplin und lokale Ablage.</p>
          <div className="skill-package">
            <div className="skill-package-mark" aria-hidden="true"><i /><i /><i /></div>
            <div><strong>Bench-Studio-Skill</strong><span>Portabel · enthält keine Zugangsdaten</span></div>
            <small>v{config?.skill?.version ?? "0.2.0"}</small>
          </div>
          <p className="install-path">Entpacken nach <code>{client === "codex" ? (config?.skill?.installs?.codex ?? "~/.codex/skills/bench-studio") : (config?.skill?.installs?.claude_code ?? "~/.claude/skills/bench-studio")}</code></p>
        </article>

        <article className="connect-card connect-config">
          <div className="connect-card-head">
            <div><span>02</span><h2>Live-Werkzeuge verbinden</h2></div>
            <button type="button" onClick={copy}>{copied ? "Kopiert" : "Konfiguration kopieren"}</button>
          </div>
          <p>Der MCP-Server kann alles, was diese Oberfläche kann. Das Studio muss dafür laufen; Konfiguration einfügen, dann das Programm einmal neu starten.</p>
          <div className="client-switch" role="tablist" aria-label="MCP-Programm">
            <button type="button" role="tab" aria-selected={client === "claude"} className={client === "claude" ? "active" : ""} onClick={() => setClient("claude")}>Claude Desktop</button>
            <button type="button" role="tab" aria-selected={client === "codex"} className={client === "codex" ? "active" : ""} onClick={() => setClient("codex")}>Codex</button>
            <button type="button" role="tab" aria-selected={client === "cursor"} className={client === "cursor" ? "active" : ""} onClick={() => setClient("cursor")}>Cursor</button>
          </div>
          <pre tabIndex="0" aria-label={`MCP-Konfiguration für ${client === "codex" ? "Codex" : client === "cursor" ? "Cursor" : "Claude Desktop"}`}><code>{snippet}</code></pre>
        </article>

        <article className="connect-card">
          <div className="connect-card-head"><div><span>03</span><h2>Einfach normal fragen</h2></div></div>
          <p className="example-prompt">„Such ein günstiges Video-Modell, das zwei Produktbilder annimmt, erstelle eine 9:16-UGC-Anzeige und speichere das Ergebnis lokal.“</p>
          <div className="connect-note">Skill = Urteilsvermögen und Arbeitsablauf. MCP = Live-Katalog, Generierung, Ergebnisse und Kosten.</div>
        </article>
      </div>

      <section className="tool-list-section">
        <div className="tool-list-head">
          <div><h2>Die wichtigsten Werkzeuge</h2><p>Dieselbe Datenbasis wie die Oberfläche: Modelle, Generierung, Ergebnisse, Kosten.</p></div>
          <span>{config?.tools?.length ?? 7} Werkzeuge</span>
        </div>
        <div className="tool-list">
          {[
            ["list_models", "Aktuelle Bild- und Video-Modelle nach Ausgabe und Eingabe entdecken."],
            ["get_model_capabilities", "Genaue Eingabefelder, Grenzen und Prüf-Nachweise eines Modells ansehen."],
            ["upload_media", "Eine lokale Datei archivieren und als Modell-Eingabe vorbereiten."],
            ["create_media", "Mit präzisen Modell-Parametern und zugeordneten Eingaben generieren."],
            ["list_results", "Die letzten Ergebnisse mit lokalen und externen Links lesen."],
            ["get_usage", "Abgerechnete Ausgaben und den Zustand des lokalen Archivs prüfen."],
            ["sync_models", "Bei fal nach neu veröffentlichten Modellen suchen."],
          ].map(([name, description]) => (
            <article key={name}><code>{name}</code><p>{description}</p></article>
          ))}
        </div>
      </section>
    </section>
  );
}
