import React from "react";

// Every generation this machine has ever made, and what it cost. This is the
// artifact you can put on screen and let someone read.

export default function Ledger({ ledger, onClose }) {
  const { rows, summary } = ledger;
  const runs = summary?.total_generations ?? rows.length;
  const allTime = summary?.all_time ?? rows.reduce((total, row) => total + Number(row.cost ?? 0), 0);
  const average = runs ? allTime / runs : 0;

  return (
    <aside className="sheet">
      <div className="sheet-head">
        <div className="sheet-title">
          <h3>Kostenbuch</h3>
          <span>Was lief, was gesendet wurde und was es gekostet hat.</span>
        </div>
        <span className="spacer" />
        <button type="button" className="ghost-btn" onClick={onClose}>Schließen</button>
      </div>

      <div className="sheet-body">
        <div className="ledger-summary" aria-label="Verbrauchsübersicht">
          <div><span>Gesamtausgaben</span><strong>${allTime.toFixed(3)}</strong></div>
          <div><span>Abgeschlossene Läufe</span><strong>{runs}</strong></div>
          <div><span>Durchschnitt pro Lauf</span><strong>${average.toFixed(3)}</strong></div>
        </div>
        {!rows.length ? (
          <p className="ledger-empty">
            Noch nichts erstellt.
            <br />
            Jeder Lauf landet hier mit Modell, Prompt, Anfrage-ID und den echten Kosten.
          </p>
        ) : (
          <div className="ledger-list">
            {rows.map((r, i) => {
              const verified = r.cost_confidence === "verified";
              return (
                <article className="ledger-row" key={`${r.request_id}-${i}`}>
                  <div className="ledger-row-head">
                    <div>
                      <strong>{r.label}</strong>
                      <span>{new Date(r.ts).toLocaleString(undefined, {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}</span>
                    </div>
                    <div className="ledger-cost">
                      <strong>${Number(r.cost ?? 0).toFixed(3)}</strong>
                      <span className={verified ? "verified" : "estimated"}>{verified ? "Abgerechnet" : r.cost_confidence === "kontingent" ? "Kontingent" : "Geschätzt"}</span>
                    </div>
                  </div>
                  <p>{String(r.raw_idea || r.prompt)}</p>
                  {r.request_id && <code>{r.request_id}</code>}
                </article>
              );
            })}
          </div>
        )}
        <p className="ledger-foot">„Abgerechnet“ heißt: fal hat den finalen Betrag gemeldet. „Geschätzt“ heißt: das Modell hat keinen bestätigten Betrag zurückgegeben. Audio-Läufe zählen als ElevenLabs-Kontingent (Zeichen), nicht in Dollar.</p>
      </div>
    </aside>
  );
}
