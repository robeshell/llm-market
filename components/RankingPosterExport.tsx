"use client";

import { useEffect, useRef, useState } from "react";
import { formatUpdatedAt } from "@/lib/format";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;
const SANS_FONT =
  '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const MONO_FONT =
  '"SFMono-Regular", "Roboto Mono", "IBM Plex Mono", monospace';

export type RankingPosterRow = {
  rank: number;
  name: string;
  provider: string;
  value: string;
  valueLabel: string;
};

type RankingPosterExportProps = {
  rows: RankingPosterRow[];
  title: string;
  scopeLabel: string;
  dimensionLabel: string;
  updatedAt: string;
  source: string;
  description?: string;
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

function drawPoster(
  canvas: HTMLCanvasElement,
  {
    rows,
    title,
    updatedAt,
    source,
  }: RankingPosterExportProps,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  context.imageSmoothingEnabled = true;
  context.textBaseline = "alphabetic";
  context.textAlign = "left";

  context.fillStyle = "#f5f5f3";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.strokeStyle = "#e7e7e3";
  context.lineWidth = 1;
  for (let x = 48; x < CANVAS_WIDTH; x += 96) {
    context.beginPath();
    context.moveTo(x, 300);
    context.lineTo(x, CANVAS_HEIGHT - 92);
    context.stroke();
  }

  context.fillStyle = "#171717";
  context.fillRect(0, 0, CANVAS_WIDTH, 280);

  context.save();
  context.globalAlpha = 0.12;
  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  for (let index = 0; index < 5; index += 1) {
    context.beginPath();
    context.arc(930, 72, 82 + index * 25, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();

  context.fillStyle = "#a3a3a3";
  context.font = `500 18px ${MONO_FONT}`;
  context.fillText("LLM 模型对比", 64, 64);

  context.fillStyle = "#ffffff";
  context.font = `600 72px ${SANS_FONT}`;
  context.fillText(fitText(context, title, 640), 64, 174);

  const visibleRows = rows.slice(0, 8);
  const rowX = 48;
  const rowWidth = 984;
  const rowHeight = 98;
  const rowGap = 12;
  const firstRowY = 308;

  visibleRows.forEach((row, index) => {
    const rowY = firstRowY + index * (rowHeight + rowGap);
    const isFirst = index === 0;

    roundedRect(context, rowX, rowY, rowWidth, rowHeight, 4);
    context.fillStyle = isFirst ? "#ffffff" : "#fafafa";
    context.fill();
    context.strokeStyle = isFirst ? "#171717" : "#dededb";
    context.lineWidth = isFirst ? 2 : 1;
    context.stroke();

    context.fillStyle = isFirst ? "#171717" : "#d4d4d0";
    context.fillRect(rowX, rowY, 6, rowHeight);

    context.fillStyle = isFirst ? "#171717" : "#737373";
    context.font = `500 20px ${MONO_FONT}`;
    context.fillText(String(row.rank).padStart(2, "0"), 82, rowY + 38);

    context.fillStyle = "#171717";
    context.font = `600 25px ${SANS_FONT}`;
    context.fillText(fitText(context, row.name, 570), 172, rowY + 36);

    context.fillStyle = "#737373";
    context.font = `400 16px ${SANS_FONT}`;
    context.fillText(fitText(context, row.provider, 570), 172, rowY + 63);

    if (row.value) {
      context.textAlign = "right";
      context.fillStyle = "#171717";
      context.font = `600 34px ${MONO_FONT}`;
      context.fillText(row.value, 1016, rowY + 46);
      context.fillStyle = "#737373";
      context.font = `400 14px ${SANS_FONT}`;
      context.fillText(row.valueLabel, 1016, rowY + 68);
    }
    context.textAlign = "left";
  });

  const footerY = CANVAS_HEIGHT - 98;
  context.strokeStyle = "#d7d7d3";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(64, footerY);
  context.lineTo(1016, footerY);
  context.stroke();

  context.fillStyle = "#525252";
  context.font = `400 16px ${SANS_FONT}`;
  context.fillText(
    `来源：${source} · ${formatUpdatedAt(updatedAt)}`,
    64,
    footerY + 34,
  );
  context.fillStyle = "#8a8a86";
  context.font = `500 16px ${MONO_FONT}`;
  context.textAlign = "right";
  context.fillText("LLM 模型对比", 1016, footerY + 34);
  context.textAlign = "left";
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function fileName(title: string, dimensionLabel: string, updatedAt: string) {
  const date = updatedAt.slice(0, 10).replace(/[^0-9-]/g, "");
  const safeTitle = title.replace(/[^\w\u4e00-\u9fff-]+/g, "-");
  const dimension = dimensionLabel.replace(/[^\w\u4e00-\u9fff-]+/g, "-");
  return `llm-${[safeTitle, dimension, date].filter(Boolean).join("-")}.png`;
}

export function RankingPosterExport({
  rows,
  title,
  scopeLabel,
  dimensionLabel,
  updatedAt,
  source,
  description = "一张适合分享的榜单图片。",
}: RankingPosterExportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;

    const canvas = canvasRef.current;
    if (canvas) {
      drawPoster(canvas, {
        rows,
        title,
        scopeLabel,
        dimensionLabel,
        updatedAt,
        source,
      });
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
  }, [dimensionLabel, open, rows, scopeLabel, source, title, updatedAt]);

  async function downloadPoster() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    if (!blob) {
      setStatus("图片生成失败，请重试");
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName(title, dimensionLabel, updatedAt);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("已下载 PNG 图片");
  }

  async function copyPoster() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      setStatus("当前浏览器不支持复制图片，请下载 PNG");
      return;
    }
    const blob = await canvasToBlob(canvas);
    if (!blob) {
      setStatus("图片生成失败，请重试");
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
        className="poster-export-button"
        onClick={() => {
          setStatus("");
          setOpen(true);
        }}
        disabled={rows.length === 0}
      >
        <span>导出海报</span>
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
            aria-labelledby="ranking-poster-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="ranking-poster-dialog-header">
              <div>
                <p className="ranking-poster-eyebrow">PNG EXPORT</p>
                <h2 id="ranking-poster-dialog-title">导出{title}</h2>
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
                <canvas
                  ref={canvasRef}
                  aria-label={`${scopeLabel} ${dimensionLabel}${title}海报预览`}
                />
              </div>
              <div className="ranking-poster-actions">
                <p className="ranking-poster-description">{description}</p>
                <p className="ranking-poster-description ranking-poster-description-muted">
                  适合手机查看，也可以直接粘贴到社交平台。
                </p>
                <div className="ranking-poster-buttons">
                  <button
                    type="button"
                    className="poster-download-button"
                    onClick={downloadPoster}
                  >
                    下载 PNG
                  </button>
                  <button
                    type="button"
                    className="poster-copy-button"
                    onClick={copyPoster}
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
