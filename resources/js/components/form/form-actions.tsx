import { Link } from '@inertiajs/react';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FormActionsAlign = 'start' | 'end';

export type FormActionsProps = {
    submitLabel: ReactNode;
    /**
     * `start` (page forms): submit, then a ghost cancel link.
     * `end` (dialogs and sheets): cancel, then submit, pushed to the end.
     */
    align?: FormActionsAlign;
    cancelLabel?: ReactNode;
    /** Where cancel leads; a Wayfinder route or a URL. Rendered as an Inertia `Link`. */
    cancelHref?: ComponentProps<typeof Link>['href'];
    /** Cancel as a button, e.g. closing a dialog. Ignored when `cancelHref` is set. */
    onCancel?: () => void;
    /** Defaults to `formState.isSubmitting`. */
    pending?: boolean;
    disabled?: boolean;
    submitVariant?: ButtonProps['variant'];
    /** Defaults to `ghost` for `start` and `secondary` for `end`. */
    cancelVariant?: ButtonProps['variant'];
    className?: string;
};

/**
 * The footer of a form: its submit button, which shows a spinner and stays
 * disabled while the form is sent, and an optional way back. Without
 * `cancelHref` or `onCancel` there is no cancel button.
 */
export function FormActions({
    submitLabel,
    align = 'start',
    cancelLabel = 'Отмена',
    cancelHref,
    onCancel,
    pending,
    disabled = false,
    submitVariant = 'default',
    cancelVariant = align === 'start' ? 'ghost' : 'secondary',
    className,
}: FormActionsProps): ReactElement {
    const { formState } = useFormContext();
    const isPending = pending ?? formState.isSubmitting;

    const submit = (
        <Button
            disabled={disabled}
            loading={isPending}
            type="submit"
            variant={submitVariant}
        >
            {submitLabel}
        </Button>
    );

    let cancel: ReactNode = null;

    if (cancelHref !== undefined) {
        cancel = (
            <Button render={<Link href={cancelHref} />} variant={cancelVariant}>
                {cancelLabel}
            </Button>
        );
    } else if (onCancel) {
        cancel = (
            <Button
                disabled={isPending}
                onClick={onCancel}
                type="button"
                variant={cancelVariant}
            >
                {cancelLabel}
            </Button>
        );
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2',
                align === 'end' && 'justify-end',
                className,
            )}
            data-slot="form-actions"
        >
            {align === 'start' ? submit : cancel}
            {align === 'start' ? cancel : submit}
        </div>
    );
}
