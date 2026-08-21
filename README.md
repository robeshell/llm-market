# llm-market

大模型 **价格** 与 **跑分排行** 对照站：数据来自 [Artificial Analysis](https://artificialanalysis.ai/)，静态站点可部署到 GitHub Pages，并用 Actions 定时刷新。

- 价格：有跑分且有标价的模型，默认按综合分排序，支持 USD / CNY（¥）展示与列排序  
- 排行：Intelligence Index 及 Coding / Agentic / GPQA / HLE / SciCode / Terminal / LCR（含指标说明）

## 本地运行

```bash
npm install
npm run fetch      # 抓取最新价格与排行 → data/*.json
npm run dev        # http://localhost:3000
```

| 命令 | 说明 |
|------|------|
| `npm run fetch` | 同时更新价格 + 排行 |
| `npm run fetch:prices` | 仅价格 |
| `npm run fetch:rankings` | 仅排行 |
| `npm run build` | 静态导出到 `out/`（GitHub Pages 同配置） |

## 数据说明

| 页面 | 来源 | 内容 |
|------|------|------|
| `/prices` | Artificial Analysis | 输入/输出 `$/M tokens`、综合分、上下文 |
| `/rankings` | Artificial Analysis | 综合与各项基准跑分 |

厂商 logo 使用 AA 公开资源：`https://artificialanalysis.ai/img/logos/...`

快照文件：`data/prices.json`、`data/rankings.json`（构建时打进静态页）。

## GitHub Pages

仓库已配置：

1. **Deploy GitHub Pages**（`.github/workflows/pages.yml`）  
   - 触发：推送到 `main`，或手动 Run workflow  
   - 构建静态站并部署到 GitHub Pages  

2. **Refresh market data**（`.github/workflows/refresh-data.yml`）  
   - 触发：每天 UTC `00:00` / `12:00`（北京时间约 **08:00 / 20:00**），或手动  
   - 执行 `npm run fetch`，若 `data/` 有变更则 commit 并 push  
   - push 后会自动触发上面的 Pages 部署  

首次发布后请在仓库打开：

**Settings → Pages → Build and deployment → Source: GitHub Actions**

站点地址一般为：

`https://<用户名>.github.io/llm-market/`

（本地开发不要设 `PAGES_BASE_PATH`；Actions 构建时会自动设为 `/仓库名`。）

## 定时更新怎么做？

已经用 GitHub Actions 的 `schedule` 做了定时，无需额外服务器：

```yaml
# .github/workflows/refresh-data.yml
on:
  schedule:
    - cron: "0 0,12 * * *"   # 每天两次（UTC）
  workflow_dispatch:         # 也可在 Actions 页手动点一次
```

想改频率，编辑该 cron 即可，例如每 6 小时：

```yaml
- cron: "0 */6 * * *"
```

注意：

- 免费仓库的 schedule 可能有延迟，属 GitHub 正常行为  
- Actions 必须保持启用；长期无仓库活动时，schedule 有时会被暂停，偶尔手动 Run 一下即可  
- 抓取依赖外网访问 Artificial Analysis；若某次失败，可看 Actions 日志并手动重跑  

本机也可用 cron（可选）：

```bash
0 */6 * * * cd /path/to/llm-market && npm run fetch && git add data && git commit -m "chore: refresh data" && git push
```

## 技术栈

- Next.js（`output: "export"` 静态导出）+ React + TypeScript + Tailwind CSS 4  
- 抓取脚本：Node 原生 `fetch`（`scripts/`）

## 许可

按需自行补充 License。数据版权归各数据源与模型厂商，本站仅作聚合展示。
