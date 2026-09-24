import type { ReactNode } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormField } from './form-field';
import type { FieldOption, FormFieldBaseProps } from './types';

export type SelectFieldProps = FormFieldBaseProps & {
    options?: FieldOption[];
    children?: ReactNode;
    placeholder?: string;
    triggerClassName?: string;
};

export function SelectField({
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
    placeholder,
    triggerClassName,
}: SelectFieldProps) {
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
                <Select
                    name={field.name}
                    value={field.value ?? ''}
                    disabled={field.disabled}
                    items={options}
                    onValueChange={(value) => {
                        field.onChange(value);
                    }}
                >
                    <SelectTrigger
                        {...aria}
                        ref={field.ref}
                        className={triggerClassName}
                        onBlur={field.onBlur}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>

                    {/* Иначе Base UI подгоняет попап так, чтобы выбранный
                        пункт встал по тексту триггера: попап уезжает вбок и
                        становится шире поля. */}
                    <SelectContent alignItemWithTrigger={false}>
                        {children ??
                            options?.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.disabled}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            )}
        </FormField>
    );
}
