import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAaModels, num } from "./aa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outFile = path.join(root, "data", "rankings.json");

async function main() {
  const models = await fetchAaModels();

  const items = models
    .filter((m) => typeof m.intelligenceIndex === "number" && !m.deprecated)
    .sort((a, b) => b.intelligenceIndex - a.intelligenceIndex)
    .map((m, index) => ({
      rank: index + 1,
      name: m.name,
      shortName: m.shortName || m.name,
      creator: m.modelCreatorName || "—",
      creatorSlug: m.modelCreatorSlug || "",
      creatorLogo: m.modelCreatorLogo || "",
      intelligenceIndex: m.intelligenceIndex,
      codingIndex: num(m.codingIndex),
      agenticIndex: num(m.agenticIndex),
      gpqa: num(m.gpqa),
      hle: num(m.hle),
      scicode: num(m.scicode),
      terminalbench: num(m.terminalbenchV21),
      lcr: num(m.lcr),
      isReasoning: Boolean(m.isReasoning),
      slug: m.slug || "",
    }));

  const snapshot = {
    updatedAt: new Date().toISOString(),
    source: "Artificial Analysis",
    items,
  };

  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${items.length} rankings → data/rankings.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
