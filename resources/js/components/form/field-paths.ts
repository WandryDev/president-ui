function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.getPrototypeOf(value) === Object.prototype
    );
}

/**
 * Flattens the form's default values into the set of paths a field may bind to.
 * Arrays contribute only their own key, since their indices are not known upfront.
 */
export function collectFieldPaths(
    values: unknown,
    prefix = '',
    paths = new Set<string>(),
): Set<string> {
    if (!isPlainObject(values)) {
        return paths;
    }

    for (const [key, value] of Object.entries(values)) {
        const path = prefix ? `${prefix}.${key}` : key;

        paths.add(path);
        collectFieldPaths(value, path, paths);
    }

    return paths;
}

/** Paths that walk into an array are accepted whenever their root key exists. */
export function isKnownFieldPath(paths: Set<string>, name: string): boolean {
    if (paths.has(name)) {
        return true;
    }

    if (/\.\d+(\.|$)/.test(name)) {
        return paths.has(name.split('.')[0]);
    }

    return false;
}
