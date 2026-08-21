const SOURCE_URL = "https://artificialanalysis.ai/leaderboards/models";

function unescapeJsStringJson(html, arrStart) {
  let i = arrStart;
  let depth = 0;
  let out = "";

  while (i < html.length) {
    const ch = html[i];
    if (ch === "\\") {
      const n = html[i + 1];
      if (n === '"') {
        out += '"';
        i += 2;
        continue;
      }
      if (n === "n") {
        out += "\n";
        i += 2;
        continue;
      }
      if (n === "r") {
        out += "\r";
        i += 2;
        continue;
      }
      if (n === "t") {
        out += "\t";
        i += 2;
        continue;
      }
      if (n === "\\") {
        out += "\\";
        i += 2;
        continue;
      }
      out += n;
      i += 2;
      continue;
    }

    out += ch;
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) break;
    }
    i += 1;
  }

  return JSON.parse(out);
}

function extractModelsArray(html) {
  const marker = '{\\"models\\":[';
  let from = 0;
  let best = null;

  while (true) {
    const start = html.indexOf(marker, from);
    if (start === -1) break;

    const arrStart = start + marker.length - 1;
    try {
      const models = unescapeJsStringJson(html, arrStart);
      const scored = models.filter(
        (m) => typeof m?.intelligenceIndex === "number",
      ).length;
      if (scored > 0 && (!best || scored > best.scored)) {
        best = { models, scored };
      }
    } catch {
      // ignore malformed chunks
    }

    from = start + marker.length;
  }

  if (!best) {
    throw new Error("models payload not found in Artificial Analysis HTML");
  }

  return best.models;
}

export function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function fetchAaModels() {
  const res = await fetch(SOURCE_URL, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    throw new Error(`Artificial Analysis ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  return extractModelsArray(html);
}
