import { screen, waitFor } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
    renderForm,
    respondWithErrors,
    submitForm,
    submittedData,
} from '@/test/form-harness';
import { TextField } from './text-field';
import { TranslatableField } from './translatable-field';

const schema = z.object({
    title_ua: z.string().min(1, 'Укажите название'),
    title_ru: z.string(),
    title_en: z.string(),
});

const locales = [
    { name: 'title_ua', label: 'UA' },
    { name: 'title_ru', label: 'RU' },
    { name: 'title_en', label: 'EN' },
];

const defaultValues = { title_ua: '', title_ru: '', title_en: '' };

function FocusEnglish() {
    const { setFocus } = useFormContext();

    return (
        <button onClick={() => setFocus('title_en')} type="button">
            Focus English
        </button>
    );
}

describe('TranslatableField', () => {
    it('shows one locale at a time under a tab', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: <TranslatableField label="Название" locales={locales} />,
        });

        expect(
            screen.getByRole('group', { name: 'Название' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'UA' })).toBeVisible();
        expect(screen.queryByRole('textbox', { name: 'EN' })).toBeNull();

        await user.click(screen.getByRole('tab', { name: 'EN' }));

        expect(screen.getByRole('textbox', { name: 'EN' })).toBeVisible();
        await waitFor(() =>
            expect(screen.queryByRole('textbox', { name: 'UA' })).toBeNull(),
        );
    });

    it('sends every locale under its own name', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: <TranslatableField label="Название" locales={locales} />,
        });

        await user.type(screen.getByRole('textbox', { name: 'UA' }), 'Одеса');
        await user.click(screen.getByRole('tab', { name: 'EN' }));
        await user.type(screen.getByRole('textbox', { name: 'EN' }), 'Odesa');
        await submitForm(user);

        expect(submittedData()).toEqual({
            title_ua: 'Одеса',
            title_ru: '',
            title_en: 'Odesa',
        });
    });

    it('opens the tab of a locale focused through the form', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: (
                <>
                    <TranslatableField label="Название" locales={locales} />
                    <FocusEnglish />
                </>
            ),
        });

        await user.click(screen.getByRole('button', { name: 'Focus English' }));

        expect(
            await screen.findByRole('textbox', { name: 'EN' }),
        ).toHaveFocus();
    });

    it('opens the rejected locale when the open one is valid', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: (
                <TranslatableField
                    defaultLocale="title_en"
                    label="Название"
                    locales={locales}
                />
            ),
        });

        await submitForm(user);

        const input = await screen.findByRole('textbox', { name: 'UA' });

        expect(input).toHaveFocus();
        expect(screen.getByText('Укажите название')).toBeVisible();
    });

    it('opens the locale the server rejected', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { ...defaultValues, title_ua: 'Одеса' },
            children: <TranslatableField label="Название" locales={locales} />,
        });

        await submitForm(user);
        await respondWithErrors({ title_en: 'Too long' });

        expect(
            await screen.findByRole('textbox', { name: 'EN' }),
        ).toHaveFocus();
        expect(screen.getByText('Too long')).toBeVisible();
    });

    it('leaves focus on an earlier invalid field', async () => {
        const { user } = renderForm({
            schema: schema.extend({ code: z.string().min(1, 'Укажите код') }),
            defaultValues: { ...defaultValues, code: '' },
            children: (
                <>
                    <TextField label="Код" name="code" />
                    <TranslatableField
                        defaultLocale="title_en"
                        label="Название"
                        locales={locales}
                    />
                </>
            ),
        });

        await submitForm(user);

        expect(
            await screen.findByRole('textbox', { name: 'UA' }),
        ).toBeVisible();
        expect(screen.getByLabelText('Код')).toHaveFocus();
    });
});
