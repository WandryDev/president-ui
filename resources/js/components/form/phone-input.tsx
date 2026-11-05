import { Field as FieldPrimitive } from '@base-ui/react/field';
import { AsYouType } from 'libphonenumber-js/min';
import parseMobileNumber from 'libphonenumber-js/mobile';
import { ChevronsUpDownIcon, GlobeIcon, SearchIcon } from 'lucide-react';
import type {
    ComponentProps,
    ComponentType,
    FocusEventHandler,
    ReactNode,
    Ref,
    SVGProps,
} from 'react';
import { useState } from 'react';
import type { Country, Labels } from 'react-phone-number-input';
import PhoneNumberInputBase, {
    getCountryCallingCode,
} from 'react-phone-number-input';
import embeddedFlags from 'react-phone-number-input/flags';
import ru from 'react-phone-number-input/locale/ru';
import {
    Combobox,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxPopup,
    ComboboxTrigger,
} from '@/components/ui/combobox';
import type { InputProps } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';

export type PhoneInputProps = {
    /** The number in E.164 (`+380671234567`), or `''` while empty. */
    value: string;
    onChange: (value: string) => void;
    onBlur?: FocusEventHandler<HTMLElement>;
    /** The country assumed for a number typed without `+`. */
    defaultCountry?: Country;
    /** Limits the country list. */
    countries?: Country[];
    /** Country names, the list label and «International»; Russian by default. */
    labels?: Labels;
    placeholder?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
    'aria-invalid'?: true;
    'aria-describedby'?: string;
    'aria-label'?: string;
    ref?: Ref<HTMLInputElement>;
    /** Applied to the input group around the country and the number. */
    className?: string;
    /** Rendered in the input group after the number, e.g. an `InputGroupAddon`. */
    children?: ReactNode;
};

/**
 * The library types its flags as taking a `title` only, but every flag spreads
 * the rest of its props onto the `<svg>`. The `size-*` and `opacity-*` classes
 * keep the button's and the item's icon rules off the flag, which would
 * otherwise square and dim it.
 */
const flags = embeddedFlags as Partial<
    Record<Country, ComponentType<SVGProps<SVGSVGElement> & { title: string }>>
>;

/** `value` is empty for the «International» entry. */
type CountryOption = {
    value?: Country;
    label: string;
    divider?: boolean;
};

/** What `react-phone-number-input` hands its `countrySelectComponent`. */
type CountrySelectProps = {
    value?: Country;
    onChange: (country?: Country) => void;
    options: CountryOption[];
    disabled?: boolean;
    readOnly?: boolean;
    'aria-label'?: string;
    onFocus?: FocusEventHandler<HTMLElement>;
    onBlur?: FocusEventHandler<HTMLElement>;
};

function CountryFlag({ country, label }: { country?: Country; label: string }) {
    const Flag = country ? flags[country] : undefined;

    if (!Flag) {
        return <GlobeIcon aria-hidden="true" />;
    }

    return (
        <span
            aria-hidden="true"
            className="flex h-3 w-4.5 shrink-0 overflow-hidden rounded-[2px]"
        >
            <Flag className="size-full opacity-100" title={label} />
        </span>
    );
}

function callingCode(country?: Country): string {
    return country ? `+${getCountryCallingCode(country)}` : '';
}

/** Finds a country by its name or by its calling code, with or without `+`. */
function matchesCountry(option: CountryOption, query: string): boolean {
    const search = query.trim().toLowerCase();

    if (search === '') {
        return true;
    }

    const code = callingCode(option.value);

    return (
        option.label.toLowerCase().includes(search) ||
        (code !== '' &&
            code.startsWith(search.startsWith('+') ? search : `+${search}`))
    );
}

function isSameCountry(option: CountryOption, value: CountryOption): boolean {
    return option.value === value.value;
}

function countryLabel(option: CountryOption): string {
    return option.label;
}

