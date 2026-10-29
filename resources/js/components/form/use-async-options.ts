import { useEffect, useEffectEvent, useState } from 'react';

export type AsyncOptionsSearch<TOption> = (
    query: string,
    options: { signal: AbortSignal },
) => Promise<TOption[]>;

export type UseAsyncOptionsOptions<TOption> = {
    /**
     * Fetches the options for a query. The signal aborts when a newer query
     * supersedes this one; pass it to `fetch` (or ignore it — a late answer
     * is dropped either way). Read on every call, so an inline function does
     * not restart the search.
     */
    search: AsyncOptionsSearch<TOption>;
    /** Wait after the last keystroke before searching. */
    debounceMs?: number;
    /** Shorter queries do not search; the options are cleared instead. */
    minQueryLength?: number;
    /** Searches for an empty query too: a short dictionary, not a catalogue of streets. */
    loadWithoutQuery?: boolean;
    /** Nothing is searched while false, e.g. while a popup is closed. The last options stay. */
    enabled?: boolean;
    /** Changing it drops the options and searches again, e.g. another city for its streets. */
    scope?: string | number | null;
};

export type AsyncOptionsStatus = 'idle' | 'loading' | 'success' | 'error';

export type AsyncOptions<TOption> = {
    options: TOption[];
    query: string;
    setQuery: (query: string) => void;
    /** `idle` while the query is too short to search. */
    status: AsyncOptionsStatus;
    isLoading: boolean;
    /** What the last search threw; `null` after a success. */
    error: unknown;
};

/**
 * Debounced options for a typed query. Only the latest query wins: the
 * previous request is aborted and its answer, if it still arrives, ignored.
 */
export function useAsyncOptions<TOption>({
    search,
    debounceMs = 300,
    minQueryLength = 1,
    loadWithoutQuery = false,
    enabled = true,
    scope = null,
}: UseAsyncOptionsOptions<TOption>): AsyncOptions<TOption> {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState<TOption[]>([]);
    const [status, setStatus] = useState<AsyncOptionsStatus>('idle');
    const [error, setError] = useState<unknown>(null);
    const [loadedScope, setLoadedScope] = useState(scope);
    const runSearch = useEffectEvent(
        (typed: string, signal: AbortSignal): Promise<TOption[]> =>
            search(typed, { signal }),
    );

    const trimmed = query.trim();
    const isSearchable =
        trimmed === ''
            ? loadWithoutQuery
            : trimmed.length >= Math.max(minQueryLength, 1);

    // Options of another scope would offer a street of another city.
    if (loadedScope !== scope) {
        setLoadedScope(scope);
        setOptions([]);
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: a new scope searches again; runSearch is an effect event
    useEffect(() => {
        if (!enabled) {
            setStatus((current) => (current === 'loading' ? 'idle' : current));

            return;
        }

        if (!isSearchable) {
            setOptions([]);
            setStatus('idle');
            setError(null);

            return;
        }

        const controller = new AbortController();

        setStatus('loading');

        const timer = setTimeout(
            () => {
                runSearch(trimmed, controller.signal).then(
                    (found) => {
                        if (!controller.signal.aborted) {
                            setOptions(found);
                            setError(null);
                            setStatus('success');
                        }
                    },
                    (reason: unknown) => {
                        if (!controller.signal.aborted) {
                            setError(reason);
                            setStatus('error');
                        }
                    },
                );
            },
            trimmed === '' ? 0 : debounceMs,
        );

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [enabled, isSearchable, trimmed, debounceMs, scope]);

    return {
        error,
        isLoading: status === 'loading',
        options,
        query,
        setQuery,
        status,
    };
}
