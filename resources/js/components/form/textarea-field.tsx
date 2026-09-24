import type { ComponentProps } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

type OwnedTextareaProps =
    | 'name'
    | 'id'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'onBlur'
    | 'disabled'
    | 'ref';

export type TextareaFieldProps = FormFieldBaseProps &
    Omit<ComponentProps<typeof Textarea>, OwnedTextareaProps>;

export function TextareaField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    ...textareaProps
}: TextareaFieldProps) {
    return (
        <FormField
            name={name}
            label={label}
            labelAction={labelAction}
            aria-label={ariaLabel}
            description={description}
            className={className}
            orientation={orientation}
            disabled={disabled}
        >
            {({ field, ...aria }) => (
                <Textarea
                    {...textareaProps}
                    {...field}
                    value={field.value ?? ''}
                    {...aria}
                />
            )}
        </FormField>
    );
}
