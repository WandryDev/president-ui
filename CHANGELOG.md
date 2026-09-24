# Changelog

Apps pin a tag (`#vX.Y.Z`) in `scripts/ui-sync.sh`. Every release lists what changed per item; anything that breaks an existing call site goes under **Breaking**.

## Unreleased

Initial extraction from `president-saas-platform`.

- 75 `ui` primitives from `@coss`, one item each. `ui/form.tsx` is published as `ui-form`.
- `form`, `data-table`, `alert-error`, `utils`, `segmented-control`, `use-media-query`, `test-utils`, `theme`, `font-sans`, `font-mono`, `all`.
- Fonts ship as `font-sans.css` / `font-mono.css`, imported by `theme.css`; `app.css` needs only `@import "./theme.css"`.
- `data-table`: `DataTableViewOptions` from `president-saas`, alongside the platform's filters, editable cells, `fill` and `footer`.

### Breaking

- `form`: `SwitchField` no longer takes `size` — `ui/switch` never supported it and the prop failed type-checking.
- `utils`: `lib/utils.ts` holds `cn()` only. Move `toUrl()` to the app's `lib/url.ts` before the first sync.
- `president-saas`: the sans typeface changes to Onest, the mono typeface to Geist Mono.
