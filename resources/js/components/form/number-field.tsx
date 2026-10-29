import type { ReactElement, ReactNode } from 'react';
import { FormField } from '@/components/form/form-field';
import type { FormFieldBaseProps } from '@/components/form/types';
import {
    NumberField,
    NumberFieldDecrement,
    NumberFieldGroup,
    NumberFieldIncrement,
    NumberFieldInput,
} from '@/components/ui/number-field';
import { cn } from '@/lib/utils';

export type NumericFieldKind = 'integer' | 'decimal';

export type NumericFieldProps = FormFieldBaseProps & {
    /** Text before the number, e.g. «от». */
    prefix?: ReactNode;
    /** Text after the number, a unit like «м²» or «до». */
    suffix?: ReactNode;
    /** `integer` keeps whole numbers; `decimal` keeps up to `maxFractionDigits`. */
    kind?: NumericFieldKind;
    maxFractionDigits?: number;
    /** Overrides the floor that `allowNegative` sets. */
    min?: number;
    max?: number;
    /** What the arrow keys and the steppers add. */
    step?: number;
    /** Without it the field floors at 0, unless `min` says otherwise. */
    allowNegative?: boolean;
    /** Shows − and + buttons around the input. */
    showSteppers?: boolean;
    placeholder?: string;
    /** How digits are grouped and which decimal separator is read. */
    locale?: Intl.LocalesArgument;
    inputClassName?: string;
};

function Addon({
    children,
    side,
}: {
    children: ReactNode;
    side: 'start' | 'end';
}): ReactElement {
    return (
        <span
            className={cn(
                'flex shrink-0 select-none items-center text-muted-foreground',
                side === 'start'
                    ? 'ps-[calc(--spacing(3)-1px)]'
                    : 'pe-[calc(--spacing(3)-1px)]',
            )}
        >
            {children}
        </span>
    );
}

/**
 * A number held as a `number`, or `null` while empty. It is parsed and
 * formatted for `locale` («85 000», «54,5»), clamped to `min`/`max` on blur,
 * and rounded to whole numbers for `kind="integer"`.
 */
export function NumericField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    prefix,
    suffix,
    kind = 'decimal',
    maxFractionDigits = 2,
    min,
    max,
    step = 1,
    allowNegative = false,
    showSteppers = false,
    placeholder,
    locale = 'ru-RU',
    inputClassName,
}: NumericFieldProps): ReactElement {
    return (
        <FormField
            aria-label={ariaLabel}
            className={className}
            description={description}
            disabled={disabled}
            label={label}
            labelAction={labelAction}
            name={name}
            orientation={orientation}
        >
            {({ field, id, ...aria }) => (
                <NumberField
                    disabled={field.disabled}
                    format={{
                        maximumFractionDigits:
                            kind === 'integer' ? 0 : maxFractionDigits,
                    }}
                    id={id}
                    locale={locale}
                    max={max}
                    min={min ?? (allowNegative ? undefined : 0)}
                    onValueChange={(value) => {
                        field.onChange(
                            value !== null && kind === 'integer'
                                ? Math.round(value)
                                : value,
                        );
                    }}
                    step={step}
                    value={typeof field.value === 'number' ? field.value : null}
                >
                    <NumberFieldGroup>
                        {showSteppers ? <NumberFieldDecrement /> : null}
                        {prefix ? <Addon side="start">{prefix}</Addon> : null}
                        <NumberFieldInput
                            {...aria}
                            className={cn(
                                !showSteppers && 'text-start',
                                inputClassName,
                            )}
                            onBlur={field.onBlur}
                            placeholder={placeholder}
                            ref={field.ref}
                        />
                        {suffix ? <Addon side="end">{suffix}</Addon> : null}
                        {showSteppers ? <NumberFieldIncrement /> : null}
                    </NumberFieldGroup>
                </NumberField>
            )}
        </FormField>
    );
}
