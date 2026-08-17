import React, { useEffect, useMemo, useRef, useState } from "react";
import TopBar from "./TopBar.jsx";
import PromptBar, { SHOT_DIRECTION } from "./PromptBar.jsx";
import ModelWall from "./ModelWall.jsx";
import Work from "./Work.jsx";
import Ledger from "./Ledger.jsx";
import Tooling from "./Tooling.jsx";
import Audio from "./Audio.jsx";
import { assignInputFields, imageInputFor, mediaInputsFor, mediaTypeForFile, pairedImageModel, retainCompatibleAssets, sortModels } from "./modelCatalog.js";

function viewFromHash() {
  const view = window.location.hash.slice(1);
  return ["create", "audio", "models", "work", "connect"].includes(view) ? view : "create";
}

// Params driven by the schema but kept off the bar. Model defaults are already
// right for concepting, and a wall of knobs is what makes these tools feel like
// software instead of a camera.
const HIDE = new Set([
  "seed", "enable_safety_checker", "output_format", "image_url", "image_urls",
  "guidance_scale", "num_inference_steps", "negative_prompt", "num_frames", "style",
]);

// A creation mode is also a delivery intent. Keep the first frame useful for
// that intent, while still respecting the exact ratios each endpoint exposes.
// The user can change the chip at any time; these are only the starting points.
const FORMAT_FRAME_PREFERENCES = {
  ugc: {
    aspect_ratio: ["9:16", "3:4", "2:3", "1:1", "4:5", "16:9"],
    image_size: ["portrait_16_9", "portrait_4_3", "square_hd", "square"],
  },
  unboxing: {
    aspect_ratio: ["9:16", "3:4", "2:3", "1:1", "4:5", "16:9"],
    image_size: ["portrait_16_9", "portrait_4_3", "square_hd", "square"],
  },
  product: {
    aspect_ratio: ["1:1", "4:5", "4:3", "3:2", "square", "16:9"],
    image_size: ["square_hd", "square", "landscape_4_3", "portrait_4_3"],
  },
  poster: {
    aspect_ratio: ["4:5", "3:4", "1:1", "9:16", "4:3", "16:9"],
    image_size: ["portrait_4_3", "square_hd", "square", "landscape_4_3"],
  },
  hypermotion: {
    aspect_ratio: ["16:9", "21:9", "4:3", "1:1", "9:16"],
    image_size: ["landscape_16_9", "landscape_4_3", "square_hd", "square"],
  },
  tvspot: {
    aspect_ratio: ["16:9", "21:9", "4:3", "1:1", "9:16"],
    image_size: ["landscape_16_9", "landscape_4_3", "square_hd", "square"],
  },
};

function applyFrameDefault(params, model, format) {
  const preferences = FORMAT_FRAME_PREFERENCES[format];
  if (!preferences || !model?.params) return params;

  const next = { ...params };
  for (const field of ["aspect_ratio", "image_size"]) {
    const spec = model.params[field];
    if (!spec?.enum?.length) continue;
    const preferred = preferences[field]?.find((candidate) =>
      spec.enum.some((value) => String(value) === candidate)
    );
    if (preferred !== undefined) {
      next[field] = spec.enum.find((value) => String(value) === preferred);
    }
  }
  return next;
}

async function readJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    let message = `${response.status} ${response.statusText || "request failed"}`;
    try {
      const payload = JSON.parse(text);
      message = payload.error || payload.detail || message;
    } catch {
      if (text.trim()) message = text.trim();
    }
    throw new Error(message);
  }
  if (!text.trim()) throw new Error("The server returned an empty response");
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned an invalid response");
  }
}

