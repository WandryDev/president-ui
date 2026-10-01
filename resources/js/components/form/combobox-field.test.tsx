import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { ComboboxField } from './combobox-field';

const options = [
    { value: 'primorsky', label: 'Приморський' },
    { value: 'kyivsky', label: 'Київський' },
    { value: 'peresypsky', label: 'Пересипський', description: 'Одеса' },
];

const single = z.object({ district: z.string() });
const many = z.object({ districts: z.array(z.string()) });

describe('ComboboxField', () => {
    it('narrows the options by the typed query', async () => {
        const { user } = renderForm({
            schema: single,
            defaultValues: { district: '' },
            children: (
                <ComboboxField
                    label="Район"
                    name="district"
                    options={options}
                />
            ),
        });

        await user.type(
            screen.getByRole('combobox', { name: 'Район' }),
            'київ',
        );

        expect(
            await screen.findByRole('option', { name: 'Київський' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('option', { name: 'Приморський' }),
        ).toBeNull();
    });

    it('sends the chosen option as a string', async () => {
        const { user } = renderForm({
            schema: single,
            defaultValues: { district: '' },
            children: (
                <ComboboxField
                    label="Район"
                    name="district"
                    options={options}
                />
            ),
        });

        await user.click(screen.getByRole('combobox', { name: 'Район' }));
        await user.click(
            await screen.findByRole('option', { name: 'Приморський' }),
        );

        expect(screen.getByRole('combobox', { name: 'Район' })).toHaveValue(
            'Приморський',
        );

        await submitForm(user);

        expect(submittedData()).toEqual({ district: 'primorsky' });
    });

    it('shows the description under the label', async () => {
        const { user } = renderForm({
            schema: single,
            defaultValues: { district: '' },
            children: (
                <ComboboxField
                    label="Район"
                    name="district"
                    options={options}
                />
            ),
        });

        await user.click(screen.getByRole('combobox', { name: 'Район' }));

        expect(
            await screen.findByRole('option', { name: /Пересипський/ }),
        ).toHaveTextContent('Одеса');
    });

    it('sends every chosen option and drops a removed chip', async () => {
        const { user } = renderForm({
            schema: many,
            defaultValues: { districts: [] },
            children: (
                <ComboboxField
                    label="Районы"
                    multiple
                    name="districts"
                    options={options}
                />
            ),
        });

        await user.click(screen.getByLabelText('Районы'));
        await user.click(
            await screen.findByRole('option', { name: 'Приморський' }),
        );
        await user.click(
            await screen.findByRole('option', { name: 'Київський' }),
        );
        await user.keyboard('{Escape}');
        await user.click(
            screen.getByRole('button', { name: 'Убрать «Приморський»' }),
        );
        await submitForm(user);

        expect(submittedData()).toEqual({ districts: ['kyivsky'] });
    });

    it('labels a selected value that is no longer offered', async () => {
        const { user } = renderForm({
            schema: many,
            defaultValues: { districts: ['suvorovsky'] },
            children: (
                <ComboboxField
                    label="Районы"
                    multiple
                    name="districts"
                    options={options}
                    selectedOptions={[
                        { value: 'suvorovsky', label: 'Суворовський' },
                    ]}
                />
            ),
        });

        expect(screen.getByText('Суворовський')).toBeInTheDocument();

        await user.click(screen.getByLabelText('Районы'));
        await screen.findByRole('option', { name: 'Приморський' });

        expect(
            screen.queryByRole('option', { name: 'Суворовський' }),
        ).toBeNull();

        await user.keyboard('{Escape}');
        await submitForm(user);

        expect(submittedData()).toEqual({ districts: ['suvorovsky'] });
    });

    it('leaves the search to the caller when it listens for the query', async () => {
        const onSearchChange = vi.fn();

        const { user } = renderForm({
            schema: single,
            defaultValues: { district: '' },
            children: (
                <ComboboxField
                    label="Район"
                    name="district"
                    onSearchChange={onSearchChange}
                    options={options}
                />
            ),
        });

        await user.type(screen.getByRole('combobox', { name: 'Район' }), 'зз');

        await waitFor(() =>
            expect(onSearchChange).toHaveBeenLastCalledWith(
                'зз',
                expect.anything(),
            ),
        );
        expect(
            await screen.findByRole('option', { name: 'Приморський' }),
        ).toBeInTheDocument();
    });

    it('shows the empty text when nothing matches', async () => {
        const { user } = renderForm({
            schema: single,
            defaultValues: { district: '' },
            children: (
                <ComboboxField
                    emptyText="Район не найден"
                    label="Район"
                    name="district"
                    options={options}
                />
            ),
        });

        await user.type(screen.getByRole('combobox', { name: 'Район' }), 'зз');

        expect(await screen.findByText('Район не найден')).toBeInTheDocument();
    });
});
