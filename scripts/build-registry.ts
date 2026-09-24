/**
 * Generates registry.json from the sources under resources/.
 *
 *   bun scripts/build-registry.ts              # write registry.json
 *   bun scripts/build-registry.ts --ref v1.2.3 # pin internal registryDependencies to a tag
 *   bun scripts/build-registry.ts --check      # fail if registry.json is stale
 *
 * The CLI resolves every registryDependency on its own: one without a ref
 * comes from the default branch, whatever tag its parent was installed from.
 * So a release pins them all with --ref, and later builds keep the ref already
 * committed until the next release replaces it.
 *
 * Items come from a fixed catalogue below. Dependencies are read from each
 * file's imports: bare specifiers become `dependencies`, `@/…` specifiers that
 * land in another item become `registryDependencies`. An `@/…` import that no
 * item owns fails the build — that is how leaks into app code are caught — and
 * so does a source file that no item ships. Dependencies carry the version
 * range from package.json, so a sync never drifts an app onto another major.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const REGISTRY = 'WandryDev/president-ui';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JS = 'resources/js';

/** Provided by every consumer; never listed as item dependencies. */
const IMPLICIT_PACKAGES = new Set(['react', 'react-dom']);

/** Test tooling goes to devDependencies so it never lands in an app's runtime deps. */
const DEV_PACKAGES = new Set([
    'vitest',
    'jsdom',
    '@testing-library/react',
    '@testing-library/user-event',
    '@testing-library/jest-dom',
]);

/** ui primitives whose file name is taken by a bigger item. */
const UI_NAME_OVERRIDES: Record<string, string> = {
    form: 'ui-form',
};

const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '/index.ts', '/index.tsx'];

type FileType =
    | 'registry:ui'
    | 'registry:component'
    | 'registry:lib'
    | 'registry:hook'
    | 'registry:file';

type SourceItem = {
    name: string;
    type:
        | 'registry:ui'
        | 'registry:component'
        | 'registry:lib'
        | 'registry:hook'
        | 'registry:item';
    fileType: FileType;
    title: string;
    description: string;
    files: string[];
    /** Packages this item needs that imports cannot reveal. */
    extraDevDependencies?: string[];
};

type RegistryFile = {
    path: string;
    type: FileType;
    target: string;
};

type RegistryItem = {
    name: string;
    type: string;
    title: string;
    description: string;
    dependencies?: string[];
    devDependencies?: string[];
    registryDependencies?: string[];
    files?: RegistryFile[];
    [key: string]: unknown;
};

function fail(message: string): never {
    console.error(`registry:build — ${message}`);
    process.exit(1);
}

function isTest(file: string): boolean {
    return /\.(test|spec)\.tsx?$/.test(file) || file.includes('__tests__/');
}