function errorDetails(error) {
  const raw = String(error?.message ?? error ?? "");
  const lower = raw.toLowerCase();
  if (lower.includes("exhausted balance") || lower.includes("user is locked") || lower.includes("fal balance is empty") || lower.includes("guthaben ist leer")) {
    return {
      title: lower.includes("upload") ? "Upload pausiert" : "Generierung pausiert",
      message: lower.includes("upload")
        ? "Die Referenz kann nicht hochgeladen werden, weil dein fal-Guthaben leer ist. Lade Guthaben auf und versuche es erneut."
        : "Dein fal-Guthaben ist leer. Lade Guthaben auf und versuche es dann noch einmal.",
      action: "fal-Guthaben öffnen",
      href: "https://fal.ai/dashboard/billing",
    };
  }
  if (lower.includes("server is unavailable") || lower.includes("failed to fetch") || lower.includes("cannot reach")) {
    return {
      title: "Studio ist offline",
      message: "Der lokale Server antwortet nicht. Starte das Studio neu und versuche es dann erneut.",
    };
  }
  if (lower.includes("reference") && (lower.includes("switched") || lower.includes("selected instead"))) {
    return {
      title: lower.includes("removed") ? "Modell gewechselt" : "Referenz-fähiges Modell gewählt",
      message: raw,
      tone: "info",
    };
  }
  if (lower.includes("braucht zwingend")) {
    return {
      title: "Dieses Modell braucht eine Referenz",
      message: raw,
    };
  }
  if (lower.includes("cannot use the current attachments") || lower.includes("kann die angehängte datei")) {
    return {
      title: "Bitte ein passendes Modell wählen",
      message: raw,
    };
  }
  return {
    title: "Dieser Lauf wurde gestoppt",
    message: raw.replace(/^error:\s*/i, "") || "Bitte erneut versuchen.",
  };
}

function ErrorNotice({ error, onClose }) {
  const details = errorDetails(error);
  return (
    <section className={`error-notice${details.tone === "info" ? " info" : ""}`} role="alert">
      <div>
        <strong>{details.title}</strong>
        <p>{details.message}</p>
      </div>
      <div className="error-actions">
        {details.href && (
          <a href={details.href} target="_blank" rel="noreferrer">{details.action}</a>
        )}
        <button type="button" onClick={onClose} aria-label="Meldung schließen">Schließen</button>
      </div>
    </section>
  );
}

