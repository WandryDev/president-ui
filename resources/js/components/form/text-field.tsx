import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

type OwnedInputProps =
    | 'name'
    | 'id'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'onBlur'
    | 'disabled'
    | 'ref';

export type TextFieldProps = FormFieldBaseProps &
    Omit<ComponentProps<typeof Input>, OwnedInputProps>;

export function TextField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    ...inputProps
}: TextFieldProps) {
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
                <Input
                    {...inputProps}
                    {...field}
                    value={field.value ?? ''}
                    {...aria}
                />
            )}
        </FormField>
    );
}
