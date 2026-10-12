import { Field as FieldPrimitive } from '@base-ui/react/field';
import { ChevronsUpDownIcon, GlobeIcon, SearchIcon } from 'lucide-react';
import type {
    ComponentProps,
    ComponentType,
    FocusEventHandler,
    ReactNode,
    Ref,
    SVGProps,
} from 'react';
import type { Country, Labels } from 'react-phone-number-input';
import PhoneNumberInput, {
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
 * country itself. Outside a form use it as is; in a form use `PhoneField`, or
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
    return (
        <PhoneNumberInput
            {...inputProps}
            className={className}
            containerComponent={PhoneInputGroup}
            containerComponentProps={{ addons: children }}
            countries={countries}
            countrySelectComponent={PhoneCountrySelect}
            defaultCountry={defaultCountry}
            initialValueFormat="national"
            inputComponent={InputGroupInput}
            // The component's own `ref` is typed as the class instance; this is
            // the prop it forwards to the `<input>`.
            inputRef={ref}
            labels={labels}
            onChange={(next?: string) => onChange(next ?? '')}
            // Anything else, such as an email left over from another contact
            // kind, is not a number to show; the input starts empty instead.
            value={value.startsWith('+') ? value : undefined}
        />
    );
}
