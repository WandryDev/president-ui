import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

export type CheckboxFieldProps = Omit<FormFieldBaseProps, 'orientation'>;

export function CheckboxField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    disabled,
}: CheckboxFieldProps) {
    return (
        <FormField
            name={name}
            label={label}
            labelAction={labelAction}
            aria-label={ariaLabel}
            description={description}
            className={className}
            orientation="horizontal"
            disabled={disabled}
            controlFirst
        >
            {({ field, ...aria }) => (
                <Checkbox
                    {...aria}
                    name={field.name}
                    ref={field.ref}
                    checked={Boolean(field.value)}
                    disabled={field.disabled}
                    onBlur={field.onBlur}
                    onCheckedChange={(checked) => {
                        field.onChange(checked);
                    }}
                />
            )}
        </FormField>
    );
}