function PhoneCountrySelect({
    value,
    onChange,
    options,
    disabled,
    readOnly,
    'aria-label': ariaLabel,
    onFocus,
    onBlur,
}: CountrySelectProps) {
    const countries = options.filter((option) => !option.divider);
    const selected = countries.find((option) => option.value === value) ?? null;

    // A field of its own: inside the phone's field the combobox would register
    // as that field's control and take over the number input's id and label.
    return (
        <FieldPrimitive.Root render={<InputGroupAddon />}>
            <Combobox
                disabled={disabled || readOnly}
                filter={matchesCountry}
                isItemEqualToValue={isSameCountry}
                itemToStringLabel={countryLabel}
                items={countries}
                onValueChange={(option: CountryOption | null) => {
                    if (option) {
                        onChange(option.value);
                    }
                }}
                value={selected}
            >
                <ComboboxTrigger
                    aria-label={ariaLabel}
                    onBlur={onBlur}
                    onFocus={onFocus}
                    render={<InputGroupButton size="xs" />}
                >
                    <CountryFlag
                        country={selected?.value}
                        label={selected?.label ?? ''}
                    />
                    <ChevronsUpDownIcon aria-hidden="true" />
                </ComboboxTrigger>

                <ComboboxPopup aria-label={ariaLabel} className="w-72">
                    <div className="border-b p-2">
                        <ComboboxInput
                            aria-label="Поиск страны"
                            className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                            placeholder="Страна или код"
                            showTrigger={false}
                            startAddon={<SearchIcon />}
                        />
                    </div>
                    <ComboboxEmpty>Страна не найдена</ComboboxEmpty>
                    <ComboboxList>
                        {(option: CountryOption) => (
                            <ComboboxItem
                                key={option.value ?? 'international'}
                                value={option}
                            >
                                <span className="flex items-center gap-2">
                                    <CountryFlag
                                        country={option.value}
                                        label={option.label}
                                    />
                                    <span className="flex-1 truncate">
                                        {option.label}
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {callingCode(option.value)}
                                    </span>
                                </span>
                            </ComboboxItem>
                        )}
                    </ComboboxList>
                </ComboboxPopup>
            </Combobox>
        </FieldPrimitive.Root>
    );
}

/** What is typed so far: the digits, with the `+` of an international number. */
function typedDigits(text: string): string {
    const digits = text.replace(/\D/g, '');

    return text.trimStart().startsWith('+') ? `+${digits}` : digits;
}

/**
 * How the country's mask shapes the digits. A number the mask cannot take is
 * left bare, past the calling code of an international one.
 */
function readMask(
    digits: string,
    country?: Country,
): { isMasked: boolean; isComplete: boolean } {
    const isInternational = digits.startsWith('+');
    const formatter = new AsYouType(isInternational ? undefined : country);
    const separators = formatter.input(digits).replace(/[\d+]/g, '').length;

    return {
        isComplete: formatter.isPossible(),
        isMasked: separators > (isInternational ? 1 : 0),
    };
}

/**
 * A valid mobile number. The masks only know the lengths a country allows
 * at all, so they take a digit past a full mobile number for the start of a
 * longer one (`098 711 1111` becomes `0987 111 1112`); the mobile plan does not.
 */
function isMobileNumber(digits: string, country?: Country): boolean {
    return (
        parseMobileNumber(
            digits,
            digits.startsWith('+') ? undefined : country,
        )?.isValid() ?? false
    );
}

/**
 * Trailing digits typed past a full mobile number: one that no further digit
 * keeps a mobile number. 0 when the digits hold no such number.
 */
function digitsPastMobileNumber(digits: string, country?: Country): number {
    if (isMobileNumber(digits, country)) {
        return 0;
    }

    for (let length = digits.length - 1; length > 0; length--) {
        const prefix = digits.slice(0, length);

        if (isMobileNumber(prefix, country)) {
            const canGrow = [...'0123456789'].some((digit) =>
                isMobileNumber(prefix + digit, country),
            );

            return canGrow ? 0 : digits.length - length;
        }
    }

    return 0;
}

/**
 * Trailing digits that broke the mask: dropping them gives back a complete
 * number the mask shapes. A number that was never masked, or would come back
 * incomplete, keeps every digit.
 */
