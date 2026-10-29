import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { AsyncComboboxField } from './async-combobox-field';
import type { ComboboxFieldOption } from './combobox-field';

const streets: ComboboxFieldOption[] = [
    { value: 's1', label: 'Дерибасовская' },
    { value: 's2', label: 'Греческая' },
    { value: 's3', label: 'Гагарина' },
];

function searchStreets(query: string): Promise<ComboboxFieldOption[]> {
    return Promise.resolve(
        streets.filter((street) =>
            street.label.toLowerCase().startsWith(query.toLowerCase()),
        ),
    );
}

const single = z.object({ street: z.string() });
const many = z.object({ streets: z.array(z.string()) });

describe('AsyncComboboxField', () => {
    it('offers what search returns for the typed query', async () => {
        const search = vi.fn(searchStreets);
        const { user } = renderForm({
            schema: single,
            defaultValues: { street: '' },
            children: (
                <AsyncComboboxField
                    debounceMs={0}
                    label="Улица"
                    name="street"
                    search={search}
                />
            ),
        });

        await user.type(screen.getByRole('combobox', { name: 'Улица' }), 'Гр');

        expect(
            await screen.findByRole('option', { name: 'Греческая' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Гагарина' })).toBeNull();
        expect(search).toHaveBeenLastCalledWith('Гр', {
            signal: expect.any(AbortSignal),
        });
    });

    it('sends the picked value and keeps its label once the search moves on', async () => {
        const { user } = renderForm({
            schema: many,
            defaultValues: { streets: [] },
            children: (
                <AsyncComboboxField
                    debounceMs={0}
                    label="Улицы"
                    multiple
                    name="streets"
                    search={searchStreets}
                />
            ),
        });

        await user.type(screen.getByLabelText('Улицы'), 'Де');
        await user.click(
            await screen.findByRole('option', { name: 'Дерибасовская' }),
        );
        await user.type(screen.getByLabelText('Улицы'), 'Гр');
        await user.click(
            await screen.findByRole('option', { name: 'Греческая' }),
        );
        // Escape on a closed multiple combobox clears it; a click outside only closes.
        await user.click(document.body);

        expect(
            screen.getByRole('button', { name: 'Убрать «Дерибасовская»' }),
        ).toBeInTheDocument();

        await submitForm(user);

        expect(submittedData()).toEqual({ streets: ['s1', 's2'] });
    });

    it('waits for minQueryLength and says so', async () => {
        const search = vi.fn(searchStreets);
        const { user } = renderForm({
            schema: single,
            defaultValues: { street: '' },
            children: (
                <AsyncComboboxField
                    debounceMs={0}
                    idleText="Введите хотя бы 3 буквы"
                    label="Улица"
                    minQueryLength={3}
                    name="street"
                    search={search}
                />
            ),
        });

        await user.type(screen.getByRole('combobox', { name: 'Улица' }), 'Гр');

        expect(
            await screen.findByText('Введите хотя бы 3 буквы'),
        ).toBeInTheDocument();
        expect(search).not.toHaveBeenCalled();

        await user.type(screen.getByRole('combobox', { name: 'Улица' }), 'е');

        expect(
            await screen.findByRole('option', { name: 'Греческая' }),
        ).toBeInTheDocument();
    });

    it('lists options on open when loadWithoutQuery is set', async () => {
        const search = vi.fn(searchStreets);
        const { user } = renderForm({
            schema: single,
            defaultValues: { street: '' },
            children: (
                <AsyncComboboxField
                    label="Улица"
                    loadWithoutQuery
                    name="street"
                    search={search}
                />
            ),
        });

        expect(search).not.toHaveBeenCalled();

        await user.click(screen.getByRole('combobox', { name: 'Улица' }));

        expect(
            await screen.findByRole('option', { name: 'Гагарина' }),
        ).toBeInTheDocument();
        expect(search).toHaveBeenCalledWith('', {
            signal: expect.any(AbortSignal),
        });
    });

    it('labels a value chosen before any search with selectedOptions', () => {
        renderForm({
            schema: single,
            defaultValues: { street: 's9' },
            children: (
                <AsyncComboboxField
                    label="Улица"
                    name="street"
                    search={searchStreets}
                    selectedOptions={[{ value: 's9', label: 'Пушкинская' }]}
                />
            ),
        });

        expect(screen.getByRole('combobox', { name: 'Улица' })).toHaveValue(
            'Пушкинская',
        );
    });

    it('shows the error text when the search fails', async () => {
        const { user } = renderForm({
            schema: single,
            defaultValues: { street: '' },
            children: (
                <AsyncComboboxField
                    debounceMs={0}
                    label="Улица"
                    name="street"
                    search={() => Promise.reject(new Error('offline'))}
                />
            ),
        });

        await user.type(screen.getByRole('combobox', { name: 'Улица' }), 'Гр');

        expect(
            await screen.findByText('Не удалось загрузить варианты'),
        ).toBeInTheDocument();
    });

    it('lets the latest query win and aborts the one it supersedes', async () => {
        const pending = new Map<
            string,
            {
                resolve: (options: ComboboxFieldOption[]) => void;
                signal: AbortSignal;
            }
        >();
        const search = (
            query: string,
            { signal }: { signal: AbortSignal },
        ): Promise<ComboboxFieldOption[]> =>
            new Promise((resolve) => {
                pending.set(query, { resolve, signal });
            });

        const { user } = renderForm({
            schema: single,
            defaultValues: { street: '' },
            children: (
                <AsyncComboboxField
                    debounceMs={0}
                    label="Улица"
                    name="street"
                    search={search}
                />
            ),
        });

        await user.type(screen.getByRole('combobox', { name: 'Улица' }), 'Г');
        await waitFor(() => expect(pending.has('Г')).toBe(true));
        await user.type(screen.getByRole('combobox', { name: 'Улица' }), 'р');
        await waitFor(() => expect(pending.has('Гр')).toBe(true));

        expect(pending.get('Г')?.signal.aborted).toBe(true);

        await act(async () => {
            pending.get('Гр')?.resolve([streets[1]]);
        });
        await act(async () => {
            pending.get('Г')?.resolve([streets[2]]);
        });

        expect(
            await screen.findByRole('option', { name: 'Греческая' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Гагарина' })).toBeNull();
    });

    it('debounces the search', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        try {
            const search = vi.fn(searchStreets);
            const { user } = renderForm({
                schema: single,
                defaultValues: { street: '' },
                children: (
                    <AsyncComboboxField
                        debounceMs={500}
                        label="Улица"
                        name="street"
                        search={search}
                    />
                ),
            });

            await user.type(
                screen.getByRole('combobox', { name: 'Улица' }),
                'Гре',
            );

            expect(search).not.toHaveBeenCalled();

            await act(async () => {
                vi.advanceTimersByTime(500);
            });

            expect(search).toHaveBeenCalledTimes(1);
            expect(search).toHaveBeenCalledWith('Гре', expect.anything());
        } finally {
            vi.useRealTimers();
        }
    });
});
