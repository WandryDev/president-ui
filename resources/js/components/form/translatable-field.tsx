import type { ComponentProps } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { get, useFormState } from 'react-hook-form';
import { Fieldset, FieldsetLegend } from '@/components/ui/fieldset';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FormField } from './form-field';
import type { FormFieldBaseProps } from './types';

type OwnedInputProps =
    | 'name'
    | 'id'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'onBlur'
    | 'disabled'
    | 'ref';

export type TranslatableFieldLocale = {
    /** The form path holding this locale's text, e.g. `title_en`. */
    name: string;
    /** Shown on the tab and names the input, e.g. `EN`. */
    label: string;
};

export type TranslatableFieldProps = Omit<
    FormFieldBaseProps,
    'name' | 'labelAction' | 'aria-label' | 'orientation'
> &
    Omit<ComponentProps<typeof Input>, OwnedInputProps> & {
        locales: TranslatableFieldLocale[];
        /** The `name` of the locale shown first. Defaults to the first one. */
        defaultLocale?: string;
    };

/**
 * One text in several languages: a tab per locale, each bound to its own form
 * path. Panels stay mounted, so a locale behind another tab keeps its value
 * and its error. Focusing a locale through react-hook-form (`setFocus`, or the
 * focus on the first invalid field) opens its tab first. When a submission or
 * a 422 rejects a locale while a valid tab is open, the field opens it and
 * focuses the input, unless focus already went to an invalid control elsewhere.
 */
export function TranslatableField({
    label,
    description,
    className,
    disabled,
    locales,
    defaultLocale,
    ...inputProps
}: TranslatableFieldProps) {
    const [activeLocale, setActiveLocale] = useState(
        defaultLocale ?? locales[0]?.name,
    );
    const { errors, isSubmitting } = useFormState();
    const shownLocale = useRef(activeLocale);
    const wasSubmitting = useRef(false);
    const inputs = useRef<Record<string, HTMLInputElement | null>>({});
    const pendingFocus = useRef<string | null>(null);
    const descriptionId = useId();

    const invalidLocales = new Set(
        locales
            .filter((locale) => get(errors, locale.name) !== undefined)
            .map((locale) => locale.name),
    );
    const firstInvalidLocale =
        locales.find((locale) => invalidLocales.has(locale.name))?.name ?? null;
    const isActiveLocaleInvalid = invalidLocales.has(activeLocale);

    function openLocale(name: string, focus: boolean): void {
        if (shownLocale.current === name) {
            if (focus) {
                inputs.current[name]?.focus();
            }

            return;
        }

        pendingFocus.current = focus ? name : null;
        shownLocale.current = name;
        setActiveLocale(name);
    }

    useEffect(() => {
        const finishedSubmitting = wasSubmitting.current && !isSubmitting;

        wasSubmitting.current = isSubmitting;

        if (
            !finishedSubmitting ||
            firstInvalidLocale === null ||
            isActiveLocaleInvalid
        ) {
            return;
        }

        const focused = document.activeElement;
        const focusIsOnInvalidField =
            focused instanceof HTMLElement &&
            focused.getAttribute('aria-invalid') === 'true';

        openLocale(firstInvalidLocale, !focusIsOnInvalidField);
    });

    useEffect(() => {
        if (pendingFocus.current !== activeLocale) {
            return;
        }

        pendingFocus.current = null;
        inputs.current[activeLocale]?.focus();
    }, [activeLocale]);

    return (
        <Fieldset
            aria-describedby={description ? descriptionId : undefined}
            className={cn('flex w-full flex-col gap-2', className)}
            data-slot="translatable-field"
            disabled={disabled}
        >
            <Tabs
                className="gap-2"
                onValueChange={(value) => openLocale(String(value), false)}
                value={activeLocale}
            >
                <div className="flex w-full items-center justify-between gap-2">
                    <FieldsetLegend className="inline-flex items-center gap-2 font-medium text-base/4.5 sm:text-sm/4">
                        {label}
                    </FieldsetLegend>

                    <TabsList size="sm">
                        {locales.map((locale) => (
                            <TabsTab
                                data-invalid={
                                    invalidLocales.has(locale.name) || undefined
                                }
                                key={locale.name}
                                value={locale.name}
                            >
                                {locale.label}
                                {invalidLocales.has(locale.name) ? (
                                    <span
                                        aria-hidden
                                        className="size-1.5 rounded-full bg-destructive"
                                    />
                                ) : null}
                            </TabsTab>
                        ))}
                    </TabsList>
                </div>

                {locales.map((locale) => (
                    <TabsPanel
                        key={locale.name}
                        keepMounted
                        value={locale.name}
                    >
                        <FormField
                            aria-label={locale.label}
                            disabled={disabled}
                            name={locale.name}
                        >
                            {({ field, ...aria }) => (
                                <Input
                                    {...inputProps}
                                    {...field}
                                    // react-hook-form focuses a field through
                                    // the ref it was given. Handing it a proxy
                                    // lets that focus open the tab first.
                                    ref={(input) => {
                                        inputs.current[locale.name] = input;
                                        field.ref(
                                            input
                                                ? {
                                                      focus: () =>
                                                          openLocale(
                                                              locale.name,
                                                              true,
                                                          ),
                                                  }
                                                : null,
                                        );
                                    }}
                                    value={field.value ?? ''}
                                    {...aria}
                                />
                            )}
                        </FormField>
                    </TabsPanel>
                ))}
            </Tabs>

            {description ? (
                <p
                    className="text-muted-foreground text-xs"
                    data-slot="field-description"
                    id={descriptionId}
                >
                    {description}
                </p>
            ) : null}
        </Fieldset>
    );
}
