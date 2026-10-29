import { router } from '@inertiajs/react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { TEST_ACTION } from '@/test/form-harness';
import { Form } from './form';
import type { FormActionsProps } from './form-actions';
import { FormActions } from './form-actions';

const schema = z.object({ name: z.string() });

function renderActions(props: Partial<FormActionsProps> = {}): {
    user: ReturnType<typeof userEvent.setup>;
} {
    const user = userEvent.setup();

    render(
        <Form action={TEST_ACTION} defaultValues={{ name: '' }} schema={schema}>
            <FormActions submitLabel="Создать" {...props} />
        </Form>,
    );

    return { user };
}

function buttonTexts(): string[] {
    const footer = document.querySelector(
        '[data-slot="form-actions"]',
    ) as HTMLElement;

    return [...footer.children].map((child) => child.textContent ?? '');
}

describe('FormActions', () => {
    it('submits the form', async () => {
        const { user } = renderActions();

        await user.click(screen.getByRole('button', { name: 'Создать' }));

        expect(router.visit).toHaveBeenCalledWith(
            TEST_ACTION.url,
            expect.anything(),
        );
    });

    it('keeps the submit disabled while the form is sent', async () => {
        const { user } = renderActions({ onCancel: vi.fn() });

        await user.click(screen.getByRole('button', { name: 'Создать' }));

        expect(screen.getByRole('button', { name: /Создать/ })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
    });

    it('shows the pending state it is given', () => {
        renderActions({ pending: true });

        expect(screen.getByRole('button', { name: /Создать/ })).toHaveAttribute(
            'data-loading',
        );
    });

    it('puts submit first and a cancel link after it on a page', () => {
        renderActions({ cancelHref: '/clients' });

        expect(screen.getByRole('link', { name: 'Отмена' })).toHaveAttribute(
            'href',
            '/clients',
        );
        expect(buttonTexts()).toEqual(['Создать', 'Отмена']);
    });

    it('puts cancel first and submit at the end in a dialog', async () => {
        const onCancel = vi.fn();
        const { user } = renderActions({
            align: 'end',
            cancelLabel: 'Не отменять',
            onCancel,
        });

        expect(buttonTexts()).toEqual(['Не отменять', 'Создать']);

        await user.click(screen.getByRole('button', { name: 'Не отменять' }));

        expect(onCancel).toHaveBeenCalledOnce();
        expect(router.visit).not.toHaveBeenCalled();
    });

    it('renders no cancel without a way back', () => {
        renderActions();

        expect(buttonTexts()).toEqual(['Создать']);
    });
});
