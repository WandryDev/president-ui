import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { SwitchField } from './switch-field';

const schema = z.object({ notifications: z.boolean() });

describe('SwitchField', () => {
    it('renders its label wired to the switch', () => {
        renderForm({
            schema,
            defaultValues: { notifications: false },
            children: (
                <SwitchField name="notifications" label="Email notifications" />
            ),
        });

        expect(
            screen.getByRole('switch', { name: 'Email notifications' }),
        ).toBeInTheDocument();
    });

    it('sends the toggled value', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { notifications: false },
            children: (
                <SwitchField name="notifications" label="Email notifications" />
            ),
        });

        await user.click(
            screen.getByRole('switch', { name: 'Email notifications' }),
        );
        await submitForm(user);

        expect(submittedData()).toEqual({ notifications: true });
    });
});
