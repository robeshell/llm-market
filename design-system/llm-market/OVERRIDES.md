# Design System Overrides (project)

> Applied on top of generated MASTER.md for llm-market constraints.

## Direction

- **Style:** Minimalism & Swiss (from ui-ux-pro-max)
- **Variance / Motion / Density:** 3 / 3 / 7
- **User constraints:** no colored page backgrounds, no icons, no marketing copy

## Palette (override — Architecture / Interior neutral)

| Role | Hex | Token |
|------|-----|-------|
| Background | `#FFFFFF` | `--color-background` |
| Foreground | `#171717` | `--color-foreground` |
| Muted | `#F5F5F5` | `--color-muted` |
| Muted Foreground | `#737373` | `--color-muted-foreground` |
| Border | `#E5E5E5` | `--color-border` |
| Primary | `#171717` | `--color-primary` |
| Ring | `#171717` | `--color-ring` |

Do **not** use the generated purple (`#7C3AED` / `#FAF5FF`) palette.

## Typography (override)

- UI: **IBM Plex Sans** (via `next/font`)
- Numbers: **IBM Plex Mono**
- Avoid Inter / system defaults as primary brand face

## Layout

- Max width `72rem` (6xl)
- Sticky table header on white
- Row hover `150–200ms`
- Horizontal scroll wrapper for tables
- Visible focus rings on links/inputs
