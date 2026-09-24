import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { OtpField } from './otp-field';

const schema = z.object({ code: z.string() });

describe('OtpField', () => {
    it('renders one slot per digit', () => {
        renderForm({
            schema,
            defaultValues: { code: '' },
            children: (
                <OtpField name="code" label="Authentication code" length={6} />
            ),
        });

        expect(
            document.querySelectorAll('[data-slot="input-otp-slot"]'),
        ).toHaveLength(6);
    });

    it('sends the typed code', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { code: '' },
            children: (
                <OtpField name="code" label="Authentication code" length={6} />
            ),
        });

        await user.type(screen.getByLabelText('Authentication code'), '123456');
        await submitForm(user);

        expect(submittedData()).toEqual({ code: '123456' });
    });
});
