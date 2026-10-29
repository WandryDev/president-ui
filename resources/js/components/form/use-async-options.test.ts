import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsyncOptions } from './use-async-options';

describe('useAsyncOptions', () => {
    it('searches nothing while disabled', async () => {
        const search = vi.fn(() => Promise.resolve(['Одеса']));
        const { result, rerender } = renderHook(
            ({ enabled }) =>
                useAsyncOptions({ debounceMs: 0, enabled, search }),
            { initialProps: { enabled: false } },
        );

        act(() => result.current.setQuery('Од'));

        expect(search).not.toHaveBeenCalled();

        rerender({ enabled: true });

        await waitFor(() => expect(result.current.options).toEqual(['Одеса']));
        expect(result.current.status).toBe('success');
    });

    it('drops the options of another scope and searches again', async () => {
        const search = vi.fn((query: string) =>
            Promise.resolve([`${query} в ${search.mock.calls.length}`]),
        );
        const { result, rerender } = renderHook(
            ({ scope }) => useAsyncOptions({ debounceMs: 0, scope, search }),
            { initialProps: { scope: 'odesa' } },
        );

        act(() => result.current.setQuery('Дер'));

        await waitFor(() => expect(result.current.options).toHaveLength(1));

        rerender({ scope: 'kyiv' });

        expect(result.current.options).toEqual([]);
        await waitFor(() => expect(search).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(result.current.options).toHaveLength(1));
    });
});
