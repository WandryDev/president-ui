import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField } from './form-field';
import type { FieldOption, FormFieldBaseProps } from './types';

export type RadioGroupFieldProps = FormFieldBaseProps & {
    options?: FieldOption[];
    children?: ReactNode;
    groupClassName?: string;
};

export function RadioGroupField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    options,
    children,
    groupClassName,
}: RadioGroupFieldProps) {
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
                <RadioGroup
                    {...aria}
                    id={id}
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ''}
                    disabled={field.disabled}
                    className={groupClassName}
                    onBlur={field.onBlur}
                    onValueChange={(value) => {
                        field.onChange(value);
                    }}
                >
                    {children ??
                        options?.map((option) => (
                            <div
                                key={option.value}
                                className="flex items-center gap-2"
                            >
                                <RadioGroupItem
                                    aria-labelledby={`${id}-${option.value}-label`}
                                    id={`${id}-${option.value}`}
                                    value={option.value}
                                    disabled={option.disabled}
                                />

                                <Label
                                    htmlFor={`${id}-${option.value}`}
                                    id={`${id}-${option.value}-label`}
                                >
                                    {option.label}
                                </Label>
                            </div>
                        ))}
                </RadioGroup>
            )}
        </FormField>
    );
}
