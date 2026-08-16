import React, { useEffect, useMemo, useRef, useState } from "react";

// Sprachausgabe mit ElevenLabs. Gleiche Idee wie beim Bild- und Video-Teil:
// Text rein, Stimme wählen, Ergebnis landet lokal und im Verlauf.

async function readJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    let message = `${response.status} ${response.statusText || "Anfrage fehlgeschlagen"}`;
    try { message = JSON.parse(text).error || message; } catch {}
    throw new Error(message);
  }
  return JSON.parse(text);
}

function voiceDescription(voice) {
  const labels = voice.labels ?? {};
  return [labels.gender, labels.age, labels.accent, labels.description, labels.use_case]
    .filter(Boolean).join(" · ");
}

export default function Audio({ onGenerated }) {
  const [status, setStatus] = useState(null);
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState("");
  const [modelId, setModelId] = useState("eleven_multilingual_v2");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const previewRef = useRef(null);

  useEffect(() => {
    readJson("/api/audio/status").then(setStatus).catch(() => setStatus({ configured: false, models: [] }));
  }, []);

  useEffect(() => {
    if (!status?.configured) return;
    readJson("/api/audio/voices")
      .then(({ voices: list }) => {
        setVoices(list);
        setVoiceId((current) => current || list[0]?.voice_id || "");
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [status?.configured]);

  const voice = useMemo(() => voices.find((v) => v.voice_id === voiceId) ?? null, [voices, voiceId]);
  const model = useMemo(
    () => (status?.models ?? []).find((m) => m.id === modelId) ?? null,
    [status, modelId]
  );
  const maxChars = status?.max_chars ?? 5000;
  const credits = model ? Math.ceil(text.trim().length * (model.credits_per_char ?? 1)) : text.trim().length;

  function playPreview() {
    if (!voice?.preview_url) return;
    previewRef.current?.pause();
    previewRef.current = new window.Audio(voice.preview_url);
    previewRef.current.play().catch(() => {});
  }

  async function generate() {
    const cleanText = text.trim();
    if (!cleanText || !voiceId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await readJson("/api/audio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanText, voiceId, voiceName: voice?.name ?? null, modelId }),
      });
      setResults((current) => [result.ledger, ...current]);
      onGenerated?.(result);
    } catch (e) {
      setError(String(e.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="view-page" id="audio">
      <div className="view-heading">
        <div>
          <div className="eyebrow">Audio</div>
          <h1>Text wird <em>Stimme</em>.</h1>
          <p>Voiceover für Reels, Videos und Kurse — mit ElevenLabs, direkt aus deinem Studio.</p>
        </div>
      </div>

      {status && !status.configured && (
        <section className="error-notice info" role="alert">
          <div>
            <strong>ElevenLabs ist noch nicht verbunden</strong>
            <p>
              Trage deinen Key als <code>ELEVENLABS_API_KEY=…</code> in die Datei <code>~/.env</code> ein
              und starte das Studio neu. Den Key findest du im ElevenLabs-Konto unter „API Keys“.
            </p>
          </div>
          <div className="error-actions">
            <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noreferrer">ElevenLabs öffnen</a>
          </div>
        </section>
      )}

      {status?.configured && (
        <div className="creator">
          <div className="creator-head">
            <h2>Was soll gesprochen werden?</h2>
            <span>{voices.length ? `${voices.length} Stimmen in deinem Konto` : "Stimmen werden geladen"}</span>
          </div>

          <div className="bar audio-bar">
            <div className="bar-top">
              <textarea
                id="audio-text"
                name="audio-text"
                value={text}
                maxLength={maxChars}
                placeholder="Schreibe hier den Text, der gesprochen werden soll…"
                onChange={(e) => setText(e.target.value)}
              />
              <button type="button" className="go" onClick={generate} disabled={busy || !text.trim() || !voiceId}>
                {busy ? "Erstellt…" : "Sprachausgabe erstellen"}
              </button>
            </div>

            <div className="bar-chips">
              <span className="chip">
                <select
                  aria-label="Stimme"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  {voices.map((v) => (
                    <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                  ))}
                </select>
              </span>
              {voice?.preview_url && (
                <button type="button" className="ghost-btn" onClick={playPreview}>Stimme anhören</button>
              )}
              <span className="chip">
                <select
                  aria-label="Modell"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                >
                  {(status.models ?? []).map((m) => (
                    <option key={m.id} value={m.id}>{m.label} — {m.note}</option>
                  ))}
                </select>
              </span>
              <span className="bar-price exact" title="ElevenLabs rechnet in Zeichen-Kontingent (Credits), nicht in Euro.">
                <span>Verbrauch</span>
                <b>{text.trim().length} Zeichen ≈ {credits} Credits</b>
              </span>
            </div>
          </div>

          {voice && <p className="hint"><span>{voiceDescription(voice) || "Eigene Stimme aus deinem ElevenLabs-Konto."}</span></p>}
        </div>
      )}

      {error && (
        <section className="error-notice" role="alert">
          <div>
            <strong>Das hat nicht geklappt</strong>
            <p>{error}</p>
          </div>
          <div className="error-actions">
            <button type="button" onClick={() => setError(null)}>Schließen</button>
          </div>
        </section>
      )}

      {results.length > 0 && (
        <div className="wall results-wall">
          <div className="wall-head">
            <h2>Frisch erstellt</h2>
            <span>{results.length} {results.length === 1 ? "Aufnahme" : "Aufnahmen"}</span>
            <div className="rule" />
            <span>liegt auch unter „Ergebnisse“</span>
          </div>
          <div className="audio-results">
            {results.map((row) => (
              <article className="ledger-row" key={row.request_id}>
                <div className="ledger-row-head">
                  <div>
                    <strong>{row.label}</strong>
                    <span>{row.characters} Zeichen · {row.cost_basis}</span>
                  </div>
                  <a href={row.outputs[0]?.local_url} download>Herunterladen</a>
                </div>
                <audio controls src={row.outputs[0]?.local_url} style={{ width: "100%" }} />
                <p>{row.raw_idea}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
