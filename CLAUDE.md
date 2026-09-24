# president-ui

Shared UI for `president-saas` and `president-saas-platform`, distributed as a [shadcn registry](https://ui.shadcn.com/docs/registry) served from this repository's tags. Apps register it as `@president` in `components.json` and sync with `bun run ui:sync`.

## Ground rules

- This repository is the only source of truth. In the apps, `components/{ui,form,data-table}`, `resources/css/{theme,font-sans,font-mono}.css`, `lib/utils.ts`, `lib/segmented-control.ts`, `hooks/use-media-query.ts` and `test/{setup,inertia-page,form-harness,table-harness}` are mirrors and are never edited there. An app that needs different behaviour gets a new prop or a new item here.
- The layout mirrors the Laravel apps (`resources/js`, alias `@/*` → `resources/js/*`), so a file's `path` equals its `target` and imports need no rewriting.
- Code here must not import app code (`@/types`, `@/routes`, `@/actions`, `@/pages`, …). `registry:build` fails on any `@/…` import that no item owns.
- `components/ui`, `hooks/use-media-query.ts` and `lib/segmented-control.ts` come from `@coss` and keep its formatting; biome skips them. Everything else follows `biome.json`, which matches the apps.
- `lib/utils.ts` holds `cn()` only. Anything app-specific (`toUrl()` and friends) lives in the app.
- Primitive tests live and run here only. Apps receive `test-utils`, not the tests.

## Items

`registry.json` and `public/r/*.json` are generated — never edit them by hand. Run `bun run registry:build` after changing any shipped file and commit the result; CI fails when either is stale. `public/r` is what apps download: one JSON per item with the file contents inlined, built by `shadcn build` from `registry.json`.

- `components/ui/<name>.tsx` → item `<name>` (`registry:ui`). `ui/form.tsx` is published as `ui-form`, because `form` is the form module.
- `components/form/*` → `form`, `components/data-table/*` → `data-table`. One item each; their `index.ts` re-exports everything. `*.test.tsx` files are left out.
- `common/alert-error.tsx` → `alert-error`, `lib/utils.ts` → `utils`, `lib/segmented-control.ts` → `segmented-control`, `hooks/use-media-query.ts` → `use-media-query`.
- `test/{setup,inertia-page,form-harness,table-harness}` → `test-utils`.
- `theme` (`resources/css/theme.css`), `font-sans` (`font-sans.css`, Onest) and `font-mono` (`font-mono.css`, Geist Mono) are declared statically in `scripts/build-registry.ts`. `theme.css` imports both font files. They are plain items, not `registry:font`: outside Next the CLI writes fonts into `app.css` and applies every font variable to `<html>` at once.
- Every file has an explicit `target: "~/<path>"`. `utils` ships as `registry:file`, because the CLI never overwrites an existing `lib/utils.ts` of type `registry:lib` in a Laravel project, even with `--overwrite`.
- `all` depends on every item except `test-utils`.

`dependencies` come from bare imports (`react` and `react-dom` excluded, subpaths collapsed to the package) and carry the range from `package.json`; test tooling (vitest, jsdom, Testing Library) goes to `devDependencies`. `registryDependencies` come from `@/…` imports that land in another item and are written as `@president/<name>`, so the CLI fetches them through the app's namespace — from the same tag as the item that needs them. The build fails on a package missing from `package.json` and on a source file no item ships — a new top-level file needs a catalogue entry in `scripts/build-registry.ts`.

## Installing in an app

An app declares the registry once, pinned to a tag, in `components.json`:

```json
"registries": {
    "@president": "https://raw.githubusercontent.com/WandryDev/president-ui/vX.Y.Z/public/r/{name}.json"
}
```

and syncs with a `package.json` script:

```json
"ui:sync": "bunx --bun shadcn@4.21.0 add @president/all @president/test-utils --overwrite --yes"
```

The tag in that URL is the only place an app records its version. The repository must stay public: raw.githubusercontent.com serves it without a token.

The CLI rewrites code on install, so two rules keep the app mirror byte-identical to this repository:

- Import another item through the file that declares the symbol, never through a directory `index`. The CLI re-resolves imports against the files it wrote and prefers `<dir>.tsx` over `<dir>/index.ts`, so `@/components/form` would become `@/components/form/form`. `registry:build` rejects such imports.
- Write the directive as `"use client";`. Without the semicolon the CLI strips it (`rsc: false`).

## Verification

```sh
bun run lint:check    # biome ci
bun run types:check   # tsc --noEmit
bun run test          # vitest run
bun run registry:check
```

## Releases

Semver tags. Apps move to a release by changing the tag in their `@president` URL and running `ui:sync`.

1. Move "Unreleased" in `CHANGELOG.md` under the new version; API breaks go under "Breaking".
2. `bun run registry:check` — `registry.json` and `public/r` must be committed and fresh.
3. `git tag -a vX.Y.Z -m vX.Y.Z && git push origin main vX.Y.Z`. On a tag, CI checks that raw.githubusercontent.com serves `public/r` for it.

# Forms

_These rules cover both sides: how the apps build forms with this module, and how the module itself is extended here._

Forms are built on React Hook Form + zod. All form primitives live in `resources/js/components/form` and are exported by name through its `index.ts`.

## Building a form

- Never use Inertia's `<Form>` for a form that has inputs. Use `useInertiaForm` + `<Form>` from `@/components/form`. Inertia's `<Form>` is only acceptable for field-less action buttons (resend email, regenerate codes).
- `useInertiaForm` owns submission: it wires `zodResolver`, wraps `router.visit` in a promise so `formState.isSubmitting` stays accurate for the whole request, maps 422 responses into `setError`, flattens named error bags, routes error keys that match no field into `root`, and focuses the first rejected field. Never hand-roll that focus in a page — `setFocus` does not reach a Controller's ref after `setError`.
- Give every submit button an explicit `type="submit"`. The Base UI `Button` renders `type="button"` by default, so a button without it silently does nothing inside a form.
- Every form is its own component named `<Verb><Noun>Form` (`CreateWorkspaceForm`, `UpdatePasswordForm`) in the module folder it belongs to (`components/auth`, `components/settings`, `components/workspace`). The form owns its action, defaults, schema and submit button, accepts `className` and merges it with `cn()`. A page composes forms and never renders `<Form>` itself.
- Put the zod schema next to the form component, as `<verb>-<noun>.schema.ts`. Duplicate the server rules from `app/Concerns/*ValidationRules.php`. Three things stay server-only and must not be reimplemented: `unique`, `current_password`, and password strength — `AppServiceProvider` configures `Password::defaults()` per environment, so any strength rule on the client would reject passwords the server accepts locally. Client-side password checks are limited to presence and a matching confirmation, via `components/auth/password-rules.ts`.
- Defaults are set inside `useInertiaForm` — `mode: 'onTouched'`, `reValidateMode: 'onChange'`. Do not override them per form without a reason.
- `<Form>` creates the form itself. Pass `form={useInertiaForm(...)}` instead when the page needs `watch`, `setValue` or `resetField` outside the markup, as `two-factor-challenge` and `two-factor-setup-modal` do.

## Adding a new field component

Every field component wraps `FormField` and renders nothing but its own control. `FormField` owns the `Field` / `FieldLabel` / `FieldDescription` / `FieldError` chrome, generates the `id`, and passes `aria-invalid`, `aria-describedby` and `aria-label` down. A field component that renders its own label, error, or aria wiring is wrong — the accessibility contract belongs to `FormField` alone.

Two escape hatches exist for the label, both owned by `FormField`: `labelAction` renders a node on the label's row but outside the `<label>` element, for a link like "Forgot your password?" that may not be nested inside a label; `aria-label` names the control when the page already shows the label as a heading.

```tsx
export function TextField({ ...props }: TextFieldProps) {
    return (
        <FormField {...props}>
            {({ field, ...aria }) => <Input {...field} {...aria} />}
        </FormField>
    );
}
```

- Compose shadcn primitives from `@/components/ui`. Use `InputGroup` when the control needs an addon or an inline button, as `PasswordField` does for its visibility toggle.
- Fields that offer a choice (`SelectField`, `RadioGroupField`) take an `options` prop of `{ value, label, disabled? }`. Accept `children` as an escape hatch for groups, icons, or custom rows, and render them instead of `options` when present.
- Store a serialisable primitive in form state, never a rich object. `DateField` holds a `'yyyy-MM-dd'` string and converts to `Date` only inside `Calendar`, so the browser timezone cannot shift the value on the way to Laravel.
- `name` is typed as `string`. `FormField` validates it against the schema in dev and throws a named error listing the available paths.
- Export by name and add it to `index.ts`.

## Testing

- Every field component needs a test covering that it renders and that its value reaches the submitted payload.
- Every page with a form needs a form-level test in the page folder with a mocked `router`: the expected fields are present, submit sends the right URL and payload, and a 422 response renders the errors.
- Run with `bun run test`.

# Data tables

_These rules cover both sides: how the apps build tables with this module, and how the module itself is extended here._

Tables are built on TanStack Table v8. All primitives live in `resources/js/components/data-table` and are exported by name through its `index.ts`. A feature table supplies its column definitions and its data; the chrome comes from here.

## Building a table

- Render `<DataTable data={rows} columns={columns} />`. Pass `table={useDataTable(...)}` instead when the page needs the instance outside the markup — a search box, a bulk-action bar, the column menu — the same way `<Form>` accepts a `form`.
- `useDataTable` owns the row models: it attaches the sorted, filtered and paginated models, and leaves each one out when the matching `manualSorting` / `manualFiltering` / `manualPagination` option says the server already did that work. Every other TanStack option passes through, so a slice of state can be controlled — a page index kept in the URL — with `state` plus the matching `on*Change`.
- Server-driven tables must pass `rowCount`. Without it only the rows of the current page can be counted and the footer reports a single page. Pass `pageCount: -1` when the total is genuinely unknown; the jump-to-edge buttons are then dropped.
- Pass `getRowId` whenever rows are selectable. Selection is stored by row id, and the default id is the row's index, which shifts as soon as the data is sorted or reloaded.

## Writing column definitions

Column definitions stay plain: `{ accessorKey, header }`, plus a `cell` when the value needs rendering. The chrome around them belongs to `DataTable` alone.

- Do not put a sort button in a `header`. `DataTable` wraps every sortable column in `DataTableColumnHeader` and owns the `aria-sort` on the header cell. A column that renders its own header control must set `enableSorting: false` so buttons are not nested.
- Alignment, extra classes and the name shown in the column menu travel in `meta`: `{ align, headerClassName, cellClassName, label }`. `meta.label` is only needed when `header` is not a plain string.
- `selectionColumn()` builds the leading checkbox column. Rows keep working as click targets next to it: `onRowClick` ignores any click that started on a control (`a`, `button`, `input`, `[role="checkbox"]`, …), so a checkbox or a row action never opens the row as well.
- `size` is the only way a column gets a fixed width; a column without it is left to the browser.

## Testing

- Every table primitive needs a test covering that it renders and that the interaction it exists for reaches the table state.
- Use the helpers in `@/test/table-harness`: `renderDataTable` for the table itself, `renderWithTable` when the test needs the instance, and `headerTexts` / `rowTexts` / `columnTexts` to read what is on screen.
- Run with `bun run test`.