function byName(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

function listSources(dir: string): string[] {
    return readdirSync(join(ROOT, dir))
        .filter((file) => /\.tsx?$/.test(file) && !isTest(file))
        .sort()
        .map((file) => `${dir}/${file}`);
}

function titleCase(name: string): string {
    return name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function sourceItems(): SourceItem[] {
    const ui = listSources(`${JS}/components/ui`).map((file): SourceItem => {
        const stem = basename(file).replace(/\.tsx?$/, '');

        return {
            name: UI_NAME_OVERRIDES[stem] ?? stem,
            type: 'registry:ui',
            fileType: 'registry:ui',
            title: titleCase(stem),
            description: `The ${titleCase(stem).toLowerCase()} primitive.`,
            files: [file],
        };
    });

    return [
        ...ui,
        {
            name: 'form',
            type: 'registry:component',
            fileType: 'registry:component',
            title: 'Form',
            description:
                'Inertia-aware form with react-hook-form, zod and typed fields.',
            files: listSources(`${JS}/components/form`),
        },
        {
            name: 'data-table',
            type: 'registry:component',
            fileType: 'registry:component',
            title: 'Data Table',
            description:
                'TanStack table with toolbar, search, filters, pagination and editable cells.',
            files: listSources(`${JS}/components/data-table`),
        },
        {
            name: 'alert-error',
            type: 'registry:component',
            fileType: 'registry:component',
            title: 'Alert Error',
            description: 'A destructive alert listing unique error messages.',
            files: [`${JS}/components/common/alert-error.tsx`],
        },
        {
            name: 'utils',
            type: 'registry:lib',
            // As `registry:lib`, the CLI never overwrites an existing
            // lib/utils.ts in a Laravel project, even with --overwrite.
            fileType: 'registry:file',
            title: 'Utils',
            description: 'The cn() class name helper.',
            files: [`${JS}/lib/utils.ts`],
        },
        {
            name: 'segmented-control',
            type: 'registry:lib',
            fileType: 'registry:lib',
            title: 'Segmented Control',
            description: 'Shared size variants for segmented controls.',
            files: [`${JS}/lib/segmented-control.ts`],
        },
        {
            name: 'use-media-query',
            type: 'registry:hook',
            fileType: 'registry:hook',
            title: 'Use Media Query',
            description: 'Subscribes to a media query or a named breakpoint.',
            files: [`${JS}/hooks/use-media-query.ts`],
        },
        {
            name: 'test-utils',
            type: 'registry:item',
            fileType: 'registry:file',
            title: 'Test Utils',
            description:
                'Vitest setup, the Inertia page stub and the form and table harnesses.',
            files: [
                `${JS}/test/setup.ts`,
                `${JS}/test/inertia-page.ts`,
                `${JS}/test/form-harness.tsx`,
                `${JS}/test/table-harness.tsx`,
            ],
            // vitest.config.ts names the environment; nothing imports it.
            extraDevDependencies: ['jsdom'],
        },
    ];
}

/** Items that have no source files of their own to scan. */
function staticItems(): RegistryItem[] {
    return [
        {
            name: 'theme',
            type: 'registry:item',
            title: 'Theme',
            description:
                'Design tokens, dark mode and base layer. Import it from app.css after tailwindcss.',
            dependencies: ['tw-animate-css', 'shadcn'],
            registryDependencies: ['font-sans', 'font-mono'],
            files: [cssFile('resources/css/theme.css')],
        },
        ...FONTS,
    ];
}

/**
 * Plain items rather than `registry:font`: outside Next the CLI writes the
 * font into app.css and applies every font variable to <html> at once, so the
 * last one listed wins. A stylesheet of our own, imported by theme.css, keeps
 * the font inside the registry.
 */
const FONTS: RegistryItem[] = [
    {
        name: 'font-sans',
        type: 'registry:item',
        title: 'Onest',
        description: 'Onest as the sans and heading typeface.',
        dependencies: ['@fontsource-variable/onest'],
        files: [cssFile('resources/css/font-sans.css')],
    },
    {
        name: 'font-mono',
        type: 'registry:item',
        title: 'Geist Mono',
        description: 'Geist Mono as the monospace typeface.',
        dependencies: ['@fontsource-variable/geist-mono'],
        files: [cssFile('resources/css/font-mono.css')],
    },
];

function cssFile(path: string): RegistryFile {
    return { path, type: 'registry:file', target: `~/${path}` };
}

/** Static, re-exported, side-effect and dynamic imports, as TypeScript sees them. */
function importsOf(file: string): string[] {
    const source = readFileSync(join(ROOT, file), 'utf8');

    return ts
        .preProcessFile(source, true, true)
        .importedFiles.map((imported) => imported.fileName);
}

const BUILTINS = new Set(builtinModules);

const MANIFEST = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const RANGES: Record<string, string> = {
    ...MANIFEST.devDependencies,
    ...MANIFEST.dependencies,
};

/** `name@range`, with the range this repository is tested against. */
function versioned(name: string): string {
    const range = RANGES[name];

    if (!range) {
        fail(`"${name}" is used by an item but missing from package.json`);
    }

    return `${name}@${range}`;
}

/** Every non-test source under resources/js, repo-relative. */
function allSources(dir = JS): string[] {
    return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap(
        (entry) => {
            const path = `${dir}/${entry.name}`;

            if (entry.isDirectory()) {
                return allSources(path);
            }

            return /\.tsx?$/.test(path) &&
                !path.endsWith('.d.ts') &&
                !isTest(path)
                ? [path]
                : [];
        },
    );
}

function packageName(specifier: string): string {
    const parts = specifier.split('/');

    return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

/** Resolves an `@/…` or relative specifier to a repo-relative source file. */
function resolveLocal(specifier: string, from: string): string | null {
    const base = specifier.startsWith('@/')
        ? join(JS, specifier.slice(2))
        : join(dirname(from), specifier);

    for (const extension of ['', ...RESOLVE_EXTENSIONS]) {
        const candidate = `${base}${extension}`;

        if (/\.tsx?$/.test(candidate) && existsSync(join(ROOT, candidate))) {
            return candidate;
        }
    }

    return null;
}

function address(name: string, ref: string | null): string {
    return `${REGISTRY}/${name}${ref ? `#${ref}` : ''}`;
}

function qualify(name: string, ref: string | null): string {
    return name.includes('/') ? name : address(name, ref);
}

function build(ref: string | null): RegistryItem[] {
    const sources = sourceItems();
    const owner = new Map<string, string>();

    for (const item of sources) {
        for (const file of item.files) {
            if (owner.has(file)) {
                fail(
                    `${file} belongs to both ${owner.get(file)} and ${item.name}`,
                );
            }
            owner.set(file, item.name);
        }
    }

    for (const file of allSources()) {
        if (!owner.has(file)) {
            fail(
                `${file} ships in no item; add it to the catalogue in scripts/build-registry.ts`,
            );
        }
    }

    const built = sources.map((item): RegistryItem => {
        const dependencies = new Set<string>();
        const devDependencies = new Set(item.extraDevDependencies);
        const registryDependencies = new Set<string>();

        for (const file of item.files) {
            for (const specifier of importsOf(file)) {
                if (specifier.startsWith('@/') || specifier.startsWith('.')) {
                    const target = resolveLocal(specifier, file);

                    if (!target || !owner.has(target)) {
                        fail(
                            `${file} imports "${specifier}", which no registry item owns`,
                        );
                    }

                    const dependency = owner.get(target) as string;

                    if (dependency !== item.name) {
                        if (specifier.startsWith('.')) {
                            fail(
                                `${file} reaches into ${dependency} with a relative import; use "@/…"`,
                            );
                        }
                        registryDependencies.add(dependency);
                    }
                    continue;
                }

                if (specifier.startsWith('node:') || BUILTINS.has(specifier)) {
                    continue;
                }

                const name = packageName(specifier);

                if (IMPLICIT_PACKAGES.has(name)) {
                    continue;
                }

                (DEV_PACKAGES.has(name) ? devDependencies : dependencies).add(
                    name,
                );
            }
        }

        return {
            name: item.name,
            type: item.type,
            title: item.title,
            description: item.description,
            ...(dependencies.size > 0 && {
                dependencies: [...dependencies].sort(byName),
            }),
            ...(devDependencies.size > 0 && {
                devDependencies: [...devDependencies].sort(byName),
            }),
            ...(registryDependencies.size > 0 && {
                registryDependencies: [...registryDependencies].sort(byName),
            }),
            files: item.files.map((path) => ({
                path,
                type: item.fileType,
                target: `~/${path}`,
            })),
        };
    });

    const items = [...built, ...staticItems()].sort((a, b) =>
        byName(a.name, b.name),
    );

    const all: RegistryItem = {
        name: 'all',
        type: 'registry:item',
        title: 'All',
        description:
            'Every item except test-utils. One command to sync an app with the registry.',
        registryDependencies: items
            .map((item) => item.name)
            .filter((name) => name !== 'test-utils'),
    };

    const names = [...items, all].map((item) => item.name).sort(byName);

    for (const [index, name] of names.entries()) {
        if (names[index + 1] === name) {
            fail(`two items are named "${name}"`);
        }
    }

    return [...items, all].map((item) => ({
        ...item,
        ...(item.dependencies && {
            dependencies: item.dependencies.map(versioned),
        }),
        ...(item.devDependencies && {
            devDependencies: item.devDependencies.map(versioned),
        }),
        ...(item.registryDependencies && {
            registryDependencies: item.registryDependencies.map((name) =>
                qualify(name, ref),
            ),
        }),
    }));
}

const OUTPUT = join(ROOT, 'registry.json');

/** The tag the committed registry.json pins its dependencies to, if any. */
function committedRef(): string | null {
    if (!existsSync(OUTPUT)) {
        return null;
    }

    const match = readFileSync(OUTPUT, 'utf8').match(
        new RegExp(`"${REGISTRY}/[^"#]+#([^"]+)"`),
    );

    return match ? match[1] : null;
}

function parseRef(argv: string[]): string | null {
    const index = argv.indexOf('--ref');

    if (index === -1) {
        return committedRef();
    }

    const ref = argv[index + 1];

    if (!ref || !/^v\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(ref)) {
        fail('--ref expects a semver tag like v1.2.3');
    }

    return ref;
}

const argv = process.argv.slice(2);
const ref = parseRef(argv);

const registry = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'president-ui',
    homepage: `https://github.com/${REGISTRY}`,
    items: build(ref),
};

const output = `${JSON.stringify(registry, null, 4)}\n`;
const summary = `${registry.items.length} items${ref ? `, pinned to ${ref}` : ''}`;

if (argv.includes('--check')) {
    if (!existsSync(OUTPUT) || readFileSync(OUTPUT, 'utf8') !== output) {
        fail(
            'registry.json is stale; run `bun run registry:build` and commit it',
        );
    }

    console.log(`registry.json is up to date — ${summary}`);
} else {
    writeFileSync(OUTPUT, output);
    console.log(`registry.json — ${summary}`);
}
