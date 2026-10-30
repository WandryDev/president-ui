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

    it('groups the amount by thousands as it is typed', async () => {
        const { user } = renderMoneyField();
        const input = screen.getByLabelText('Цена');

        await user.type(input, '1234567,5');

        expect(input).toHaveValue('1 234 567,5');
        expect(input).toHaveProperty('selectionStart', 11);

        await submitForm(user);

        expect(submittedData()).toEqual({
            currency: 'UAH',
            price: '1 234 567,5',
        });
    });

    it('shows a saved amount grouped', () => {
        renderMoneyField('85000.5');

        expect(screen.getByLabelText('Цена')).toHaveValue('85 000.5');
    });

    it('drops what is not part of an amount', async () => {
        const { user } = renderMoneyField();
        const input = screen.getByLabelText('Цена');

        await user.type(input, '12a3,4,5');

        expect(input).toHaveValue('123,45');
    });

    it('keeps the caret after the digit typed in the middle', async () => {
        const { user } = renderMoneyField('1000');
        const input = screen.getByLabelText('Цена');

        await user.type(input, '5', {
            initialSelectionEnd: 1,
            initialSelectionStart: 1,
        });

        expect(input).toHaveValue('15 000');
        expect(input).toHaveProperty('selectionStart', 2);
    });

    it('takes the digit before a separator erased with Backspace', async () => {
        const { user } = renderMoneyField('85000');
        const input = screen.getByLabelText('Цена');

        await user.type(input, '{Backspace}', {
            initialSelectionEnd: 3,
            initialSelectionStart: 3,
        });

        expect(input).toHaveValue('8 000');
        expect(input).toHaveProperty('selectionStart', 1);
    });

    it('takes the digit after a separator erased with Delete', async () => {
        const { user } = renderMoneyField('85000');
        const input = screen.getByLabelText('Цена');

        await user.type(input, '{Delete}', {
            initialSelectionEnd: 2,
            initialSelectionStart: 2,
        });

        expect(input).toHaveValue('8 500');
        expect(input).toHaveProperty('selectionStart', 3);
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

    it('shows the message of a rejected currency under the group', async () => {
        const { user } = renderMoneyField('100');

        await submitForm(user);
        await respondWithErrors({ currency: 'Валюта не поддерживается' });

        expect(
            await screen.findByText('Валюта не поддерживается'),
        ).toBeInTheDocument();
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
