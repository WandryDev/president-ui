import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { PasswordField } from './password-field';

const schema = z.object({ password: z.string() });

describe('PasswordField', () => {
    it('renders a masked input wired to its label', () => {
        renderForm({
            schema,
            defaultValues: { password: '' },
            children: <PasswordField name="password" label="Password" />,
        });

        expect(screen.getByLabelText('Password')).toHaveAttribute(
            'type',
            'password',
        );
    });

    it('sends what the user typed', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { password: '' },
            children: <PasswordField name="password" label="Password" />,
        });

        await user.type(screen.getByLabelText('Password'), 'hunter2hunter2');
        await submitForm(user);

        expect(submittedData()).toEqual({ password: 'hunter2hunter2' });
    });

    it('warns while Caps Lock is on and clears the warning on blur', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { password: '' },
            children: <PasswordField name="password" label="Password" />,
        });

        const input = screen.getByLabelText('Password');

        await user.click(input);
        expect(screen.queryByText('Caps Lock')).not.toBeInTheDocument();

        await user.keyboard('{CapsLock}');
        await user.type(input, 'A');

        expect(screen.getByText('Caps Lock')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Caps Lock is on');

        await user.tab();

        expect(screen.queryByText('Caps Lock')).not.toBeInTheDocument();
    });

    it('unmasks the value when the toggle is pressed', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { password: '' },
            children: <PasswordField name="password" label="Password" />,
        });

        await user.click(screen.getByRole('button', { name: 'Show password' }));

        expect(screen.getByLabelText('Password')).toHaveAttribute(
            'type',
            'text',
        );
    });
});
