import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { TextareaField } from './textarea-field';

const schema = z.object({ bio: z.string() });

describe('TextareaField', () => {
    it('renders its label wired to the textarea', () => {
        renderForm({
            schema,
            defaultValues: { bio: '' },
            children: <TextareaField name="bio" label="Biography" />,
        });

        expect(screen.getByLabelText('Biography').tagName).toBe('TEXTAREA');
    });

    it('sends what the user typed', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { bio: '' },
            children: <TextareaField name="bio" label="Biography" />,
        });

        await user.type(screen.getByLabelText('Biography'), 'Wrote a compiler');
        await submitForm(user);

        expect(submittedData()).toEqual({ bio: 'Wrote a compiler' });
    });
});