function digitsPastMask(digits: string, country?: Country): number {
    if (readMask(digits, country).isMasked) {
        return 0;
    }

    for (let length = digits.length - 1; length > 0; length--) {
        const { isMasked, isComplete } = readMask(
            digits.slice(0, length),
            country,
        );

        if (isMasked) {
            return isComplete ? digits.length - length : 0;
        }
    }

    return 0;
}

/** Trailing digits past a full mobile number, or past the end of the mask. */
function overflowingDigits(digits: string, country?: Country): number {
    return (
        digitsPastMobileNumber(digits, country) ||
        digitsPastMask(digits, country)
    );
}

/**
 * Cuts the digits typed past a full number off the end of what was typed
 * or pasted, and keeps the caret beside the same character. Call it from the
 * input's change handler before a `react-phone-number-input` input reads the
 * value; `PhoneInput` does so itself. A number typed with `+` is read against
 * its own calling code, whatever `country` is. With `smartCaret={false}`, skip
 * the library's handler when the input is left as it was rendered: it reads an
 * unchanged number as an erased separator and drops a digit.
 */
export function dropOverflowingPhoneDigits(
    input: HTMLInputElement,
    country?: Country,
): void {
    let overflow = overflowingDigits(typedDigits(input.value), country);

    if (overflow === 0) {
        return;
    }

    const caret = input.selectionStart ?? input.value.length;
    const characters = [...input.value];
    let newCaret = caret;

    for (
        let index = characters.length - 1;
        index >= 0 && overflow > 0;
        index--
    ) {
        if (/\d/.test(characters[index])) {
            characters.splice(index, 1);
            overflow--;

            if (index < caret) {
                newCaret--;
            }
        }
    }

    input.value = characters.join('');
    input.setSelectionRange(newCaret, newCaret);
}

/** The number input; `maskCountry` is the country whose mask the number is typed against. */
function PhoneNumberInput({
    maskCountry,
    onChange,
    ...props
}: InputProps & { maskCountry?: Country }) {
    return (
        <InputGroupInput
            {...props}
            onChange={(event) => {
                dropOverflowingPhoneDigits(event.target, maskCountry);
                onChange?.(event);
            }}
        />
    );
}

function PhoneInputGroup({
    children,
    addons,
    ...props
}: ComponentProps<'div'> & { addons?: ReactNode }) {
    return (
        <InputGroup {...props}>
            {children}
            {addons}
        </InputGroup>
    );
}

/**
 * A phone number typed against the mask of its country, with the country
 * picked from a searchable list of flags. A number typed with `+` picks the
 * country itself. Digits typed or pasted past the end of the mask are dropped
 * from the end of the number, so the mask never falls back to bare digits.
 * Outside a form use it as is; in a form use `PhoneField`, or
 * this inside a `FormField` that needs more than a label around the control.
 */
export function PhoneInput({
    value,
    onChange,
    defaultCountry,
    countries,
    labels = ru,
    className,
    children,
    ref,
    ...inputProps
}: PhoneInputProps) {
    const [country, setCountry] = useState(defaultCountry);

    return (
        <PhoneNumberInputBase
            {...inputProps}
            className={className}
            containerComponent={PhoneInputGroup}
            containerComponentProps={{ addons: children }}
            countries={countries}
            countrySelectComponent={PhoneCountrySelect}
            defaultCountry={defaultCountry}
            initialValueFormat="national"
            inputComponent={PhoneNumberInput}
            // The component's own `ref` is typed as the class instance; this is
            // the prop it forwards to the `<input>`.
            inputRef={ref}
            labels={labels}
            // A cap for a number no mask shapes; a masked one stops at the
            // end of its mask before this applies.
            limitMaxLength
            numberInputProps={{ maskCountry: country }}
            onChange={(next?: string) => onChange(next ?? '')}
            onCountryChange={setCountry}
            // Anything else, such as an email left over from another contact
            // kind, is not a number to show; the input starts empty instead.
            value={value.startsWith('+') ? value : undefined}
        />
    );
}
