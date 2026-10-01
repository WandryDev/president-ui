import type { ReactNode } from 'react';
import {
    Combobox,
    ComboboxChip,
    ComboboxChips,
    ComboboxChipsInput,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxPopup,
    ComboboxValue,
} from '@/components/ui/combobox';
import { FormField } from './form-field';
import type { FieldControlProps, FormFieldBaseProps } from './types';

export type ComboboxFieldOption = {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
};

export type ComboboxFieldProps = FormFieldBaseProps & {
    options: ComboboxFieldOption[];
    selectedOptions?: ComboboxFieldOption[];
    multiple?: boolean;
    placeholder?: string;
    emptyText?: ReactNode;
    onSearchChange?: (query: string) => void;
};

function optionLabel(option: ComboboxFieldOption): string {
    return option.label;
}

function isSameOption(
    option: ComboboxFieldOption,
    value: ComboboxFieldOption,
): boolean {
    return option.value === value.value;
}

function OptionRows({ emptyText }: { emptyText: ReactNode }) {
    return (
        <ComboboxPopup>
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            <ComboboxList>
                {(option: ComboboxFieldOption) => (
                    <ComboboxItem
                        disabled={option.disabled}
                        key={option.value}
                        value={option}
                    >
                        <span>{option.label}</span>
                        {option.description ? (
                            <span className="block text-muted-foreground text-xs">
                                {option.description}
                            </span>
                        ) : null}
                    </ComboboxItem>
                )}
            </ComboboxList>
        </ComboboxPopup>
    );
}

function ChipsControl({
    aria,
    placeholder,
    inputRef,
    onBlur,
}: {
    aria: FieldControlProps;
    placeholder?: string;
    inputRef: (element: HTMLInputElement | null) => void;
    onBlur: () => void;
}) {
    return (
        <ComboboxChips>
            <ComboboxValue>
                {(selected: ComboboxFieldOption[]) => (
                    <>
                        {selected.map((option) => (
                            <ComboboxChip
                                key={option.value}
                                removeProps={{
                                    'aria-label': `Убрать «${option.label}»`,
                                }}
                            >
                                {option.label}
                            </ComboboxChip>
                        ))}
                        <ComboboxChipsInput
                            {...aria}
                            onBlur={onBlur}
                            placeholder={
                                selected.length === 0 ? placeholder : undefined
                            }
                            ref={inputRef}
                        />
                    </>
                )}
            </ComboboxValue>
        </ComboboxChips>
    );
}

export function ComboboxField({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    options,
    selectedOptions,
    multiple = false,
    placeholder,
    emptyText = 'Ничего не найдено',
    onSearchChange,
}: ComboboxFieldProps) {
    const known = new Map(
        [...(selectedOptions ?? []), ...options].map((option) => [
            option.value,
            option,
        ]),
    );

    const toOption = (value: string): ComboboxFieldOption =>
        known.get(value) ?? { label: value, value };

    const shared = {
        filter: onSearchChange ? null : undefined,
        isItemEqualToValue: isSameOption,
        itemToStringLabel: optionLabel,
        items: options,
        onInputValueChange: onSearchChange,
    };

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
            {({ field, ...aria }) =>
                multiple ? (
                    <Combobox
                        {...shared}
                        disabled={field.disabled}
                        multiple
                        onValueChange={(selected: ComboboxFieldOption[]) =>
                            field.onChange(
                                selected.map((option) => option.value),
                            )
                        }
                        value={((field.value ?? []) as string[]).map(toOption)}
                    >
                        <ChipsControl
                            aria={aria}
                            inputRef={field.ref}
                            onBlur={field.onBlur}
                            placeholder={placeholder}
                        />
                        <OptionRows emptyText={emptyText} />
                    </Combobox>
                ) : (
                    <Combobox
                        {...shared}
                        disabled={field.disabled}
                        onValueChange={(selected: ComboboxFieldOption | null) =>
                            field.onChange(selected?.value ?? '')
                        }
                        value={field.value ? toOption(field.value) : null}
                    >
                        <ComboboxInput
                            {...aria}
                            onBlur={field.onBlur}
                            placeholder={placeholder}
                            ref={field.ref}
                            showClear={Boolean(field.value)}
                            clearProps={{ 'aria-label': 'Очистить' }}
                        />
                        <OptionRows emptyText={emptyText} />
                    </Combobox>
                )
            }
        </FormField>
    );
}
