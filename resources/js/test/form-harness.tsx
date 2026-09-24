import type { VisitOptions } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import { vi } from 'vitest';
import type { ZodType, z } from 'zod';
import { Form } from '@/components/form/form';

export const TEST_ACTION = { url: '/test', method: 'post' } as const;

export const SUBMIT_LABEL = 'Save';

type RenderFormOptions<TSchema extends ZodType<unknown, FieldValues>> = {
    schema: TSchema;
    defaultValues: DefaultValues<z.input<TSchema> & FieldValues>;
    children: ReactNode;
};

export function renderForm<TSchema extends ZodType<unknown, FieldValues>>({
    schema,
    defaultValues,
    children,
}: RenderFormOptions<TSchema>) {
    const user = userEvent.setup();

    render(
        <Form
            action={TEST_ACTION}
            schema={schema}
            defaultValues={defaultValues}
        >
            {children}
            <button type="submit">{SUBMIT_LABEL}</button>
        </Form>,
    );

    return { user };
}

export async function submitForm(
    user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
    await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }));
}

function lastVisit(): [string, VisitOptions] {
    const calls = vi.mocked(router.visit).mock.calls;

    if (calls.length === 0) {
        throw new Error(
            'The form did not submit. Validation most likely rejected the values.',
        );
    }

    return calls[calls.length - 1] as [string, VisitOptions];
}

/** The payload the form last handed to Inertia. */
export function submittedData(): Record<string, unknown> {
    return lastVisit()[1].data as Record<string, unknown>;
}

export function submittedUrl(): string {
    return lastVisit()[0];
}

export function didSubmit(): boolean {
    return vi.mocked(router.visit).mock.calls.length > 0;
}

/** Replays a Laravel 422 response through the callbacks Inertia would have called. */
export async function respondWithErrors(
    errors: Record<string, string>,
): Promise<void> {
    const [, options] = lastVisit();

    await act(async () => {
        options.onError?.(errors);
        options.onFinish?.({} as never);
    });
}

export async function respondWithSuccess(): Promise<void> {
    const [, options] = lastVisit();

    await act(async () => {
        options.onSuccess?.({} as never);
        options.onFinish?.({} as never);
    });
}
