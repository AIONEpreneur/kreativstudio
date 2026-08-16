import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  assignInputFields,
  imageInputFor,
  mediaInputsFor,
  modelKindLabel,
  modelLaneLabel,
  modelPriority,
  sortModels,
} from "./modelCatalog.js";

// One bar, one action. Everything that changes the output is a chip inside it,
// including the model, so you never leave the thing you are typing in.

function prettyParam(name, value) {
  const raw = String(value);
  const named = {
    square_hd: "Quadrat HD",
    square: "Quadrat",
    portrait_4_3: "Hochformat 4:3",
    portrait_16_9: "Hochformat 16:9",
    landscape_4_3: "Querformat 4:3",
    landscape_16_9: "Querformat 16:9",
  };
  if (name === "image_size" && named[raw]) return named[raw];
  if (name === "duration") {
    if (raw.toLowerCase() === "auto") return "Auto";
    if (/^\d+(\.\d+)?s$/i.test(raw)) return raw;
    return `${raw} ${raw === "1" ? "Sekunde" : "Sekunden"}`;
  }
  if (name === "fps") return `${raw} fps`;
  if (name === "num_images") return `${raw} ${raw === "1" ? "Bild" : "Bilder"}`;
  if (["generate_audio", "enable_prompt_expansion", "auto_fix"].includes(name)) {
    return raw === "true" ? "An" : raw === "false" ? "Aus" : raw;
  }
  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function paramLabel(name) {
  const labels = {
    aspect_ratio: "Seitenverhältnis",
    duration: "Länge",
    resolution: "Auflösung",
    image_size: "Bildgröße",
    camera_motion: "Kamerabewegung",
    shot_type: "Einstellungsgröße",
    quality: "Qualität",
    thinking_level: "Denk-Level",
    fps: "Bildrate",
    num_images: "Anzahl Bilder",
    generate_audio: "Audio erzeugen",
    enable_prompt_expansion: "Prompt-Erweiterung",
    auto_fix: "Auto-Korrektur",
  };
  return labels[name] ?? prettyParam("", name);
}

export const SHOT_DIRECTION = {
  ugc: [
    {
      id: "creator",
      label: "Person",
      options: [
        { value: "any creator", label: "Beliebig" },
        { value: "a woman in her 20s", label: "Frau, Mitte 20" },
        { value: "a man in his 30s", label: "Mann, Mitte 30" },
        { value: "a founder or expert", label: "Gründer:in / Expert:in" },
      ],
    },
    {
      id: "setting",
      label: "Umgebung",
      options: [
        { value: "a real home setting", label: "Echtes Zuhause" },
        { value: "a bathroom mirror", label: "Badezimmerspiegel" },
        { value: "a kitchen counter", label: "Küchenzeile" },
        { value: "the front seat of a car", label: "Im Auto" },
      ],
    },
    {
      id: "beat",
      label: "Ablauf",
      options: [
        { value: "a problem, product proof, then a reaction", label: "Problem → Beweis → Reaktion" },
        { value: "a quick honest testimonial", label: "Kurzes Testimonial" },
        { value: "a product demonstration with one clear result", label: "Produkt-Demo" },
        { value: "an unexpected first impression", label: "Erster Eindruck" },
      ],
    },
    {
      id: "camera",
      label: "Kamera",
      options: [
        { value: "a front-facing selfie camera", label: "Selfie-Kamera" },
        { value: "a friend filming handheld", label: "Von Hand gefilmt" },
        { value: "a close handheld product detail", label: "Nahaufnahme" },
        { value: "a locked-off phone on a surface", label: "Handy abgestellt" },
      ],
    },
  ],
  unboxing: [
    {
      id: "view",
      label: "Blickwinkel",
      options: [
        { value: "top-down hands opening the package", label: "Von oben" },
        { value: "an over-the-shoulder unboxing", label: "Über die Schulter" },
        { value: "a close handheld reveal", label: "Nah dran" },
      ],
    },
    {
      id: "surface",
      label: "Untergrund",
      options: [
        { value: "a warm kitchen table", label: "Küchentisch" },
        { value: "a clean desk by a window", label: "Schreibtisch am Fenster" },
        { value: "a soft bedroom surface", label: "Weiche Unterlage" },
      ],
    },
    {
      id: "moment",
      label: "Moment",
      options: [
        { value: "the satisfying reveal of the product", label: "Der Reveal" },
        { value: "the first use straight from the box", label: "Erste Nutzung" },
        { value: "a close look at the packaging details", label: "Verpackungs-Details" },
      ],
    },
  ],
  hypermotion: [
    {
      id: "movement",
      label: "Bewegung",
      options: [
        { value: "a fast push-in with a sharp orbit", label: "Push-in + Orbit" },
        { value: "a whip-pan between product details", label: "Whip-Pan-Details" },
        { value: "a smooth floating macro move", label: "Schwebendes Makro" },
      ],
    },
    {
      id: "light",
      label: "Licht",
      options: [
        { value: "a crisp electric blue rim light", label: "Elektroblaues Rim-Light" },
        { value: "hard studio light with deep shadows", label: "Hartes Studiolicht" },
        { value: "warm sunset light with bright highlights", label: "Warme Highlights" },
      ],
    },
  ],
  tvspot: [
    {
      id: "camera",
      label: "Kamera",
      options: [
        { value: "a locked-off hero composition", label: "Feste Hero-Einstellung" },
        { value: "a slow, deliberate dolly forward", label: "Langsame Kamerafahrt" },
        { value: "a graceful product orbit", label: "Produkt-Orbit" },
      ],
    },
    {
      id: "mood",
      label: "Stimmung",
      options: [
        { value: "quiet, refined and confident", label: "Ruhig + edel" },
        { value: "bold and high-contrast", label: "Mutig + kontrastreich" },
        { value: "warm, optimistic and human", label: "Warm + menschlich" },
      ],
    },
  ],
};

function ShotDirection({ format, values, onChange }) {
  const fields = SHOT_DIRECTION[format] ?? [];
  if (!fields.length) return null;

  return (
    <section className="shot-direction" aria-label="Bildregie">
      <div className="shot-direction-head">
        <div>
          <strong>Führe Regie</strong>
          <span>Optionale Auswahl, die den Prompt-Entwurf lenkt</span>
        </div>
        <span className="shot-direction-mode">{format === "ugc" ? "UGC-Rezept" : "Kreativ-Rezept"}</span>
      </div>
      <div className="shot-direction-fields">
        {fields.map((field) => (
          <div className="shot-direction-field" key={field.id}>
            <span>{field.label}</span>
            <MenuSelect
              value={values[field.id] ?? field.options[0].value}
              options={field.options}
              ariaLabel={field.label}
              className="direction-menu"
              onChange={(value) => onChange({ ...values, [field.id]: value })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function MenuSelect({ value, options, onChange, placeholder, ariaLabel, className = "" }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => String(option.value) === String(value)));
  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  function toggle() {
    setActive(selectedIndex);
    setOpen((current) => !current);
  }

  function choose(option) {
    onChange(option.value);
    setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        return (next + options.length) % options.length;
      });
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      choose(options[active]);
    }
  }

  return (
    <div ref={rootRef} className={`menu-select${open ? " open" : ""}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="menu-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <span>{selected?.label ?? placeholder}</span>
        <i className="menu-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="menu-popover" role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              className={`menu-option${String(option.value) === String(value) ? " selected" : ""}${active === index ? " active" : ""}`}
              key={String(option.value)}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(option)}
            >
              <span>{option.label}</span>
              {String(option.value) === String(value) && <b aria-hidden="true">✓</b>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PRICE_UNITS = {
  images: "Bild",
  megapixels: "Megapixel",
  "processed megapixels": "verarbeitetes Megapixel",
  seconds: "Sekunde",
  "compute seconds": "Rechen-Sekunde",
  units: "Einheit",
};

function modelPrice(model) {
  const pricing = model?.pricing;
  if (!pricing) return "Preis nicht verfügbar";
  const amount = Number(pricing.price);
  const value = amount < 0.01
    ? amount.toFixed(5).replace(/0+$/, "").replace(/\.$/, "")
    : amount.toFixed(amount < 0.1 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "");
  return `$${value} / ${PRICE_UNITS[pricing.unit] ?? pricing.unit}`;
}

function ModelPicker({ model, models, onChange, referenceActive, refs = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [popoverStyle, setPopoverStyle] = useState(null);
  const [pinnedFilter, setPinnedFilter] = useState(() => {
    try { return localStorage.getItem("bench.model-filter-pinned") || ""; } catch { return ""; }
  });
  const [kindFilter, setKindFilter] = useState(() => {
    try {
      return localStorage.getItem("bench.model-filter-pinned") || localStorage.getItem("bench.model-filter") || "all";
    } catch { return "all"; }
  });
  const rootRef = useRef(null);
  const popoverRef = useRef(null);
  const searchRef = useRef(null);
  const normalizedQuery = query.trim().toLowerCase();
  const kindCounts = models.reduce((counts, candidate) => {
    counts[candidate.kind] = (counts[candidate.kind] ?? 0) + 1;
    return counts;
  }, {});
  const filteredModels = sortModels(models.filter((candidate) => {
    const matchesKind = normalizedQuery || kindFilter === "all" || candidate.kind === kindFilter;
    const matchesQuery = !normalizedQuery ||
      `${candidate.label} ${candidate.vendor} ${candidate.id} ${modelLaneLabel(candidate)}`.toLowerCase().includes(normalizedQuery);
    return matchesKind && matchesQuery;
  }));
  const popularModelId = filteredModels.find((candidate) => modelPriority(candidate) < 6)?.id;

  function measurePopover() {
    const trigger = rootRef.current?.getBoundingClientRect();
    if (!trigger) return null;
    const headerBottom = document.querySelector(".top")?.getBoundingClientRect().bottom ?? 0;
    const edge = 12;
    const gap = 8;
    const safeTop = headerBottom + 10;
    const width = Math.min(470, window.innerWidth - edge * 2);
    const availableAbove = Math.max(180, trigger.top - safeTop - gap);
    const availableBelow = Math.max(180, window.innerHeight - trigger.bottom - edge - gap);
    const useAbove = availableAbove >= availableBelow;
    return {
      left: Math.max(edge, Math.min(trigger.left, window.innerWidth - width - edge)),
      top: useAbove ? safeTop : trigger.bottom + gap,
      width,
      maxHeight: useAbove ? availableAbove : availableBelow,
    };
  }

  useEffect(() => {
    try { localStorage.setItem("bench.model-filter", kindFilter); } catch {}
  }, [kindFilter]);

  function chooseFilter(next) {
    setKindFilter(next);
    setQuery("");
    if (next === "all" || model.kind === next) return;

    const compatible = sortModels(models.filter((candidate) =>
      candidate.kind === next && (!refs.length || assignInputFields(candidate, refs).ok)
    ));
    if (compatible[0]) {
      onChange(compatible[0].id);
      setOpen(false);
    }
  }

  function togglePinnedFilter() {
    const next = pinnedFilter === kindFilter ? "" : kindFilter;
    setPinnedFilter(next);
    try {
      if (next) localStorage.setItem("bench.model-filter-pinned", next);
      else localStorage.removeItem("bench.model-filter-pinned");
    } catch {}
  }

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const placePopover = () => setPopoverStyle(measurePopover());
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", placePopover);
    document.querySelector(".scroll")?.addEventListener("scroll", placePopover, { passive: true });
    placePopover();
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", placePopover);
      document.querySelector(".scroll")?.removeEventListener("scroll", placePopover);
    };
  }, [open]);

  function choose(candidate) {
    onChange(candidate.id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={`model-picker${open ? " open" : ""}`}>
      <button
        type="button"
        className="model-picker-trigger"
        aria-label={`Modell wechseln, aktuell ${model.label}, ${modelKindLabel(model)}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => {
          if (!current) {
            setKindFilter(model.kind);
            setQuery("");
            setPopoverStyle(measurePopover());
          }
          return !current;
        })}
      >
        {model.thumbnail && <img src={model.thumbnail} alt="" />}
        <span className="model-picker-name">{model.label}</span>
        <span className={`model-picker-kind kind-${model.kind}${referenceActive ? " reference" : ""}`}>
          {referenceActive ? modelLaneLabel(model) : modelKindLabel(model)}
        </span>
        <i className="menu-chevron" aria-hidden="true" />
      </button>

      {open && createPortal((
        <div ref={popoverRef} className="model-picker-popover" style={popoverStyle ?? undefined}>
          <div className="model-picker-head">
            <div className="model-picker-head-copy">
              <strong>Modell wählen</strong>
              <span>Starte mit dem Ausgabetyp</span>
            </div>
            <div className="model-picker-head-actions">
              <span className="model-picker-count">{models.length} verfügbar</span>
              {kindFilter !== "all" && (
                <button
                  type="button"
                  className={`model-filter-pin${pinnedFilter === kindFilter ? " active" : ""}`}
                  aria-pressed={pinnedFilter === kindFilter}
                  onClick={togglePinnedFilter}
                  title={pinnedFilter === kindFilter ? "Standard entfernen" : "Diese Auswahl als Standard öffnen"}
                >
                  <i aria-hidden="true" />
                  {pinnedFilter === kindFilter ? "Standard" : "Als Standard"}
                </button>
              )}
            </div>
          </div>
          <div className="model-kind-filter" role="group" aria-label="Modelle nach Ausgabetyp filtern">
            <span className="model-kind-filter-label">Ausgabe</span>
            <div className="model-kind-filter-options">
              {[
                { id: "all", label: "Alle", count: models.length },
                { id: "image", label: "Bild", count: kindCounts.image ?? 0 },
                { id: "video", label: "Video", count: kindCounts.video ?? 0 },
              ].filter((filter) => filter.id === "all" || filter.count > 0).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`model-kind-filter-button${kindFilter === filter.id ? " active" : ""}`}
                  aria-pressed={kindFilter === filter.id}
                  aria-label={filter.id === "all" ? "Alle Modelle anzeigen" : `Ausgabe auf ${filter.label} umstellen`}
                  onClick={() => chooseFilter(filter.id)}
                >
                  <span className={`model-kind-filter-mark ${filter.id}`} aria-hidden="true" />
                  <span className="model-kind-filter-name">{filter.label}</span>
                  <b>{filter.count}</b>
                </button>
              ))}
            </div>
          </div>
          <input
            ref={searchRef}
            className="model-search"
            type="search"
            value={query}
            placeholder="Modelle durchsuchen"
            aria-label="Modelle durchsuchen"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="model-list" role="listbox" aria-label="Verfügbare Modelle">
            {filteredModels.map((candidate) => (
              <button
                type="button"
                role="option"
                aria-selected={candidate.id === model.id}
                className={`model-option${candidate.id === model.id ? " selected" : ""}`}
                key={candidate.id}
                onClick={() => choose(candidate)}
              >
                {candidate.thumbnail ? (
                  <img src={candidate.thumbnail} alt="" />
                ) : (
                  <span className="model-option-placeholder" aria-hidden="true" />
                )}
                <span className="model-option-copy">
                  <b>{candidate.label}</b>
                  <small>
                    {candidate.vendor} · {modelLaneLabel(candidate)} · {modelPrice(candidate)}
                    {candidate.capabilities?.modalities?.length ? ` · nimmt ${candidate.capabilities.modalities.join(" + ")}` : ""}
                  </small>
                </span>
                <span className="model-option-tail">
                  <span className={`model-option-kind kind-${candidate.kind}`}>{modelKindLabel(candidate)}</span>
                  {candidate.id === popularModelId && <em className="model-option-recommended">Beliebt</em>}
                  {candidate.tier === "fastest" && <em>Schnell</em>}
                  {candidate.id === model.id && <strong aria-label="Ausgewählt">✓</strong>}
                </span>
              </button>
            ))}
            {!filteredModels.length && (
              <div className="model-empty">
                Keine {kindFilter === "all" ? "Modelle" : `${kindFilter === "image" ? "Bild" : "Video"}-Modelle`} passen zu „{query}“.
              </div>
            )}
          </div>
        </div>
      ), document.body)}
    </div>
  );
}