function relativeTime(iso) {
  const elapsed = Date.now() - Date.parse(iso || "");
  if (!Number.isFinite(elapsed) || elapsed < 0) return "ausstehend";
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${Math.floor(hours / 24)} Tagen`;
}

function CatalogStatus({ catalog, syncing, onSync }) {
  const status = catalog?.catalog_sync;
  const newCount = status?.new_endpoint_count;
  return (
    <details className="catalog-status">
      <summary>
        <span>{status?.synced_at ? `Katalog aktualisiert ${relativeTime(status.synced_at)}` : "Modell-Katalog wird geprüft"}</span>
      </summary>
      <div className="catalog-status-popover">
        <div className="catalog-status-head">
          <div>
            <strong>Automatische Modell-Suche</strong>
            <span>Aktualisiert sich alle {status?.refresh_hours ?? 6} Stunden</span>
          </div>
          <button type="button" onClick={onSync} disabled={syncing}>{syncing ? "Aktualisiert…" : "Jetzt aktualisieren"}</button>
        </div>
        <dl>
          <div><dt>Einsatzbereit</dt><dd>{catalog?.models?.length ?? 0}</dd></div>
          <div><dt>Relevant bei fal</dt><dd>{status?.relevant_active_endpoints ?? "—"}</dd></div>
          <div><dt>Wartet auf Prüfung</dt><dd>{newCount ?? "—"}</dd></div>
        </dl>
        <p>Die geprüfte Modell-Liste bleibt stabil, während fal im Hintergrund auf neue Bild- und Video-Modelle geprüft wird.</p>
        {status?.newest?.length > 0 && (
          <div className="catalog-newest">
            <span>Zuletzt entdeckt</span>
            {status.newest.slice(0, 4).map((item) => (
              <a key={item.id} href={item.model_url} target="_blank" rel="noreferrer">
                <b>{item.label}</b><small>{item.category_label}</small>
              </a>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function CreditPanel({ billing, locked, refreshing, onRefresh, onClose }) {
  const balance = billing?.available && billing.current_balance != null
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: billing.currency || "USD",
        maximumFractionDigits: 2,
      }).format(billing.current_balance)
    : null;
  return (
    <aside className="credit-sheet" aria-label="fal-Guthaben">
      <div className="credit-sheet-head">
        <div>
          <h3>fal-Guthaben</h3>
          <span>Dein Guthaben für Bild- und Video-Generierung</span>
        </div>
        <button type="button" className="ghost-btn" onClick={onClose}>Schließen</button>
      </div>
      <div className="credit-sheet-body">
        <section className={`balance-card${locked ? " locked" : ""}`}>
          <span>{locked ? "Generierung pausiert" : balance ? "Verfügbares Guthaben" : "Guthaben"}</span>
          <strong>{locked ? "Guthaben nötig" : balance ?? "Für diesen Key nicht abrufbar"}</strong>
          <p>{locked
            ? "fal meldet, dass das Guthaben aufgebraucht ist. Nach dem Aufladen funktionieren Generierung und Uploads sofort wieder."
            : "Das Guthaben wird direkt von fal abgefragt."}</p>
        </section>
        <a className="topup-button" href={billing?.top_up_url ?? "https://fal.ai/dashboard/billing"} target="_blank" rel="noreferrer">
          Guthaben sicher bei fal aufladen <span aria-hidden="true">↗</span>
        </a>
        <button type="button" className="refresh-balance" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Wird geprüft…" : "Ich habe aufgeladen — Guthaben aktualisieren"}
        </button>
        <p className="credit-security">Zahlungs- und Kartendaten bleiben bei fal. Dieses Studio sieht und speichert sie nie.</p>
      </div>
    </aside>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState(() => viewFromHash());
  const [catalog, setCatalog] = useState(null);
  const [modelId, setModelId] = useState(null);
  const [format, setFormat] = useState("none");
  const [shotSettings, setShotSettings] = useState({});
  const [idea, setIdea] = useState("");
  const [rewritten, setRewritten] = useState(null);
  const [params, setParams] = useState({});
  const [refs, setRefs] = useState([]);
  const refsRef = useRef([]);
  const [quote, setQuote] = useState(null);
  const [job, setJob] = useState(null);
  const [shots, setShots] = useState([]);
  const [ledger, setLedger] = useState({ rows: [], summary: null });
  const [showLedger, setShowLedger] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [billing, setBilling] = useState(null);
  const [refreshingBilling, setRefreshingBilling] = useState(false);
  const [falLocked, setFalLocked] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("bench.theme") || "dark"; } catch { return "dark"; }
  });
  const [rewriterEnabled, setRewriterEnabled] = useState(false);
  const [update, setUpdate] = useState(null);

  useEffect(() => {
    readJson("/api/health")
      .then((health) => setRewriterEnabled(!String(health.rewriter ?? "").startsWith("disabled")))
      .catch(() => {});
    readJson("/api/update-status")
      .then((status) => {
        if (!status.update_available) return;
        let dismissed = "";
        try { dismissed = localStorage.getItem("bench.update-dismissed") || ""; } catch {}
        if (dismissed !== status.latest) setUpdate(status);
      })
      .catch(() => {});
  }, []);

  function dismissUpdate() {
    try { localStorage.setItem("bench.update-dismissed", update?.latest ?? ""); } catch {}
    setUpdate(null);
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("bench.theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    const syncView = () => {
      setActiveView(viewFromHash());
      document.querySelector(".scroll")?.scrollTo({ top: 0 });
    };
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);

  function openView(view) {
    window.location.hash = view;
    setActiveView(view);
  }
  const abortRef = useRef(null);
  const ledgerRetryRef = useRef(null);

  const model = useMemo(
    () => catalog?.models.find((m) => m.id === modelId) ?? null,
    [catalog, modelId]
  );
  const referenceModel = useMemo(
    () => pairedImageModel(catalog?.models, model),
    [catalog, model]
  );

  useEffect(() => {
    refsRef.current = refs;
  }, [refs]);

  useEffect(() => {
    let dead = false;
    let retryTimer;

    async function loadCatalog(attempt = 0) {
      try {
        const c = await readJson("/api/models");
        if (!c.models?.length) throw new Error("The model catalog is empty");
        if (dead) return;
        setCatalog(c);
        setModelId((current) => {
          if (current) return current;
          let pinned = "";
          let last = "";
          try {
            pinned = localStorage.getItem("bench.model-filter-pinned") || "";
            last = localStorage.getItem("bench.last-model") || "";
          } catch {}
          const previous = c.models.find((candidate) => candidate.id === last && (!pinned || candidate.kind === pinned));
          return previous?.id ?? sortModels(c.models.filter((candidate) => !pinned || candidate.kind === pinned))[0]?.id ?? c.models[0]?.id ?? null;
        });
        setError(null);
      } catch (e) {
        if (dead) return;
        if (attempt < 12) {
          retryTimer = setTimeout(() => loadCatalog(attempt + 1), Math.min(1800, 450 + attempt * 125));
        } else {
          setError("Der Studio-Server ist nicht erreichbar. Starte das Studio neu und versuche es erneut.");
        }
      }
    }

    loadCatalog();
    refreshLedger();
    refreshBilling();
    return () => {
      dead = true;
      clearTimeout(retryTimer);
      clearTimeout(ledgerRetryRef.current);
    };
  }, []);

  async function refreshBilling(force = false) {
    setRefreshingBilling(true);
    try {
      const value = await readJson(`/api/fal/billing${force ? "?refresh=1" : ""}`);
      setBilling(value);
      if (value.available && Number(value.current_balance) > 0) setFalLocked(false);
    } catch {
      // Billing visibility must never block the creation UI.
    } finally {
      setRefreshingBilling(false);
    }
  }

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && showCredits) refreshBilling(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [showCredits]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => {
      readJson("/api/catalog/status")
        .then((status) => setCatalog((current) => current ? { ...current, catalog_sync: status } : current))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  async function syncCatalog() {
    setSyncingCatalog(true);
    try {
      const status = await readJson("/api/catalog/sync", { method: "POST" });
      setCatalog((current) => current ? { ...current, catalog_sync: status } : current);
    } catch (error) {
      setError(`Katalog-Aktualisierung fehlgeschlagen: ${error.message ?? error}`);
    } finally {
      setSyncingCatalog(false);
    }
  }

  function refreshLedger(attempt = 0) {
    readJson("/api/ledger")
      .then((l) => {
        setLedger(l);
        const past = (l.rows ?? [])
          .filter((r) => r.outputs?.length)
          .map((r) => ({ ...r, at: new Date(r.ts).getTime() }));
        setShots(past);
      })
      .catch(() => {
        if (attempt < 12) {
          ledgerRetryRef.current = setTimeout(() => refreshLedger(attempt + 1), Math.min(1800, 450 + attempt * 125));
        }
      });
  }

  async function deleteResult(shot) {
    if (!shot?.archive_id) throw new Error("Dieses Ergebnis liegt nicht im lokalen Archiv.");
    try {
      const result = await readJson(`/api/results/${encodeURIComponent(shot.archive_id)}`, { method: "DELETE" });
      setShots((current) => current.filter((candidate) => candidate.archive_id !== shot.archive_id));
      setLedger((current) => ({
        ...current,
        rows: (current.rows ?? []).filter((candidate) => candidate.archive_id !== shot.archive_id),
        summary: result.summary,
      }));
    } catch (deleteError) {
      setError(`Dieses Ergebnis konnte nicht gelöscht werden: ${deleteError.message ?? deleteError}`);
      throw deleteError;
    }
  }

  useEffect(() => {
    if (!model) return;
    const next = {};
    for (const [name, spec] of Object.entries(model.params)) {
      if (HIDE.has(name)) continue;
      if (spec.default !== undefined) next[name] = spec.default;
      else if (spec.enum?.length) next[name] = spec.enum[0];
    }
    setParams(next);
    setRewritten(null);
  }, [modelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const next = Object.fromEntries((SHOT_DIRECTION[format] ?? []).map((field) => [field.id, field.options[0].value]));
    setShotSettings(next);
    setRewritten(null);
  }, [format]);

  useEffect(() => {
    if (!model) return;
    setParams((current) => applyFrameDefault(current, model, format));
  }, [format, modelId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!modelId) return;
    let dead = false;
    readJson("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, params }),
    })
      .then((q) => { if (!dead) setQuote(q); })
      .catch(() => {});
    return () => { dead = true; };
  }, [modelId, params]);

  async function optimize() {
    if (!idea.trim() || !modelId) return;
    const assignment = assignInputFields(model, refs);
    if (!assignment.ok) return setError(assignment.reason);
    setBusy(true); setError(null);
    try {
      const result = await readJson("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, modelId, format, params, shotSettings, refCount: refs.length, hasReference: refs.length > 0 }),
      });
      setRewritten(result);
    } catch (e) { setError(String(e)); }
    finally { setBusy(false); }
  }

  async function attach(file) {
    setBusy(true); setError(null);
    try {
      const mediaType = mediaTypeForFile(file);
      if (mediaType === "file") throw new Error("Bitte ein Bild, Video, eine Audiodatei oder ein PDF verwenden.");
      let targetModel = model;
      if (!mediaInputsFor(targetModel, mediaType).length && mediaType === "image" && referenceModel) {
        targetModel = referenceModel;
      }
      if (!mediaInputsFor(targetModel, mediaType).length) {
        throw new Error(`${model?.label ?? "Dieses Modell"} akzeptiert keine ${mediaType}-Eingabe. Wähle zuerst ein passendes Modell.`);
      }
      const fd = new FormData();
      fd.append("file", file);
      const j = await readJson("/api/upload", { method: "POST", body: fd });
      if (j.error) throw new Error(j.error);
      const nextAsset = {
        ...j,
        url: j.remote_url ?? j.url,
        name: file.name,
        media_type: j.media_type ?? mediaType,
        preview: URL.createObjectURL(file),
      };
      // Multiple files are uploaded sequentially from one chooser event. React
      // has not necessarily rendered the previous attachment before the next
      // upload resolves, so read and update the synchronous ref as the source
      // of truth for this burst.
      const assignment = assignInputFields(targetModel, [...refsRef.current, nextAsset]);
      if (!assignment.ok) throw new Error(assignment.reason);
      refsRef.current = assignment.assets;
      setRefs(assignment.assets);
      if (targetModel?.id !== model?.id) {
        setModelId(targetModel.id);
        setRewritten(null);
      }
    } catch (e) {
      const message = `Upload failed: ${e.message ?? e}`.replace("Upload failed:", "Upload fehlgeschlagen:");
      if (/exhausted balance|user is locked|guthaben ist leer/i.test(message)) setFalLocked(true);
      setError(message);
    }
    finally { setBusy(false); }
  }

  async function generate() {
    const prompt = (rewritten?.prompt ?? idea).trim();
    if (!prompt || !modelId) return;

    const assignment = assignInputFields(model, refs);
    if (!assignment.ok) return setError(assignment.reason);
    const missingSpec = (model?.capabilities?.inputs ?? []).find((spec) =>
      spec.required && !assignment.assets.some((asset) => asset.field === spec.field)
    );
    if (missingSpec) {
      const noun = missingSpec.modality === "image" ? "ein Bild" : missingSpec.modality === "video" ? "ein Video" : missingSpec.modality === "audio" ? "eine Audiodatei" : "eine Datei";
      return setError(`${model.label} braucht zwingend ${noun} als Ausgangsmaterial. Häng ${noun} an (Plus-Knopf) oder wähle ein Modell, das ohne Referenz startet.`);
    }

    setBusy(true); setError(null);
    setJob({ phase: "submitting", model: model?.label });

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          modelId, prompt, params, format, rawIdea: idea,
          shotSettings,
          inputAssets: refs.map(({ url, field, media_type, upload_id, name }) => ({ url, field, media_type, upload_id, name })),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let message = `Generation failed (${res.status})`;
        try { message = JSON.parse(text).error || message; } catch {}
        throw new Error(message);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.phase === "error") {
            if (/exhausted balance|user is locked|guthaben ist leer/i.test(ev.error ?? "")) setFalLocked(true);
            setError(ev.error); setJob(null);
          }
          else if (ev.phase === "done") {
            setShots((p) => [{ ...ev.ledger, at: Date.now() }, ...p]);
            setJob(null);
            setLedger((l) => ({ ...l, summary: ev.spend }));
            refreshLedger();
          } else setJob((j) => ({ ...j, ...ev }));
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        const message = String(e.message ?? e);
        if (/exhausted balance|user is locked|guthaben ist leer/i.test(message)) setFalLocked(true);
        setError(message);
      }
      setJob(null);
    } finally { setBusy(false); abortRef.current = null; }
  }

  function pickModel(nextId) {
    const picked = catalog?.models.find((candidate) => candidate.id === nextId);
    if (!picked) return;
    let switchNotice = null;
    if (refs.length && picked) {
      const retained = retainCompatibleAssets(picked, refs);
      setRefs(retained.assets);
      refsRef.current = retained.assets;
      if (retained.removed.length) {
        const count = retained.removed.length;
        switchNotice = `Zu ${picked.label} gewechselt. ${count === 1 ? "Eine nicht kompatible Referenz wurde entfernt, weil dieses Modell sie" : `${count} nicht kompatible Referenzen wurden entfernt, weil dieses Modell sie`} nicht annehmen kann.`;
      }
    }
    setModelId(nextId);
    setRewritten(null);
    setQuote(null);
    try { localStorage.setItem("bench.last-model", nextId); } catch {}
    setError(switchNotice);
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">Zum Arbeitsbereich springen</a>
      <TopBar
        summary={ledger.summary}
        activeView={activeView}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        onLedger={() => { setShowCredits(false); setShowLedger((v) => !v); }}
        ledgerOpen={showLedger}
        billing={billing}
        onCredits={() => { setShowLedger(false); setShowCredits((value) => !value); }}
        creditsOpen={showCredits}
      />

      <div className="scroll">
        <div className="studio-layout">
          <main className="workspace" id="main-content" tabIndex="-1">
            <div className="workspace-inner">
              {update && (
                <section className="error-notice info update-notice" role="status">
                  <div>
                    <strong>Neue Version verfügbar ({update.current} → {update.latest})</strong>
                    <p>
                      Dein Kreativstudio wurde verbessert. Sag Claude einfach:
                      {" "}<em>„Aktualisiere mein Kreativstudio auf die neueste Version von
                      https://github.com/AIONEpreneur/kreativstudio.“</em>
                    </p>
                  </div>
                  <div className="error-actions">
                    <button type="button" onClick={dismissUpdate}>Später</button>
                  </div>
                </section>
              )}
              {activeView === "create" && <section className="hero view-page" id="create">
                <div className="workspace-head">
                  <div className="hero-copy">
                    <div className="eyebrow">Erstellen</div>
                    <h1>Erstelle dein <em>Motiv</em>.</h1>
                    <p>Modell wählen, bei Bedarf eine Referenz anhängen und beschreiben, was entstehen soll.</p>
                  </div>
                </div>

                <div className="creator">
                  <div className="creator-head">
                    <h2>Beschreibe dein Motiv</h2>
                    {catalog ? (
                      <CatalogStatus catalog={catalog} syncing={syncingCatalog} onSync={syncCatalog} />
                    ) : <span>Modelle werden geladen</span>}
                  </div>
                  <PromptBar
                    catalog={catalog}
                    model={model}
                    idea={idea}
                    setIdea={(v) => { setIdea(v); setRewritten(null); }}
                    format={format}
                    setFormat={(v) => { setFormat(v); setRewritten(null); }}
                    params={params}
                    setParams={setParams}
                    hide={HIDE}
                    refs={refs}
                    onAttach={attach}
                    onRemoveRef={(i) => setRefs((current) => {
                      const next = current.filter((_, j) => j !== i);
                      refsRef.current = next;
                      return next;
                    })}
                    rewritten={rewritten}
                    setRewritten={setRewritten}
                    onOptimize={optimize}
                    onGenerate={generate}
                    onPickModel={pickModel}
                    referenceModel={referenceModel}
                    shotSettings={shotSettings}
                    setShotSettings={(next) => { setShotSettings(next); setRewritten(null); }}
                    quote={quote}
                    busy={busy}
                    running={Boolean(job)}
                    rewriterEnabled={rewriterEnabled}
                  />
                </div>

                {error && <ErrorNotice error={error} onClose={() => setError(null)} />}
                {!error && !shots.length && !job && (
                  <div className="hint"><span><b>Häng eine Referenz an</b>, wenn sie hilft. Dann beschreibe dein Motiv in deinen eigenen Worten.</span></div>
                )}
                {(job || shots.length > 0) && (
                  <section className="create-results" id="create-results" aria-label="Erstellte Medien">
                    <Work job={job} shots={shots} onDelete={deleteResult} />
                  </section>
                )}
              </section>}

              {activeView === "work" && (
                <section className="view-page" id="work">
                  <div className="view-heading">
                    <div>
                      <div className="eyebrow">Ergebnisse</div>
                      <h1>Alles, was du erstellt hast.</h1>
                      <p>Bilder, Videos und Audio — mit Modell, Prompt, lokaler Kopie und den tatsächlichen Kosten.</p>
                    </div>
                    <a className="view-action" href="#create">Neues erstellen</a>
                  </div>
                  {error && <ErrorNotice error={error} onClose={() => setError(null)} />}
                  <Work job={job} shots={shots} standalone onDelete={deleteResult} />
                </section>
              )}

              {activeView === "models" && (
                <section className="view-page" id="models">
                  <div className="view-heading">
                    <div>
                      <div className="eyebrow">Modell-Katalog</div>
                      <h1>Finde das richtige Modell.</h1>
                      <p>Vergleiche Ausgabetyp, akzeptierte Eingaben, Tempo und Preis, bevor du einen Lauf startest.</p>
                    </div>
                  </div>
                  <ModelWall
                    catalog={catalog}
                    modelId={modelId}
                    onPick={(nextId) => {
                      pickModel(nextId);
                      openView("create");
                    }}
                  />
                </section>
              )}
              {activeView === "audio" && <Audio onGenerated={() => refreshLedger()} />}
              {activeView === "connect" && <Tooling />}
            </div>
          </main>
        </div>
      </div>

      {showLedger && (
        <>
          <div className="modal-scrim" onClick={() => setShowLedger(false)} />
          <Ledger ledger={ledger} onClose={() => setShowLedger(false)} />
        </>
      )}
      {showCredits && (
        <>
          <div className="modal-scrim" onClick={() => setShowCredits(false)} />
          <CreditPanel
            billing={billing}
            locked={falLocked}
            refreshing={refreshingBilling}
            onRefresh={() => refreshBilling(true)}
            onClose={() => setShowCredits(false)}
          />
        </>
      )}
    </div>
  );
}
