import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { SelectField } from './select-field';

const schema = z.object({ role: z.string() });

const options = [
    { value: 'admin', label: 'Admin' },
    { value: 'editor', label: 'Editor' },
];

describe('SelectField', () => {
    it('renders its label and placeholder', () => {
        renderForm({
            schema,
            defaultValues: { role: '' },
            children: (
                <SelectField
                    name="role"
                    label="Role"
                    placeholder="Pick a role"
                    options={options}
                />
            ),
        });

        expect(screen.getByLabelText('Role')).toBeInTheDocument();
        expect(screen.getByText('Pick a role')).toBeInTheDocument();
    });

    it('shows the label of a value it was given', () => {
        renderForm({
            schema,
            defaultValues: { role: 'admin' },
            children: (
                <SelectField name="role" label="Role" options={options} />
            ),
        });

        expect(screen.getByLabelText('Role')).toHaveTextContent('Admin');
    });

    it('sends the chosen option', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { role: '' },
            children: (
                <SelectField
                    name="role"
                    label="Role"
                    placeholder="Pick a role"
                    options={options}
                />
            ),
        });

        await user.click(screen.getByLabelText('Role'));
        await user.click(
            await screen.findByRole(
                'option',
                { name: 'Editor' },
                { timeout: 3000 },
            ),
        );
        await submitForm(user);

        expect(submittedData()).toEqual({ role: 'editor' });
    });
});