export default function PromptBar({
  catalog, model, idea, setIdea, format, setFormat,
  params, setParams, hide, refs, onAttach, onRemoveRef,
  rewritten, setRewritten, onOptimize, onGenerate,
  quote, busy, running, onPickModel, referenceModel, shotSettings, setShotSettings,
}) {
  const fileRef = useRef(null);
  const [openRewrite, setOpenRewrite] = useState(true);
  const [showDropzone, setShowDropzone] = useState(false);
  const [dragging, setDragging] = useState(false);

  if (!catalog || !model) {
    return (
      <div className="bar-wrap">
        <div className="bar-loading" aria-busy="true">
          <span className="loading-orb" aria-hidden="true" />
          <div>
            <strong>Verbindung zum Modell-Katalog</strong>
            <span>Die Regler für dein erstes Motiv werden geladen.</span>
          </div>
          <small>Einen Moment</small>
        </div>
      </div>
    );
  }

  // Endpoints list their params in arbitrary order, so rank by what a person
  // actually reaches for. Without this, an interesting control like LTX's
  // camera_motion gets pushed off the bar by plumbing.
  const CHIP_ORDER = [
    "aspect_ratio", "duration", "resolution", "image_size", "camera_motion",
    "shot_type", "quality", "thinking_level", "fps", "num_images",
    "generate_audio", "enable_prompt_expansion", "auto_fix",
  ];
  const rank = (n) => {
    const i = CHIP_ORDER.indexOf(n);
    return i === -1 ? 99 : i;
  };

  const chipParams = Object.entries(model.params)
    .filter(([n, s]) => !hide.has(n) && s.enum?.length)
    .sort(([a], [b]) => rank(a) - rank(b))
    .slice(0, 5);

  const ready = Boolean((rewritten?.prompt ?? idea).trim());
  const rewriteWords = String(rewritten?.prompt ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const canAttach = Boolean(imageInputFor(model) || referenceModel);
  const directInputs = mediaInputsFor(model);
  const acceptedModalities = [...new Set(directInputs.map((input) => input.modality).filter((item) => item !== "mixed"))];
  if (!acceptedModalities.includes("image") && referenceModel) acceptedModalities.push("image");
  const canAttachMedia = acceptedModalities.length > 0;
  const accept = acceptedModalities.map((type) => ({
    image: "image/png,image/jpeg,image/webp,image/gif",
    video: "video/mp4,video/quicktime",
    audio: "audio/mpeg,audio/wav,audio/x-wav",
    document: "application/pdf",
  }[type])).filter(Boolean).join(",");
  const acceptedLabel = acceptedModalities.map((type) => type === "document" ? "PDF" : type).join(", ");
  const attachmentHint = directInputs.length === 0 && referenceModel
    ? `Mit einem Bild wechselt das Studio zu ${referenceModel.label}`
    : acceptedLabel
    ? `Dieses Modell akzeptiert: ${acceptedLabel}`
    : "Wähle zuerst ein passendes Modell";
  const quickFormats = [
    { id: "ugc", label: "UGC-Werbung" },
    { id: "none", label: "Freiform" },
    { id: "unboxing", label: "Unboxing" },
    { id: "product", label: "Produktfoto" },
  ];
  const quickFormatIds = new Set(quickFormats.map(({ id }) => id));
  const otherFormats = (catalog.formats ?? []).filter(({ id }) => !quickFormatIds.has(id));
  const otherFormatOptions = otherFormats.map(({ id, label }) => ({ value: id, label }));

  async function addFiles(fileList) {
    const files = Array.from(fileList ?? []);
    for (const file of files) await onAttach(file);
  }

  return (
    <div className="bar-wrap">
      <div className="bar">
        <div className="preset-row" aria-label="Erstellungsmodus">
          <span className="preset-label">Modus</span>
          {quickFormats.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset${format === preset.id ? " on" : ""}`}
              onClick={() => setFormat(preset.id)}
            >
              {preset.label}
            </button>
          ))}
          {format === "ugc" && <span className="preset-detail">eine Person / ein Ablauf / Handy-Look</span>}
          {otherFormats.length > 0 && (
            <div className={`preset-more${quickFormatIds.has(format) ? "" : " on"}`}>
              <MenuSelect
                value={quickFormatIds.has(format) ? "" : format}
                options={otherFormatOptions}
                placeholder="Weitere Modi"
                ariaLabel="Weitere Erstellungsmodi"
                onChange={setFormat}
              />
            </div>
          )}
        </div>

        <ShotDirection format={format} values={shotSettings} onChange={setShotSettings} />

        <div className="bar-top">
          {refs.length > 0 && (
            <div className="attach-thumbs">
              {refs.map((r, i) => (
                <span className="attach-thumb-wrap" key={r.url}>
                  {r.media_type === "image" ? (
                    <img className="attach-thumb" src={r.preview} alt={r.name} />
                  ) : (
                    <span className={`attach-file attach-file-${r.media_type}`} title={r.name}>
                      <b>{r.media_type === "document" ? "PDF" : r.media_type}</b>
                      <small>{r.name}</small>
                    </span>
                  )}
                  <button
                    type="button"
                    className="attach-remove"
                    onClick={() => onRemoveRef(i)}
                    aria-label={`${r.name} entfernen`}
                    title="Referenz entfernen"
                  >×</button>
                </span>
              ))}
            </div>
          )}

          {!showDropzone && (
            <button
              type="button"
              className="attach"
              onClick={() => setShowDropzone(true)}
              disabled={busy || !canAttachMedia}
              aria-expanded={false}
              aria-label="Eingabe-Medien hinzufügen"
              title={
                imageInputFor(model)
                  ? `Referenzbild anhängen (${modelLaneLabel(model)})`
                  : referenceModel
                  ? `Referenzbild anhängen — wechselt zu ${modelLaneLabel(referenceModel)}`
                  : "Dieses Modell nimmt kein Referenzbild"
              }
            >
              +
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <textarea
            id="prompt-idea"
            name="prompt"
            value={idea}
            placeholder="Beschreibe, was du erstellen willst…"
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                rewritten ? onGenerate() : onOptimize();
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onGenerate();
              }
            }}
          />

          <button type="button" className="go" onClick={rewritten ? onGenerate : onOptimize} disabled={busy || !ready}>
            {running ? "Läuft…" : busy ? "Arbeitet…" : rewritten ? "Generieren" : "Prompt verfeinern"}
          </button>
        </div>

        {showDropzone && (
          <div className="dropzone-wrap">
            <div
              className={`dropzone${dragging ? " dragging" : ""}`}
              role="button"
              tabIndex={canAttachMedia ? 0 : -1}
              aria-label="Eingabe-Medien hinzufügen"
              aria-disabled={!canAttachMedia}
              onClick={() => {
                if (canAttachMedia && !busy) fileRef.current?.click();
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && canAttachMedia && !busy) {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <div className="dropzone-visual" aria-hidden="true">
                <span className="dropzone-card dropzone-card-back" />
                <span className="dropzone-card dropzone-card-front"><i /></span>
                <span className="dropzone-sweep" />
              </div>
              <div className="dropzone-copy">
                <strong>{dragging ? "Loslassen zum Anhängen" : "Medien hier ablegen"}</strong>
                <span>{attachmentHint} · oder klicken zum Auswählen</span>
              </div>
              {refs.length > 0 && (
                <span className="dropzone-count">
                  {refs.length} {refs.length === 1 ? "Datei" : "Dateien"} angehängt · passend zu {modelLaneLabel(model)}
                </span>
              )}
            </div>
            <button
              type="button"
              className="dropzone-close"
              aria-label="Medienbereich schließen"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropzone(false);
                setDragging(false);
              }}
            >
              Schließen
            </button>
          </div>
        )}

        <div className="bar-chips">
          <ModelPicker
            model={model}
            models={catalog.models}
            onChange={onPickModel}
            referenceActive={refs.length > 0}
            refs={refs}
          />

          {chipParams.map(([name, spec]) => (
            <span className="chip" key={name} title={spec.description}>
              <MenuSelect
                value={params[name] ?? spec.default ?? spec.enum[0]}
                options={spec.enum.map((o) => ({ value: String(o), label: prettyParam(name, o) }))}
                ariaLabel={paramLabel(name)}
                onChange={(value) => setParams((p) => ({ ...p, [name]: value }))}
              />
            </span>
          ))}

          {quote?.cost != null ? (
            <span className="bar-price exact" title={quote.basis}>
              <span>Geschätzte Kosten</span>
              <b>${quote.cost.toFixed(3)}</b>
            </span>
          ) : quote?.confidence === "unquotable" ? (
            <span className="bar-price metered" title={quote.basis}>
              <span className="bar-price-label">Nutzungsbasierter Preis</span>
              <span className="bar-price-rate">
                <strong>${quote.unit_price}</strong>
                <span>pro {PRICE_UNITS[quote.unit] ?? quote.unit}</span>
              </span>
              <small>Exakter Betrag nach der Generierung</small>
            </span>
          ) : null}
        </div>
      </div>

      {rewritten && (
        <section className="rewrite" aria-label="Bearbeitbarer Prompt-Entwurf">
          <div className="rewrite-head">
            <div className="rewrite-title">
              <strong>Prompt-Entwurf</strong>
              <span>
                {rewritten.optimized
                  ? `Abgestimmt auf ${model.label}`
                  : `Wird unverändert gesendet · ${rewritten.reason}`}
              </span>
            </div>
            <div className="rewrite-actions">
              <button type="button" className="rewrite-action" onClick={() => setRewritten(null)}>Verwerfen</button>
              <button
                type="button"
                className="rewrite-action"
                aria-expanded={openRewrite}
                onClick={() => setOpenRewrite((v) => !v)}
              >
                {openRewrite ? "Ausblenden" : "Entwurf bearbeiten"}
              </button>
            </div>
          </div>
          {openRewrite && (
            <div className="rewrite-body">
              <label htmlFor="rewritten-prompt">Passe die Formulierung an, bevor du generierst.</label>
              <textarea
                id="rewritten-prompt"
                name="rewritten-prompt"
                aria-label="Bearbeitbarer, umgeschriebener Prompt"
                value={rewritten.prompt}
                onChange={(e) => setRewritten({ ...rewritten, prompt: e.target.value })}
              />
              <div className="rewrite-foot">
                <span>{rewriteWords} {rewriteWords === 1 ? "Wort" : "Wörter"}</span>
                <span>Deine Änderungen werden für die nächste Generierung verwendet.</span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
