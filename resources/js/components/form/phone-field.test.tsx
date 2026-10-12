import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
    renderForm,
    respondWithErrors,
    submitForm,
    submittedData,
} from '@/test/form-harness';
import { PhoneField } from './phone-field';

const schema = z.object({ phone: z.string() });

function renderPhone(phone = '') {
    return renderForm({
        schema,
        defaultValues: { phone },
        children: (
            <PhoneField defaultCountry="UA" label="Телефон" name="phone" />
        ),
    });
}

describe('PhoneField', () => {
    it('formats a national number and sends it in E.164', async () => {
        const { user } = renderPhone();

        await user.type(screen.getByLabelText('Телефон'), '0671234567');

        expect(screen.getByLabelText('Телефон')).toHaveValue('067 123 4567');

        await submitForm(user);

        expect(submittedData()).toEqual({ phone: '+380671234567' });
    });

    it('shows a stored number in the format of its country, with its flag', () => {
        renderPhone('+48512345678');

        expect(screen.getByLabelText('Телефон')).toHaveValue('512 345 678');
        expect(
            screen.getByRole('combobox', { name: 'Страна номера телефона' }),
        ).toHaveTextContent('Польша');
    });

    it('switches the mask to the country picked from the list', async () => {
        const { user } = renderPhone();

        await user.click(
            screen.getByRole('combobox', { name: 'Страна номера телефона' }),
        );
        await user.type(
            await screen.findByRole('combobox', { name: 'Поиск страны' }),
            'польш',
        );
        await user.click(await screen.findByRole('option', { name: /Польша/ }));

        await user.type(screen.getByLabelText('Телефон'), '512345678');
        await submitForm(user);

        expect(submittedData()).toEqual({ phone: '+48512345678' });
    });

    it('finds a country by its calling code', async () => {
        const { user } = renderPhone();

        await user.click(
            screen.getByRole('combobox', { name: 'Страна номера телефона' }),
        );
        await user.type(
            await screen.findByRole('combobox', { name: 'Поиск страны' }),
            '+380',
        );

        expect(
            await screen.findByRole('option', { name: /Украина/ }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: /Польша/ })).toBeNull();
    });

    it('sends an empty string when nothing is typed', async () => {
        const { user } = renderPhone();

        await submitForm(user);

        expect(submittedData()).toEqual({ phone: '' });
    });

    it('marks the number invalid when the server rejects it', async () => {
        const { user } = renderPhone('+380671234567');

        await submitForm(user);
        await respondWithErrors({ phone: 'Номер не распознан.' });

        expect(await screen.findByText('Номер не распознан.')).toBeVisible();
        expect(screen.getByLabelText('Телефон')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
        expect(screen.getByLabelText('Телефон')).toHaveFocus();
    });
});
