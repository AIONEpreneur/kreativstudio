import React from "react";
import { sortModels } from "./modelCatalog.js";

// The roster, as pictures. Every tile is a real sample frame published by the
// model itself, and the price is on the tile because that is the whole point.

const GROUPS = [
  { lane: "t2i", head: "Bild-Modelle", note: "Mit einer Beschreibung starten" },
  { lane: "i2i", head: "Bild-Bearbeitung", note: "Eine Referenz verändern" },
  { lane: "t2v", head: "Video-Modelle", note: "Mit einer Beschreibung starten" },
  { lane: "i2v", head: "Bild zu Video", note: "Ein Bild animieren" },
  { lane: "r2v", head: "Referenz-Video", note: "Einen Look konsistent halten" },
];

export default function ModelWall({ catalog, modelId, onPick }) {
  if (!catalog) return null;

  return (
    <div className="wall model-wall">
      {GROUPS.map((g) => {
        const models = sortModels(catalog.models.filter((m) => m.lane === g.lane));
        if (!models.length) return null;
        return (
          <section key={g.lane}>
            <div className="wall-head">
              <h2>{g.head}</h2>
              <span>{g.note}</span>
              <div className="rule" />
              <span>{models.length} {models.length === 1 ? "Modell" : "Modelle"}</span>
            </div>
            <div className="grid">
              {models.map((m) => (
                <button
                  key={m.id}
                  className={`card${m.id === modelId ? " on" : ""}`}
                  onClick={() => onPick(m.id)}
                  title={m.id}
                >
                  {m.thumbnail ? (
                    <img className="shot" src={m.thumbnail} alt="" loading="lazy" />
                  ) : (
                    <div className="shot" />
                  )}
                  <div className="body">
                    <div className="t">
                      <span
                        className={`pip${m.has_profile ? "" : " hollow"}`}
                        title={m.has_profile ? "Prompt-Profil vorhanden" : "Kein Prompt-Profil"}
                      />
                      {m.label}
                    </div>
                    <div className="s">
                      <span>{m.vendor}</span>
                      <b>{price(m)}</b>
                    </div>
                    <div className="card-capabilities">
                      <span>{m.kind === "video" ? "Ausgabe: Video" : "Ausgabe: Bild"}</span>
                      <span>{m.capabilities?.modalities?.length
                        ? `Nimmt ${m.capabilities.modalities.map((item) => item === "document" ? "PDF" : item === "image" ? "Bild" : item === "video" ? "Video" : item).join(" + ")}`
                        : "Nur Prompt"}</span>
                    </div>
                    <span className="card-evidence">{m.capabilities?.inputs?.length ? "Schema geprüft" : "Keine Medien-Eingabe im Schema"}</span>
                    {m.tier === "fastest" && <span className="card-tier">Schnellspur</span>}
                  </div>
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// fal bills in different units per model, so say which unit rather than
// pretending everything is priced per picture.
const UNIT_LABEL = {
  images: "/img",
  megapixels: "/MP",
  "processed megapixels": "/MP",
  seconds: "/sec",
  "compute seconds": "/compute sec",
  units: "/unit",
};

function price(m) {
  const p = m.pricing;
  if (!p) return "";
  const n = p.price < 0.01 ? p.price.toFixed(5).replace(/0+$/, "") : String(p.price);
  return `$${n}${UNIT_LABEL[p.unit] ?? ""}`;
}
