import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
    didSubmit,
    renderForm,
    respondWithErrors,
    respondWithSuccess,
    submitForm,
    submittedData,
    submittedUrl,
    TEST_ACTION,
} from '@/test/form-harness';
import { Form } from './form';
import { TextField } from './text-field';
import { useInertiaForm } from './use-inertia-form';

const schema = z.object({
    email: z.email('Enter a valid email address.'),
    name: z.string(),
});

const defaultValues = { email: '', name: '' };

const fields = (
    <>
        <TextField name="email" label="Email" />
        <TextField name="name" label="Name" />
    </>
);

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Name'), 'Ada');
}

describe('Form', () => {
    it('submits to the action url', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: fields,
        });

        await fillValid(user);
        await submitForm(user);

        expect(submittedUrl()).toBe(TEST_ACTION.url);
        expect(submittedData()).toEqual({
            email: 'ada@example.com',
            name: 'Ada',
        });
    });

    it('does not submit when the schema rejects the values', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: fields,
        });

        await user.type(screen.getByLabelText('Email'), 'not-an-email');
        await submitForm(user);

        expect(didSubmit()).toBe(false);
        expect(
            await screen.findByText('Enter a valid email address.'),
        ).toBeInTheDocument();
    });

    it('shows a server error next to the field it belongs to', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: fields,
        });

        await fillValid(user);
        await submitForm(user);
        await respondWithErrors({
            email: 'These credentials do not match our records.',
        });

        expect(
            screen.getByText('These credentials do not match our records.'),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toHaveAttribute(
            'aria-invalid',
            'true',
        );
    });

    it('focuses the first field the server rejected', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: fields,
        });

        await fillValid(user);
        await submitForm(user);
        await respondWithErrors({ email: 'The email has already been taken.' });

        expect(screen.getByLabelText('Email')).toHaveFocus();
    });

    it('surfaces a server error that matches no field as an alert', async () => {
        const { user } = renderForm({
            schema,
            defaultValues,
            children: fields,
        });

        await fillValid(user);
        await submitForm(user);
        await respondWithErrors({
            throttle:
                'Too many login attempts. Please try again in 60 seconds.',
        });

        const alert = screen.getByRole('alert');

        expect(alert).toHaveTextContent(
            'Too many login attempts. Please try again in 60 seconds.',
        );
        // Absent, not "false": the attribute-presence selectors in the input
        // primitives paint any aria-invalid value as invalid.
        expect(screen.getByLabelText('Email')).not.toHaveAttribute(
            'aria-invalid',
        );
    });

    it('stays in the submitting state until the request finishes', async () => {
        const user = userEvent.setup();

        render(
            <Form
                action={TEST_ACTION}
                schema={schema}
                defaultValues={defaultValues}
            >
                {({ formState }) => (
                    <>
                        {fields}
                        <button type="submit" disabled={formState.isSubmitting}>
                            Save
                        </button>
                    </>
                )}
            </Form>,
        );

        await fillValid(user);
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

        await respondWithSuccess();

        expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });

    it('clears only the fields listed in resetOnSuccess', async () => {
        const user = userEvent.setup();

        render(
            <Form
                action={TEST_ACTION}
                schema={schema}
                defaultValues={defaultValues}
                resetOnSuccess={['name']}
            >
                {fields}
                <button type="submit">Save</button>
            </Form>,
        );

        await fillValid(user);
        await user.click(screen.getByRole('button', { name: 'Save' }));
        await respondWithSuccess();

        expect(screen.getByLabelText('Name')).toHaveValue('');
        expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    });

    it('accepts a form created outside it', async () => {
        function Page() {
            const form = useInertiaForm({
                action: TEST_ACTION,
                schema,
                defaultValues,
            });

            return (
                <Form form={form}>
                    {fields}
                    <button type="submit">Save</button>
                    <button
                        type="button"
                        onClick={() => {
                            form.setValue('name', 'Grace');
                        }}
                    >
                        Fill name
                    </button>
                </Form>
            );
        }

        const user = userEvent.setup();

        render(<Page />);

        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: 'Fill name' }));
        await user.click(screen.getByRole('button', { name: 'Save' }));

        expect(submittedData()).toEqual({
            email: 'ada@example.com',
            name: 'Grace',
        });
    });
});
