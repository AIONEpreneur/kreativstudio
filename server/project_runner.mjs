import { Codex } from "@openai/codex-sdk";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectTextOverflow } from "./pdf_preflight.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const requestPath = resolve(process.argv[2] ?? "");
if (!requestPath || !existsSync(requestPath)) throw new Error("A valid project request file is required.");
const request = JSON.parse(await readFile(requestPath, "utf8"));
const outputDir = resolve(request.output_dir);
await mkdir(outputDir, { recursive: true });

function stage(progress, message) {
  console.log(`BENCH_STAGE:${progress}:${message}`);
}

function chromePrint(htmlPath, pdfPath) {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  return new Promise((resolvePromise, reject) => {
    const child = spawn(chrome, [
      "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise() : reject(new Error(stderr || `Chrome exited ${code}`)));
  });
}

const isWebsite = request.kind === "website";
const reference = request.reference_path && existsSync(request.reference_path)
  ? `You may inspect this local reference for craft and interaction ideas: ${request.reference_path}. Do not copy its brand, text, structure, or assets.`
  : "";
const requiredFiles = isWebsite
  ? "Create index.html, styles.css, and app.js. Everything must run as a static site with no build step and no external network dependency."
  : "Create document.html as a complete print-ready A4 document. Use CSS @page, explicit page sections, and local/system fonts only. Every text block must fit its column: use min-width:0 in grids, size display type to its actual measure, and use overflow-wrap as a safety net. No heading, label, or paragraph may have scrollWidth greater than clientWidth.";

const prompt = `You are the production engine inside Bench Studio. Build a polished ${isWebsite ? "website" : "PDF document"} directly in the current working directory.

This is a bounded build. Do not read skills, search for additional instructions, or attempt to render the PDF yourself. Bench owns final rendering and visual QA after your turn. Inspect only the named craft reference and the files you create here.

PROJECT
Title: ${request.title}
Brief: ${request.prompt}
Direction: ${request.template}
${reference}

REQUIREMENTS
- ${requiredFiles}
- Make the result original, art-directed, readable, responsive where applicable, and ready to show a client.
- Do not use placeholder copy, lorem ipsum, fake testimonials, fake metrics, or stock-image URLs.
- Use a coherent type scale and one restrained accent system.
- Avoid generic AI gradients, excessive pills, glass cards, cute microcopy, and repetitive equal-card layouts.
- If imagery was not supplied, use intentional typography, CSS geometry, canvas, gradients, and procedural visual treatments instead of broken image placeholders.
- ${isWebsite ? "Include meaningful interaction and motion, with prefers-reduced-motion support. A 3D or spatial direction may use native Canvas/WebGL or CSS perspective." : "Write substantive content from the brief. Keep every page visually composed. Never use background-clip:text because Chrome print can replace the glyph mask with a gradient box."}
- Do not read credentials, touch files outside this project, browse the web, install packages, or call external APIs.
- Inspect your finished files and fix obvious visual, semantic, and accessibility defects before stopping.

When complete, reply with a short factual summary. The files, not the reply, are the deliverable.`;

stage(8, "Preparing the creative brief");
const eventsPath = join(outputDir, "codex-events.jsonl");
await writeFile(eventsPath, "");
const codex = new Codex({
  config: { features: { apps: false, browser_use: false, computer_use: false, image_generation: false, multi_agent: false, plugins: false, skill_search: false } },
});
const thread = codex.startThread({
  workingDirectory: outputDir,
  model: request.model || "gpt-5.6-sol",
  modelReasoningEffort: request.reasoning || "low",
  sandboxMode: "workspace-write",
  networkAccessEnabled: false,
  skipGitRepoCheck: true,
  webSearchMode: "disabled",
  webSearchEnabled: false,
  approvalPolicy: "never",
});

const controller = new AbortController();
let lastEvent = Date.now();
const timeout = setTimeout(() => controller.abort(new Error("Project build exceeded 14 minutes")), 14 * 60_000);
const watchdog = setInterval(() => {
  if (Date.now() - lastEvent > 6 * 60_000) controller.abort(new Error("Project build produced no progress for 6 minutes"));
}, 15_000);
watchdog.unref();

try {
  stage(18, `Codex is designing the ${isWebsite ? "site" : "document"}`);
  const { events } = await thread.runStreamed(prompt, { signal: controller.signal });
  for await (const event of events) {
    lastEvent = Date.now();
    await appendFile(eventsPath, `${JSON.stringify(event)}\n`);
    if (event.type === "turn.started") stage(24, "Creative build started");
    if (event.type === "item.started" && event.item?.type === "command_execution") stage(48, "Building and inspecting files");
    if (event.type === "turn.failed") throw new Error(event.error?.message || "Codex build failed");
    if (event.type === "error") throw new Error(event.message || "Codex build failed");
  }
} finally {
  clearTimeout(timeout);
  clearInterval(watchdog);
}

if (isWebsite) {
  const entry = join(outputDir, "index.html");
  if (!existsSync(entry)) throw new Error("The website build did not create index.html");
  stage(92, "Website files are ready");
  await writeFile(join(outputDir, "result.json"), JSON.stringify({ entry_file: entry, artifact_file: entry }, null, 2));
} else {
  const entry = join(outputDir, "document.html");
  const pdf = join(outputDir, `${request.slug || "document"}.pdf`);
  if (!existsSync(entry)) throw new Error("The document build did not create document.html");
  stage(78, "Rendering the print edition");
  const overflow = await inspectTextOverflow(entry);
  if (overflow.length) {
    const summary = overflow.slice(0, 5).map((item) => `${item.element}: “${item.text}”`).join("; ");
    throw new Error(`Print preflight found overflowing text. ${summary}`);
  }
  await chromePrint(entry, pdf);
  if (!existsSync(pdf)) throw new Error("Chrome did not produce the PDF");
  stage(92, "PDF rendered and archived");
  await writeFile(join(outputDir, "result.json"), JSON.stringify({ entry_file: entry, artifact_file: pdf }, null, 2));
}
stage(100, "Complete");
