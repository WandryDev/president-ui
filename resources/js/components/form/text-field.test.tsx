import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { TextField } from './text-field';

const schema = z.object({ name: z.string() });

describe('TextField', () => {
    it('renders its label wired to the input', () => {
        renderForm({
            schema,
            defaultValues: { name: '' },
            children: <TextField name="name" label="Full name" />,
        });

        expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    });

    it('sends what the user typed', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { name: '' },
            children: <TextField name="name" label="Full name" />,
        });

        await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace');
        await submitForm(user);

        expect(submittedData()).toEqual({ name: 'Ada Lovelace' });
    });
});
