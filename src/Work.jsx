import React, { useEffect, useRef, useState } from "react";

// Results, big. Each one keeps its own price and billing confidence.

const FORMAT_LABELS = {
  ugc: "UGC-Werbung",
  unboxing: "Unboxing",
  hypermotion: "Hyper-Motion",
  tvspot: "TV-Spot",
  product: "Produktfoto",
  poster: "Anzeige mit Headline",
};

export default function Work({ job, shots, standalone = false, onDelete }) {
  return (
    <div className={`wall results-wall${standalone ? " standalone" : ""}`}>
      <div className="wall-head">
        <h2>{standalone ? "Bibliothek" : "Deine Ergebnisse"}</h2>
        <span>{shots.length} {shots.length === 1 ? "Ergebnis" : "Ergebnisse"}</span>
        <div className="rule" />
        <span>${shots.reduce((a, s) => a + (Number(s.cost) || 0), 0).toFixed(3)} ausgegeben</span>
      </div>

      {!job && !shots.length ? (
        <div className="results-empty">
          <strong>Noch keine Ergebnisse</strong>
          <span>Deine erstellten Bilder, Videos und Audios erscheinen hier.</span>
          <a href="#create">Erstelle dein erstes Motiv</a>
        </div>
      ) : (
        <div className="masonry">
          {job && <Job job={job} />}
          {shots.map((s) => (
            <Shot key={`${s.archive_id ?? s.request_id}-${s.at}`} shot={s} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function Job({ job }) {
  return (
    <div className="job">
      <div className="ph pulse">{job.status ?? job.phase}</div>
      <div className="meta">
        <span>{job.model ?? ""}</span>
        <span>
          {job.queue_position != null ? `Warteschlange ${job.queue_position}` : ""}
          {job.estimate?.cost != null ? ` · ~$${job.estimate.cost.toFixed(3)}` : ""}
        </span>
      </div>
      <div className="bar-lite"><i /></div>
    </div>
  );
}

function Shot({ shot, onDelete }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const verified = shot.cost_confidence === "verified";
  const formatLabel = FORMAT_LABELS[shot.format];
  const idea = String(shot.raw_idea || shot.prompt || "").trim();
  const resultLabel = shot.label || "Ergebnis ohne Titel";

  async function removeResult() {
    setDeleting(true);
    try {
      await onDelete?.(shot);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <div className="work">
      {shot.outputs.map((o, i) => {
        const source = o.local_url || o.url;
        const isVideo =
          String(o.content_type ?? "").startsWith("video") || /\.mp4($|\?)/.test(source);
        const isAudio =
          String(o.content_type ?? "").startsWith("audio") || /\.(mp3|wav)($|\?)/.test(source);
        if (isAudio) {
          return (
            <div key={i} className="work-audio-shell">
              <audio controls src={source} style={{ width: "100%" }} aria-label="Erstellte Sprachausgabe" />
            </div>
          );
        }
        return isVideo ? (
          <VideoPreview key={i} src={source} />
        ) : (
          <img key={i} src={source} alt={resultLabel} loading="lazy" />
        );
      })}

      <span className="work-tag" title={shot.cost_basis}>
        <span className={`dot ${verified ? "verified" : "estimated"}`} />
        {shot.kind === "audio" ? `${shot.characters ?? "–"} Zeichen` : `${verified ? "Abgerechnet" : "ca."} $${Number(shot.cost ?? 0).toFixed(3)}`}
      </span>

      <div className="work-foot">
        <div className="l">
          <div className="work-title">
            <span className="work-name">{resultLabel}</span>
            {formatLabel && <span className="work-format">{formatLabel}</span>}
          </div>
          <div className="work-actions">
            <button type="button" onClick={() => setDetailsOpen((value) => !value)} aria-expanded={detailsOpen}>
              {detailsOpen ? "Details ausblenden" : "Details"}
            </button>
            <a href={shot.outputs[0]?.local_url || shot.outputs[0]?.url} download aria-label={`${resultLabel} herunterladen`}>Herunterladen</a>
            {onDelete && shot.archive_id && (
              <button type="button" className="work-delete" onClick={() => setConfirmingDelete(true)} aria-label={`${resultLabel} löschen`}>
                Löschen
              </button>
            )}
          </div>
        </div>
        <div className="p">{idea}</div>
        {detailsOpen && (
          <div className="work-details">
            <dl>
              <div><dt>Modell</dt><dd>{shot.label}</dd></div>
              <div><dt>Kosten</dt><dd>{shot.kind === "audio" ? (shot.cost_basis ?? "ElevenLabs-Kontingent") : `${verified ? "Bestätigt abgerechnet" : "Schätzung"} · $${Number(shot.cost ?? 0).toFixed(4)}`}</dd></div>
              {shot.request_id && <div><dt>Anfrage</dt><dd>{shot.request_id}</dd></div>}
              <div><dt>Archiv</dt><dd>{shot.outputs.some((output) => output.local_url) ? "Lokal gespeichert" : "Nur externe Kopie"}</dd></div>
            </dl>
            <strong>Gesendeter Prompt</strong>
            <p>{shot.prompt}</p>
            {shot.outputs[0]?.remote_url && <a className="hosted-copy" href={shot.outputs[0].remote_url} target="_blank" rel="noreferrer">Kopie beim Anbieter öffnen ↗</a>}
          </div>
        )}
        {confirmingDelete && (
          <div className="work-delete-confirm" role="group" aria-label={`Löschen von ${resultLabel} bestätigen`}>
            <div>
              <strong>Dieses Ergebnis löschen?</strong>
              <span>Entfernt es aus dem Studio und löscht die lokale Kopie. Eine Kopie beim Anbieter kann bestehen bleiben.</span>
            </div>
            <div>
              <button type="button" onClick={() => setConfirmingDelete(false)} disabled={deleting}>Behalten</button>
              <button type="button" className="danger" onClick={removeResult} disabled={deleting}>
                {deleting ? "Wird gelöscht…" : "Endgültig löschen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPreview({ src }) {
  const videoRef = useRef(null);
  const soundEnabledRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    video.defaultMuted = true;
    video.muted = true;

    const scrollRoot = document.querySelector(".scroll");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!soundEnabledRef.current) video.muted = true;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { root: scrollRoot, rootMargin: "120px 0px", threshold: 0.35 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    soundEnabledRef.current = soundEnabled;
    if (!video) return;
    video.muted = !soundEnabled;
    if (soundEnabled && video.volume === 0) video.volume = 1;
  }, [soundEnabled]);

  const keepSoundIntentional = (event) => {
    const video = event.currentTarget;
    if (!soundEnabledRef.current && !video.muted) {
      video.muted = true;
    } else if (soundEnabledRef.current && video.muted) {
      setSoundEnabled(false);
    }
  };

  return (
    <div className="work-video-shell">
      <video
        ref={videoRef}
        className="work-video"
        src={src}
        controls
        loop
        muted={!soundEnabled}
        playsInline
        preload="metadata"
        onVolumeChange={keepSoundIntentional}
        aria-label="Vorschau des erstellten Videos"
      />
      <button
        type="button"
        className={`work-sound-toggle${soundEnabled ? " enabled" : ""}`}
        onClick={() => setSoundEnabled((enabled) => !enabled)}
        aria-pressed={soundEnabled}
        aria-label={soundEnabled ? "Video stummschalten" : "Ton einschalten"}
      >
        {soundEnabled ? "Ton an" : "Stumm"}
      </button>
    </div>
  );
}
