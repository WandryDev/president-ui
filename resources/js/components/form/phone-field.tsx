import { FormField } from './form-field';
import type { PhoneInputProps } from './phone-input';
import { PhoneInput } from './phone-input';
import type { FormFieldBaseProps } from './types';

export type PhoneFieldProps = FormFieldBaseProps &
    Pick<
        PhoneInputProps,
        'defaultCountry' | 'countries' | 'labels' | 'placeholder'
    >;

/**
 * A phone number typed against the mask of its country. The form value is
 * the number in E.164 (`+380671234567`), or `''` while nothing is typed.
 */
export function PhoneField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    ...phoneProps
}: PhoneFieldProps) {
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
                <PhoneInput
                    {...phoneProps}
                    {...aria}
                    disabled={field.disabled}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    ref={field.ref}
                    value={field.value ?? ''}
                />
            )}
        </FormField>
    );
}
