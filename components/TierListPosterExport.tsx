"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogModel } from "@/lib/model-catalog";
import { logoForCreator } from "@/lib/vendors";

const WIDTH = 1200;
const HEADER_HEIGHT = 250;
const FOOTER_HEIGHT = 84;
const LABEL_WIDTH = 188;
const CHIP_COLUMNS = 3;
const CHIP_HEIGHT = 72;
const CHIP_GAP = 14;
const SANS_FONT =
  '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const MONO_FONT =
  '"SFMono-Regular", "Roboto Mono", "IBM Plex Mono", monospace';

const logoImageCache = new Map<
  string,
  Promise<HTMLImageElement | null>
>();

export type TierListRow = {
  key: string;
  label: string;
  color: string;
  modelSlugs: string[];
};

type TierListPosterExportProps = {
  title: string;
  author: string;
  tiers: TierListRow[];
  models: CatalogModel[];
  updatedAt: string;
};

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function fitText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
): string {
  if (context.measureText(value).width <= maxWidth) return value;
  let result = value;
  while (result.length > 1 && context.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

function loadLogo(source: string | null): Promise<HTMLImageElement | null> {
  if (!source) return Promise.resolve(null);
  const cached = logoImageCache.get(source);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
  logoImageCache.set(source, promise);
  return promise;
}

function drawLogo(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  provider: string,
  x: number,
  y: number,
  size: number,
) {
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.fillStyle = "#f2f2f0";
  context.fill();
  context.clip();

  if (image) {
    const imageWidth = image.naturalWidth || image.width || size;
    const imageHeight = image.naturalHeight || image.height || size;
    const scale = Math.min(size / imageWidth, size / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    context.drawImage(
      image,
      x + (size - width) / 2,
      y + (size - height) / 2,
      width,
      height,
    );
  } else {
    context.fillStyle = "#5d5f60";
    context.fillRect(x, y, size, size);
    context.fillStyle = "#ffffff";
    context.font = `700 16px ${SANS_FONT}`;
    context.textAlign = "center";
    context.fillText(
      provider.trim().charAt(0).toUpperCase() || "?",
      x + size / 2,
      y + size / 2 + 6,
    );
  }
  context.restore();

  context.strokeStyle = "#46494a";
  context.lineWidth = 1;
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.stroke();
  context.textAlign = "left";
}

async function drawTierList(
  canvas: HTMLCanvasElement,
  { title, author, tiers, models, updatedAt }: TierListPosterExportProps,
  isCurrent: () => boolean,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const modelBySlug = new Map(models.map((model) => [model.slug, model]));
  const rows = tiers.map((tier) => ({
    tier,
    models: tier.modelSlugs
      .map((slug) => modelBySlug.get(slug))
      .filter((model): model is CatalogModel => Boolean(model)),
  }));
  const logoSources = new Map<string, string | null>();
  rows.forEach(({ models: rowModels }) => {
    rowModels.forEach((model) => {
      logoSources.set(
        model.slug,
        logoForCreator(model.provider, model.creatorLogo),
      );
    });
  });
  const logoEntries = await Promise.all(
    Array.from(logoSources.entries()).map(async ([slug, source]) => [
      slug,
      await loadLogo(source),
    ] as const),
  );
  if (!isCurrent()) return;

  const logoBySlug = new Map(logoEntries);
  const contentX = LABEL_WIDTH + 38;
  const contentWidth = WIDTH - contentX - 48;
  const chipWidth = (contentWidth - (CHIP_COLUMNS - 1) * CHIP_GAP) / CHIP_COLUMNS;
  const rowMetrics = rows.map((row) => {
    const lines = Math.max(1, Math.ceil(row.models.length / CHIP_COLUMNS));
    return { ...row, height: Math.max(120, 34 + lines * (CHIP_HEIGHT + CHIP_GAP)) };
  });
  const boardHeight = rowMetrics.reduce((sum, row) => sum + row.height, 0);
  const height = HEADER_HEIGHT + boardHeight + FOOTER_HEIGHT;
  const totalModels = rows.reduce((sum, row) => sum + row.models.length, 0);

  canvas.width = WIDTH;
  canvas.height = height;
  context.imageSmoothingEnabled = true;
  context.textBaseline = "alphabetic";
  context.textAlign = "left";

  context.fillStyle = "#0d0e0f";
  context.fillRect(0, 0, WIDTH, height);

  const headerGradient = context.createLinearGradient(0, 0, WIDTH, HEADER_HEIGHT);
  headerGradient.addColorStop(0, "#1a1c1d");
  headerGradient.addColorStop(1, "#0d0e0f");
  context.fillStyle = headerGradient;
  context.fillRect(0, 0, WIDTH, HEADER_HEIGHT);

  context.strokeStyle = "#252829";
  context.lineWidth = 1;
  for (let x = 32; x < WIDTH; x += 96) {
    context.beginPath();
    context.moveTo(x, HEADER_HEIGHT);
    context.lineTo(x, height - FOOTER_HEIGHT);
    context.stroke();
  }
  for (let y = HEADER_HEIGHT + 48; y < height - FOOTER_HEIGHT; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(WIDTH, y);
    context.stroke();
  }

  context.save();
  context.globalAlpha = 0.2;
  context.strokeStyle = "#caff27";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(WIDTH - 70, 38, 110, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(WIDTH - 70, 38, 148, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(WIDTH - 70, 38, 186, 0, Math.PI * 2);
  context.stroke();
  context.restore();

  context.fillStyle = "#a5a5a5";
  context.font = `500 16px ${MONO_FONT}`;
  context.fillText("LLM 模型对比", 52, 54);
  context.fillStyle = "#caff27";
  context.fillRect(52, 72, 72, 3);

  context.fillStyle = "#ffffff";
  context.font = `700 60px ${SANS_FONT}`;
  context.fillText(fitText(context, title || "我的模型榜单", 780), 52, 146);

  context.fillStyle = "#bdbdbd";
  context.font = `400 20px ${SANS_FONT}`;
  context.fillText(author ? `${author} · 自定义模型排行` : "自定义模型排行", 54, 194);

  context.fillStyle = "#d0d0d0";
  context.font = `500 18px ${MONO_FONT}`;
  context.textAlign = "right";
  context.fillText(`${totalModels} 个模型`, WIDTH - 52, 54);
  context.textAlign = "left";

  let rowY = HEADER_HEIGHT;
  rowMetrics.forEach(({ tier, models: modelsInTier, height: rowHeight }, rowIndex) => {
    context.fillStyle = rowIndex % 2 === 0 ? "#121415" : "#101213";
    context.fillRect(0, rowY, WIDTH, rowHeight);
    context.strokeStyle = "#2a2d2e";
    context.strokeRect(0, rowY, WIDTH, rowHeight);

    context.fillStyle = tier.color;
    context.fillRect(0, rowY, LABEL_WIDTH, rowHeight);
    context.fillStyle = "#111111";
    context.font = `700 26px ${SANS_FONT}`;
    context.fillText(
      fitText(context, tier.label || tier.key, LABEL_WIDTH - 36),
      28,
      rowY + rowHeight / 2 - 4,
    );
    context.font = `500 14px ${MONO_FONT}`;
    context.fillText(`${modelsInTier.length} 个模型`, 30, rowY + rowHeight / 2 + 26);

    modelsInTier.forEach((model, index) => {
      const column = index % CHIP_COLUMNS;
      const line = Math.floor(index / CHIP_COLUMNS);
      const chipX = contentX + column * (chipWidth + CHIP_GAP);
      const chipY = rowY + 18 + line * (CHIP_HEIGHT + CHIP_GAP);

      roundedRect(context, chipX, chipY, chipWidth, CHIP_HEIGHT, 10);
      context.fillStyle = "#1b1d1e";
      context.fill();
      context.strokeStyle = "#3d4142";
      context.stroke();

      drawLogo(
        context,
        logoBySlug.get(model.slug) ?? null,
        model.provider,
        chipX + 14,
        chipY + 14,
        44,
      );

      context.fillStyle = "#f2f2f2";
      context.font = `500 17px ${SANS_FONT}`;
      context.fillText(fitText(context, model.name, chipWidth - 82), chipX + 70, chipY + 31);
      context.fillStyle = "#999d9e";
      context.font = `400 14px ${SANS_FONT}`;
      context.fillText(fitText(context, model.provider, chipWidth - 82), chipX + 70, chipY + 54);
    });

    if (modelsInTier.length === 0) {
      context.fillStyle = "#666666";
      context.font = `400 16px ${SANS_FONT}`;
      context.fillText("还没有加入模型", contentX, rowY + rowHeight / 2 + 5);
    }

    rowY += rowHeight;
  });

  context.strokeStyle = "#292929";
  context.beginPath();
  context.moveTo(52, height - FOOTER_HEIGHT + 28);
  context.lineTo(WIDTH - 52, height - FOOTER_HEIGHT + 28);
  context.stroke();

  context.fillStyle = "#858585";
  context.font = `400 16px ${SANS_FONT}`;
  context.fillText(
    `LLM 模型对比 · 数据更新至 ${updatedAt.slice(0, 10) || "—"}`,
    52,
    height - 34,
  );
  context.textAlign = "right";
  context.font = `500 16px ${MONO_FONT}`;
  context.fillText("LLM 模型对比", WIDTH - 52, height - 34);
  context.textAlign = "left";
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function TierListPosterExport({
  title,
  author,
  tiers,
  models,
  updatedAt,
}: TierListPosterExportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderIdRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const renderId = ++renderIdRef.current;
    if (!open) return;
    if (canvasRef.current) {
      void drawTierList(
        canvasRef.current,
        {
          title,
          author,
          tiers,
          models,
          updatedAt,
        },
        () => renderIdRef.current === renderId,
      );
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [author, models, open, tiers, title, updatedAt]);

  async function getBlob() {
    if (!canvasRef.current) return null;
    return canvasToBlob(canvasRef.current);
  }

  async function download() {
    const blob = await getBlob();
    if (!blob) {
      setStatus("图片生成失败，请重试");
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `llm-自定义榜单-${new Date().toISOString().slice(0, 10)}.png`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("已下载 PNG 图片");
  }

  async function copy() {
    const blob = await getBlob();
    if (!blob) {
      setStatus("图片生成失败，请重试");
      return;
    }
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      setStatus("当前浏览器不支持复制图片，请下载 PNG");
      return;
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setStatus("图片已复制，可以直接粘贴分享");
    } catch {
      setStatus("复制失败，请下载 PNG 图片");
    }
  }

  return (
    <>
      <button
        type="button"
        className="custom-ranking-export-button"
        onClick={() => {
          setStatus("");
          setOpen(true);
        }}
      >
        <span>导出图片</span>
        <span className="poster-export-arrow" aria-hidden>
          →
        </span>
      </button>
      {open ? (
        <div
          className="ranking-poster-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <section
            className="ranking-poster-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-ranking-poster-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ranking-poster-dialog-header">
              <div>
                <p className="ranking-poster-eyebrow">PNG EXPORT</p>
                <h2 id="custom-ranking-poster-title">导出自定义榜单</h2>
              </div>
              <button
                type="button"
                className="ranking-poster-close"
                onClick={() => setOpen(false)}
              >
                关闭
              </button>
            </div>
            <div className="ranking-poster-content">
              <div className="ranking-poster-preview">
                <canvas ref={canvasRef} aria-label="自定义榜单图片预览" />
              </div>
              <div className="ranking-poster-actions">
                <p className="ranking-poster-description">
                  把自己的模型判断变成一张榜单图片，适合发到 X / 推特和朋友圈。
                </p>
                <p className="ranking-poster-description ranking-poster-description-muted">
                  图片会保留你的标题、署名、等级名称和模型顺序。
                </p>
                <div className="ranking-poster-buttons">
                  <button
                    type="button"
                    className="poster-download-button"
                    onClick={download}
                  >
                    下载 PNG
                  </button>
                  <button
                    type="button"
                    className="poster-copy-button"
                    onClick={copy}
                  >
                    复制图片
                  </button>
                </div>
                <p className="ranking-poster-status" aria-live="polite">
                  {status}
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
