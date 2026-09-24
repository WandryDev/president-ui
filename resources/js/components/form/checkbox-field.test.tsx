import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { CheckboxField } from './checkbox-field';

const schema = z.object({ remember: z.boolean() });

describe('CheckboxField', () => {
    it('renders its label wired to the checkbox', () => {
        renderForm({
            schema,
            defaultValues: { remember: false },
            children: <CheckboxField name="remember" label="Remember me" />,
        });

        expect(
            screen.getByRole('checkbox', { name: 'Remember me' }),
        ).toBeInTheDocument();
    });

    it('sends the toggled value', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { remember: false },
            children: <CheckboxField name="remember" label="Remember me" />,
        });

        await user.click(screen.getByRole('checkbox', { name: 'Remember me' }));
        await submitForm(user);

        expect(submittedData()).toEqual({ remember: true });
    });
});
