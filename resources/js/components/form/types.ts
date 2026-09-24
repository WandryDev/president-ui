import type { ReactNode } from 'react';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

export type FieldOrientation = 'vertical' | 'horizontal' | 'responsive';

/**
 * Attributes that tie a control to its label, description and error message.
 * `FormField` builds them; every field component must spread them onto its control.
 */
export type FieldControlProps = {
    id: string;
    /** Omitted while the field is valid: `aria-invalid="false"` still matches
     * attribute-presence selectors and would paint the control as invalid. */
    'aria-invalid': true | undefined;
    'aria-describedby': string | undefined;
    'aria-label': string | undefined;
};

export type FormFieldRenderArgs = FieldControlProps & {
    field: ControllerRenderProps<FieldValues, string>;
};

export type FormFieldBaseProps = {
    name: string;
    label?: ReactNode;
    /**
     * Rendered on the label's row but outside the `<label>` element, for things
     * like a "Forgot your password?" link. Interactive content may not be nested
     * inside a label, so it cannot simply be part of `label`.
     */
    labelAction?: ReactNode;
    /** Names the control when the surrounding page already shows the label as a heading. */
    'aria-label'?: string;
    description?: ReactNode;
    className?: string;
    orientation?: FieldOrientation;
    disabled?: boolean;
};

export type FieldOption = {
    value: string;
    label: ReactNode;
    disabled?: boolean;
};

/** Shape produced by a Wayfinder route helper, e.g. `store()` or `ProfileController.update()`. */
export type FormAction = {
    url: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
};
