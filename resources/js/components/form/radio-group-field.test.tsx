import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { RadioGroupField } from './radio-group-field';

const schema = z.object({ plan: z.string() });

const options = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
];

describe('RadioGroupField', () => {
    it('renders one radio per option', () => {
        renderForm({
            schema,
            defaultValues: { plan: 'free' },
            children: (
                <RadioGroupField name="plan" label="Plan" options={options} />
            ),
        });

        expect(screen.getByRole('radio', { name: 'Free' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Pro' })).toBeInTheDocument();
    });

    it('sends the selected option', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { plan: 'free' },
            children: (
                <RadioGroupField name="plan" label="Plan" options={options} />
            ),
        });

        await user.click(screen.getByRole('radio', { name: 'Pro' }));
        await submitForm(user);

        expect(submittedData()).toEqual({ plan: 'pro' });
    });
});
