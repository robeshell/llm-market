import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const logosDir = path.join(root, "public", "logos");
const AA_LOGO_BASE = "https://artificialanalysis.ai/img/logos";

function safeLogoName(name) {
  const base = path.basename(String(name || ""));
  if (!base || base !== name || base.includes("..")) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return null;
  return base;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function collectLogoNames() {
  const names = new Set();
  for (const file of ["prices.json", "rankings.json"]) {
    try {
      const raw = await readFile(path.join(root, "data", file), "utf8");
      const snapshot = JSON.parse(raw);
      for (const item of snapshot.items ?? []) {
        const logo = safeLogoName(item.creatorLogo);
        if (logo) names.add(logo);
      }
    } catch {
      // snapshot may be missing on first run
    }
  }
  return [...names];
}

async function downloadLogo(name) {
  const dest = path.join(logosDir, name);
  if (await exists(dest)) return "skip";

  const res = await fetch(`${AA_LOGO_BASE}/${name}`, {
    headers: {
      Accept: "image/*,*/*",
      "User-Agent":
        "Mozilla/5.0 (compatible; llm-market/0.1; +https://github.com/robeshell/llm-market)",
    },
  });
  if (!res.ok) {
    console.warn(`logo miss ${name}: ${res.status}`);
    return "fail";
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 16) {
    console.warn(`logo empty ${name}`);
    return "fail";
  }
  await writeFile(dest, buf);
  return "ok";
}

async function main() {
  await mkdir(logosDir, { recursive: true });
  const names = await collectLogoNames();
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const name of names) {
    const result = await downloadLogo(name);
    if (result === "ok") ok += 1;
    else if (result === "skip") skip += 1;
    else fail += 1;
  }

  console.log(
    `Logos: ${ok} downloaded, ${skip} cached, ${fail} failed, ${names.length} total → public/logos/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
