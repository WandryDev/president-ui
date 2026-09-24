import { Slider } from '@/components/ui/slider';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

export type SliderFieldProps = FormFieldBaseProps & {
    min?: number;
    max?: number;
    step?: number;
};

export function SliderField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    min,
    max,
    step,
}: SliderFieldProps) {
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
            {({ field, id, ...aria }) => (
                <Slider
                    {...aria}
                    id={id}
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? min ?? 0}
                    disabled={field.disabled}
                    min={min}
                    max={max}
                    step={step}
                    onBlur={field.onBlur}
                    onValueChange={(value) => {
                        field.onChange(value);
                    }}
                />
            )}
        </FormField>
    );
}
