import type { ReactNode } from 'react';
import { useContext, useEffect, useId } from 'react';
import { Controller, get, useFormContext, useFormState } from 'react-hook-form';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { isKnownFieldPath } from './field-paths';
import { FieldPathsContext } from './form-context';
import type {
    FieldOrientation,
    FormFieldBaseProps,
    FormFieldRenderArgs,
} from './types';

/**
 * Base UI's Field.Root is a plain column and has no `orientation` prop, so the
 * variants the form primitives were built against live here. Keeping them out
 * of `ui/field.tsx` means a registry resync cannot drop them again.
 */
const orientationClassName: Record<FieldOrientation, string> = {
    vertical: '',
    horizontal: 'flex-row items-center *:data-[slot=field-label]:flex-auto',
    responsive:
        'sm:flex-row sm:items-center sm:*:data-[slot=field-label]:flex-auto',
};

export type FormFieldProps = FormFieldBaseProps & {
    /**
     * Renders the control and nothing else. The label, description, error and
     * aria wiring around it belong to FormField.
     */
    children: (args: FormFieldRenderArgs) => ReactNode;
    /** Places the control before its label, as checkboxes and switches expect. */
    controlFirst?: boolean;
    /**
     * Other paths whose errors are shown with this field's, for a control that
     * edits more than one value, like an amount with its currency.
     */
    includeErrorsOf?: string[];
};

/**
 * `name` is typed as a plain string, so a typo cannot be caught by the compiler.
 * This checks it against the paths derived from the form's default values and
 * fails loudly in development instead of silently leaving the field unbound.
 */
function useKnownFieldName(name: string): void {
    const fieldPaths = useContext(FieldPathsContext);

    useEffect(() => {
        if (
            !import.meta.env.DEV ||
            fieldPaths === null ||
            isKnownFieldPath(fieldPaths, name)
        ) {
            return;
        }

        throw new Error(
            `FormField: field "${name}" is not part of the form schema. Available paths: ${[...fieldPaths].sort().join(', ')}.`,
        );
    }, [fieldPaths, name]);
}

export function FormField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    controlFirst = false,
    includeErrorsOf,
    children,
}: FormFieldProps) {
    const { control } = useFormContext();
    const { errors } = useFormState({
        control,
        disabled: includeErrorsOf === undefined,
        name: includeErrorsOf ?? name,
    });
    const includedMessages = (includeErrorsOf ?? [])
        .map((path) => get(errors, path)?.message)
        .filter(
            (message): message is string =>
                typeof message === 'string' && message !== '',
        );
    const generatedId = useId();

    useKnownFieldName(name);

    const id = `${name}-${generatedId}`;
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;

    return (
        <Controller
            control={control}
            name={name}
            disabled={disabled}
            render={({ field, fieldState }) => {
                const messages = [
                    fieldState.error?.message,
                    ...includedMessages,
                ].filter(Boolean);
                const invalid =
                    Boolean(fieldState.error) || includedMessages.length > 0;
                const describedBy =
                    [
                        description ? descriptionId : null,
                        invalid ? errorId : null,
                    ]
                        .filter(Boolean)
                        .join(' ') || undefined;

                const controlNode = children({
                    field,
                    id,
                    'aria-invalid': invalid || undefined,
                    'aria-describedby': describedBy,
                    'aria-label': ariaLabel,
                });

                const fieldLabel = label ? (
                    <FieldLabel htmlFor={id}>{label}</FieldLabel>
                ) : null;

                // `w-full` is what lets the action sit at the far edge: Field
                // is `items-start`, so without it this row shrinks to its own
                // content and there is no free space to justify against.
                const labelNode =
                    fieldLabel && labelAction ? (
                        <div className="flex w-full items-center justify-between gap-2">
                            {fieldLabel}
                            {labelAction}
                        </div>
                    ) : (
                        fieldLabel
                    );

                return (
                    <Field
                        className={cn(
                            orientationClassName[orientation ?? 'vertical'],
                            className,
                        )}
                        invalid={invalid}
                    >
                        {controlFirst ? controlNode : labelNode}
                        {controlFirst ? labelNode : controlNode}

                        {description ? (
                            <FieldDescription id={descriptionId}>
                                {description}
                            </FieldDescription>
                        ) : null}

                        {invalid ? (
                            // Several messages for one field come joined by line breaks.
                            <FieldError
                                className="whitespace-pre-line"
                                id={errorId}
                                match
                            >
                                {messages.join('\n')}
                            </FieldError>
                        ) : null}
                    </Field>
                );
            }}
        />
    );
}
