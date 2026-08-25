import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAaModels, num } from "./aa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outFile = path.join(root, "data", "prices.json");

async function main() {
  const models = await fetchAaModels();

  const items = models
    .filter((m) => typeof m.intelligenceIndex === "number" && !m.deprecated)
    .map((m) => ({
      id: m.slug || m.id,
      name: m.shortName || m.name,
      provider: m.modelCreatorName || "—",
      creatorLogo: m.modelCreatorLogo || "",
      contextLength: num(m.contextWindowTokens),
      inputPerMillion: num(m.price1mInputTokens),
      outputPerMillion: num(m.price1mOutputTokens),
      intelligenceIndex: m.intelligenceIndex,
      isOpenWeights: typeof m.isOpenWeights === "boolean" ? m.isOpenWeights : null,
      releaseDate: m.releaseDate || null,
      huggingFaceUrl: m.huggingfaceUrl || null,
    }))
    .filter(
      (row) =>
        row.inputPerMillion !== null || row.outputPerMillion !== null,
    )
    .sort((a, b) => {
      const score = (b.intelligenceIndex ?? 0) - (a.intelligenceIndex ?? 0);
      if (score !== 0) return score;
      const ai = a.inputPerMillion ?? Number.POSITIVE_INFINITY;
      const bi = b.inputPerMillion ?? Number.POSITIVE_INFINITY;
      return ai - bi;
    });

  const snapshot = {
    updatedAt: new Date().toISOString(),
    source: "Artificial Analysis",
    items,
  };

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${items.length} prices → data/prices.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
