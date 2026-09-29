# Changelog

Apps pin a tag in the `@president` URL of their `components.json`. Every release lists what changed per item; anything that breaks an existing call site goes under **Breaking**.

## v0.0.9

- `data-table`: `DataTableMiddleTruncate` takes `fill`, as `DataTable` does. The table then fills its parent's height, the rows scroll inside it under a sticky header, and the page controls stay below.

## v0.0.8

- `data-table`: `DataTableMiddleTruncate` renders the header row above the columns only while the middle is shown. Folded, that row was empty — the rail is the control.

## v0.0.7

- `data-table`: `DataTableMiddleTruncate` paints its header cells opaque. `--secondary` is translucent, so the pinned start and end headers showed the scrolled middle headers through them.

## v0.0.6

- `data-table`: `DataTableMiddleTruncate`, a table whose middle folds away. Columns pinned left and right (`columnPinning`) stay on screen as the start and the end; the columns between them scroll, and a control in the header row hides them into a narrow rail and brings them back. Controlled with `expanded` / `onExpandedChange` or left to `defaultExpanded`; labels and the rail width are props.

## v0.0.5

- `editor-static`: `EditorStatic`, the read-only renderer for editor documents, with `BaseEditorKit`, `EditorValue`, `EMPTY_EDITOR_VALUE`, `isEditorValueEmpty` and the URL checks `isAllowedLinkUrl` / `isAllowedImageUrl`. Needs no `ui` primitives. Not part of `all`.
- `editor`: `Editor` and `EditorField` on Plate 53 without AI, comments, suggestions, mentions or font controls — H2–H4, marks, links, lists and to-dos, quotes, callouts, code blocks, dividers, tables and images, with a fixed toolbar, a floating toolbar, a `/` menu, markdown shortcuts and drag handles. Images go in by URL, or through `uploadImage` (with `onUploadError`) when the app passes one. Links and images outside `http`/`https` (`mailto` for links) are refused and stripped from pasted or stored content. Not part of `all`; add `@president/editor` to `ui:sync`.
- `form`: `MediaField` takes saved images as URL strings next to `File`s (`(File | string)[]`), previews them and removes them like files. A file outside `accept` is now rejected, not only a non-image. `aria-label` now reaches the file input.
- `test-utils`: `setup.ts` stubs `Range.getBoundingClientRect` and `Range.getClientRects`.

## v0.0.4

- `plan-card`: `PlanCard`, extracted from the plan tiers of `president-saas` with the tier data turned into props (`name`, `tagline`, `price`, `period`, `features`), so the platform's plan catalogue and the workspace billing page render the same card.

## v0.0.3

### Breaking

- Install through the `@president` namespace (`registries` in `components.json`, pointing at `public/r` of a tag) instead of `WandryDev/president-ui/<item>#vX.Y.Z`. `registryDependencies` are `@president/<name>` and follow the tag of the namespace URL.

## v0.0.2

Initial extraction from `president-saas-platform`.

- 75 `ui` primitives from `@coss`, one item each. `ui/form.tsx` is published as `ui-form`.
- `form`, `data-table`, `alert-error`, `utils`, `segmented-control`, `use-media-query`, `test-utils`, `theme`, `font-sans`, `font-mono`, `all`.
- Fonts ship as `font-sans.css` / `font-mono.css`, imported by `theme.css`; `app.css` needs only `@import "./theme.css"`.
- `data-table`: `DataTableViewOptions` from `president-saas`, alongside the platform's filters, editable cells, `fill` and `footer`.

### Breaking

- `form`: `SwitchField` no longer takes `size` — `ui/switch` never supported it and the prop failed type-checking.
- `utils`: `lib/utils.ts` holds `cn()` only. Move `toUrl()` to the app's `lib/url.ts` before the first sync.
- `president-saas`: the sans typeface changes to Onest, the mono typeface to Geist Mono.
