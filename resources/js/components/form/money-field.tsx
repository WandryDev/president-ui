import { Field as FieldPrimitive } from '@base-ui/react/field';
import type { ReactElement } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { FormField } from '@/components/form/form-field';
import type { FormFieldBaseProps } from '@/components/form/types';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type MoneyFieldCurrency = {
    value: string;
    label: string;
};

export type MoneyFieldProps = FormFieldBaseProps & {
    /** Path of the amount. It is held as typed («85 000», «12,5»); the schema parses it. */
    name: string;
    /** Path of the currency code, e.g. `currency` or `price.currency`. */
    currencyName: string;
    currencies: MoneyFieldCurrency[];
    placeholder?: string;
    /** Names the currency select, which has no visible label. */
    currencyLabel?: string;
    currencyPlaceholder?: string;
};

function CurrencySelect({
    name,
    currencies,
    label,
    placeholder,
    disabled,
}: {
    name: string;
    currencies: MoneyFieldCurrency[];
    label: string;
    placeholder?: string;
    disabled?: boolean;
}): ReactElement {
    const { control } = useFormContext();
    const { field, fieldState } = useController({ control, disabled, name });

    // A Field of its own: inside the amount's Field the select would register
    // as that field's control and take over the amount input's id and label.
    return (
        <FieldPrimitive.Root
            invalid={Boolean(fieldState.error)}
            render={<InputGroupAddon align="inline-end" />}
        >
            <Select
                disabled={field.disabled}
                items={currencies}
                onValueChange={(value) => {
                    field.onChange(value);
                }}
                value={field.value ?? ''}
            >
                <SelectTrigger
                    aria-invalid={fieldState.error ? true : undefined}
                    aria-label={label}
                    className="w-auto min-w-0 border-0 bg-transparent px-2 shadow-none ring-0 before:hidden dark:bg-transparent"
                    onBlur={field.onBlur}
                    ref={field.ref}
                    size="sm"
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>

                <SelectContent alignItemWithTrigger={false}>
                    {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FieldPrimitive.Root>
    );
}

/**
 * An amount and its currency in one input group, bound to two form paths.
 * Label, description and error belong to the amount; a rejected currency
 * marks its select as invalid. Give the currency a default in the schema.
 */
export function MoneyField({
    name,
    currencyName,
    currencies,
    placeholder,
    currencyLabel = 'Валюта',
    currencyPlaceholder,
    disabled,
    ...props
}: MoneyFieldProps): ReactElement {
    return (
        <FormField {...props} disabled={disabled} name={name}>
            {({ field, ...aria }) => (
                <InputGroup>
                    <InputGroupInput
                        {...field}
                        {...aria}
                        autoComplete="off"
                        inputMode="decimal"
                        placeholder={placeholder}
                        value={field.value ?? ''}
                    />
                    <CurrencySelect
                        currencies={currencies}
                        disabled={disabled}
                        label={currencyLabel}
                        name={currencyName}
                        placeholder={currencyPlaceholder}
                    />
                </InputGroup>
            )}
        </FormField>
    );
}
