import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { NumericField } from './number-field';

const schema = z.object({ area: z.number().nullable() });

function renderNumericField(
    props: Partial<Parameters<typeof NumericField>[0]> = {},
    area: number | null = null,
) {
    return renderForm({
        children: <NumericField label="Площадь" name="area" {...props} />,
        defaultValues: { area },
        schema,
    });
}

describe('NumericField', () => {
    it('sends the typed number as a number', async () => {
        const { user } = renderNumericField();

        await user.type(screen.getByLabelText('Площадь'), '54,5');
        await user.tab();
        await submitForm(user);

        expect(submittedData()).toEqual({ area: 54.5 });
    });

    it('sends null once the input is cleared', async () => {
        const { user } = renderNumericField({}, 12);

        await user.clear(screen.getByLabelText('Площадь'));
        await user.tab();
        await submitForm(user);

        expect(submittedData()).toEqual({ area: null });
    });

    it('shows the prefix and the suffix around the input', () => {
        renderNumericField({ prefix: 'от', suffix: 'м²' }, 1200);

        expect(screen.getByText('от')).toBeInTheDocument();
        expect(screen.getByText('м²')).toBeInTheDocument();
        expect(
            (screen.getByLabelText('Площадь') as HTMLInputElement).value,
        ).toMatch(/^1\s200$/);
    });

    it('keeps whole numbers for an integer', async () => {
        const { user } = renderNumericField({ kind: 'integer' });

        await user.type(screen.getByLabelText('Площадь'), '3,6');
        await user.tab();
        await submitForm(user);

        expect(submittedData()).toEqual({ area: 4 });
    });

    it('takes no minus sign unless negatives are allowed', async () => {
        const { user } = renderNumericField();

        await user.type(screen.getByLabelText('Площадь'), '-5');
        await user.tab();
        await submitForm(user);

        expect(submittedData()).toEqual({ area: 5 });
    });

    it('keeps a negative number when allowed', async () => {
        const { user } = renderNumericField({
            allowNegative: true,
            kind: 'integer',
        });

        await user.type(screen.getByLabelText('Площадь'), '-2');
        await user.tab();
        await submitForm(user);

        expect(submittedData()).toEqual({ area: -2 });
    });

    it('clamps to max on blur', async () => {
        const { user } = renderNumericField({ max: 100 });

        await user.type(screen.getByLabelText('Площадь'), '250');
        await user.tab();
        await submitForm(user);

        expect(submittedData()).toEqual({ area: 100 });
    });

    it('steps with the steppers', async () => {
        const { user } = renderNumericField(
            { showSteppers: true, step: 5 },
            10,
        );

        await user.click(screen.getByRole('button', { name: /increase/i }));
        await submitForm(user);

        expect(submittedData()).toEqual({ area: 15 });
    });
});
