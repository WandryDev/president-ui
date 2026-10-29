import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
    renderForm,
    respondWithErrors,
    submitForm,
    submittedData,
} from '@/test/form-harness';
import { MoneyField } from './money-field';

const currencies = [
    { value: 'UAH', label: 'UAH' },
    { value: 'USD', label: 'USD' },
];

const schema = z.object({
    price: z.string().min(1, 'Укажите цену'),
    currency: z.enum(['UAH', 'USD']),
});

function renderMoneyField(price = '') {
    return renderForm({
        children: (
            <MoneyField
                currencies={currencies}
                currencyName="currency"
                label="Цена"
                name="price"
                placeholder="85 000"
            />
        ),
        defaultValues: { currency: 'UAH', price },
        schema,
    });
}

describe('MoneyField', () => {
    it('sends the typed amount with the chosen currency', async () => {
        const { user } = renderMoneyField();

        await user.type(screen.getByLabelText('Цена'), '85 000');
        await user.click(screen.getByRole('combobox', { name: 'Валюта' }));
        await user.click(await screen.findByRole('option', { name: 'USD' }));
        await submitForm(user);

        expect(submittedData()).toEqual({ currency: 'USD', price: '85 000' });
    });

    it('shows the current currency in the group', () => {
        renderMoneyField('100');

        expect(screen.getByLabelText('Цена')).toHaveValue('100');
        expect(
            screen.getByRole('combobox', { name: 'Валюта' }),
        ).toHaveTextContent('UAH');
    });

    it('shows the amount error under the field', async () => {
        const { user } = renderMoneyField();

        await submitForm(user);

        expect(await screen.findByText('Укажите цену')).toBeInTheDocument();
        expect(screen.getByLabelText('Цена')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
    });

    it('marks the currency invalid when the server rejects it', async () => {
        const { user } = renderMoneyField('100');

        await submitForm(user);
        await respondWithErrors({ currency: 'Валюта не поддерживается' });

        expect(
            screen.getByRole('combobox', { name: 'Валюта' }),
        ).toHaveAttribute('aria-invalid', 'true');
    });
});
