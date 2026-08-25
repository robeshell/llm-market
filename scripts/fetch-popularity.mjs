import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL =
  "https://openrouter.ai/api/v1/models?sort=top-weekly&output_modalities=text";
const LIMIT = 50;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outFile = path.join(root, "data", "popularity.json");

function num(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pricePerMillion(value) {
  const price = num(value);
  return price === null ? null : price * 1_000_000;
}

function providerSlugFromId(id) {
  return id.split("/", 1)[0] || "unknown";
}

function providerName(rawName, providerSlug) {
  const separator = rawName.indexOf(":");
  if (separator > 0) return rawName.slice(0, separator).trim();
  return providerSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function modelName(rawName) {
  const separator = rawName.indexOf(":");
  return separator > 0 ? rawName.slice(separator + 1).trim() : rawName;
}

function modalities(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "llm-model-comparison/0.1",
    },
  });
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const models = Array.isArray(payload?.data) ? payload.data : [];
  if (models.length === 0) throw new Error("OpenRouter popularity data is empty");

  const items = models.slice(0, LIMIT).map((model, index) => {
    const id = typeof model.id === "string" ? model.id : "";
    const rawName = typeof model.name === "string" ? model.name : id;
    const providerSlug = providerSlugFromId(id);
    const architecture = model.architecture ?? {};
    const pricing = model.pricing ?? {};
    return {
      rank: index + 1,
      id,
      canonicalSlug:
        typeof model.canonical_slug === "string" ? model.canonical_slug : id,
      name: modelName(rawName),
      provider: providerName(rawName, providerSlug),
      providerSlug,
      contextLength: num(model.context_length),
      inputPerMillion: pricePerMillion(pricing.prompt),
      outputPerMillion: pricePerMillion(pricing.completion),
      inputModalities: modalities(architecture.input_modalities),
      outputModalities: modalities(architecture.output_modalities),
    };
  });

  const snapshot = {
    updatedAt: new Date().toISOString(),
    source: "OpenRouter",
    window: "top-weekly",
    items,
  };

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${items.length} popular models → data/popularity.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

