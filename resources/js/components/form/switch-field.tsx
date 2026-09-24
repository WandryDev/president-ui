import { Switch } from '@/components/ui/switch';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

export type SwitchFieldProps = FormFieldBaseProps;

export function SwitchField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation = 'horizontal',
    disabled,
}: SwitchFieldProps) {
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
            controlFirst
        >
            {({ field, ...aria }) => (
                <Switch
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
