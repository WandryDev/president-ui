import { Field as FieldPrimitive } from '@base-ui/react/field';
import type { ChangeEvent, ReactElement } from 'react';
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

const GROUP_SEPARATOR = ' ';

const SIGNIFICANT = /[\d.,]/;

/**
 * Digits of an amount grouped by thousands, the first decimal mark kept as
 * typed: «85000,5» → «85 000,5». Anything but digits and that mark is dropped.
 */
function groupAmount(value: string): string {
    const cleaned = value.replace(/[^\d.,]/g, '');
    const markAt = cleaned.search(/[.,]/);
    const whole = markAt === -1 ? cleaned : cleaned.slice(0, markAt);
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);

    if (markAt === -1) {
        return grouped;
    }

    const fraction = cleaned.slice(markAt + 1).replace(/[.,]/g, '');

    return `${grouped}${cleaned[markAt]}${fraction}`;
}

function significantBefore(value: string, position: number): number {
    return [...value.slice(0, position)].filter((char) =>
        SIGNIFICANT.test(char),
    ).length;
}

function positionAfterSignificant(value: string, count: number): number {
    let seen = 0;

    for (let index = 0; index < value.length; index++) {
        if (seen === count) {
            return index;
        }

        if (SIGNIFICANT.test(value[index])) {
            seen++;
        }
    }

    return value.length;
}

/**
 * Regroups the typed amount and puts the caret back after the same digit.
 * Deleting a separator alone would change nothing, so it takes the digit
 * beside it with it.
 */
function regroup(event: ChangeEvent<HTMLInputElement>, shown: string): string {
    const input = event.target;
    const { inputType } = event.nativeEvent as InputEvent;
    let raw = input.value;
    let caret = input.selectionStart ?? raw.length;

    if (
        groupAmount(raw) === shown &&
        raw.length === shown.length - 1 &&
        (inputType === 'deleteContentBackward' ||
            inputType === 'deleteContentForward')
    ) {
        const at = inputType === 'deleteContentBackward' ? caret - 1 : caret;

        raw = raw.slice(0, Math.max(at, 0)) + raw.slice(at + 1);
        caret = Math.max(at, 0);
    }

    const next = groupAmount(raw);
    const nextCaret = positionAfterSignificant(
        next,
        significantBefore(raw, caret),
    );

    // Written before React re-renders, so it finds the same value and leaves the caret alone.
    input.value = next;
    input.setSelectionRange(nextCaret, nextCaret);

    return next;
}

/**
 * An amount and its currency in one input group, bound to two form paths.
 * Label, description and error belong to the amount; a rejected currency
 * marks its select as invalid. Give the currency a default in the schema.
 * The amount is grouped by thousands as it is typed.
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
        <FormField
            {...props}
            disabled={disabled}
            // The currency select has no message of its own under the group.
            includeErrorsOf={[currencyName]}
            name={name}
        >
            {({ field, ...aria }) => {
                const shown = groupAmount(field.value ?? '');

                return (
                    <InputGroup>
                        <InputGroupInput
                            {...field}
                            {...aria}
                            autoComplete="off"
                            inputMode="decimal"
                            onChange={(event) => {
                                field.onChange(regroup(event, shown));
                            }}
                            placeholder={placeholder}
                            value={shown}
                        />
                        <CurrencySelect
                            currencies={currencies}
                            disabled={disabled}
                            label={currencyLabel}
                            name={currencyName}
                            placeholder={currencyPlaceholder}
                        />
                    </InputGroup>
                );
            }}
        </FormField>
    );
}
