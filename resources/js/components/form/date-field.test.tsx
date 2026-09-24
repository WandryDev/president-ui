import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { DateField } from './date-field';

const schema = z.object({ starts_on: z.string() });

describe('DateField', () => {
    it('renders the placeholder while empty', () => {
        renderForm({
            schema,
            defaultValues: { starts_on: '' },
            children: (
                <DateField
                    name="starts_on"
                    label="Start date"
                    placeholder="Pick a date"
                />
            ),
        });

        // The trigger takes its accessible name from the field label, so the
        // placeholder is asserted on the visible text instead.
        expect(screen.getByLabelText('Start date')).toHaveTextContent(
            'Pick a date',
        );
    });

    it('stores the picked day as a yyyy-MM-dd string', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { starts_on: '2024-03-10' },
            children: <DateField name="starts_on" label="Start date" />,
        });

        await user.click(screen.getByLabelText('Start date'));
        await user.click(within(screen.getByRole('grid')).getByText('15'));
        await submitForm(user);

        expect(submittedData()).toEqual({ starts_on: '2024-03-15' });
    });
});
