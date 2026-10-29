import type { ReactElement, ReactNode } from 'react';
import { useState } from 'react';
import type {
    ComboboxFieldOption,
    ComboboxFieldProps,
    ComboboxFieldSearchDetails,
} from '@/components/form/combobox-field';
import { ComboboxField } from '@/components/form/combobox-field';
import type { AsyncOptionsSearch } from '@/components/form/use-async-options';
import { useAsyncOptions } from '@/components/form/use-async-options';

export type AsyncComboboxFieldProps = Omit<
    ComboboxFieldProps,
    'options' | 'onSearchChange' | 'onOpenChange'
> & {
    /** Options for the typed query; see `useAsyncOptions`. */
    search: AsyncOptionsSearch<ComboboxFieldOption>;
    debounceMs?: number;
    minQueryLength?: number;
    /** Lists options as soon as the popup opens, before anything is typed. */
    loadWithoutQuery?: boolean;
    /** Changing it drops the options and searches again. */
    scope?: string | number | null;
    /** Shown while a search is running and nothing is listed yet. */
    loadingText?: ReactNode;
    /** Shown while the query is too short to search. */
    idleText?: ReactNode;
    /** Shown when the last search failed. */
    errorText?: ReactNode;
};

function mergeOptions(
    known: ComboboxFieldOption[],
    found: ComboboxFieldOption[],
): ComboboxFieldOption[] {
    const byValue = new Map(known.map((option) => [option.value, option]));

    for (const option of found) {
        byValue.set(option.value, option);
    }

    return [...byValue.values()];
}

/** Typing, or clearing what was typed; not the label a picked option writes into the input. */
function isTypedQuery(details: ComboboxFieldSearchDetails): boolean {
    if (details.isItemPress) {
        return false;
    }

    return (
        details.reason === 'input-change' ||
        details.reason === 'input-clear' ||
        details.reason === 'clear-press'
    );
}

/**
 * `ComboboxField` with options searched as the user types. The app passes
 * `search` and owns the request; the field debounces, drops superseded
 * answers, and remembers the label of every option it has seen, so a chosen
 * value keeps its label after the search moves on.
 */
export function AsyncComboboxField({
    search,
    debounceMs,
    minQueryLength,
    loadWithoutQuery = false,
    scope,
    selectedOptions,
    emptyText = 'Ничего не найдено',
    loadingText = 'Ищем…',
    idleText = 'Начните вводить',
    errorText = 'Не удалось загрузить варианты',
    ...props
}: AsyncComboboxFieldProps): ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const [seen, setSeen] = useState<ComboboxFieldOption[]>([]);

    const { options, status, setQuery } = useAsyncOptions({
        debounceMs,
        enabled: isOpen,
        loadWithoutQuery,
        minQueryLength,
        scope,
        search: (query, signal) =>
            search(query, signal).then((found) => {
                setSeen((known) => mergeOptions(known, found));

                return found;
            }),
    });

    const statusText: Record<typeof status, ReactNode> = {
        error: errorText,
        idle: idleText,
        loading: loadingText,
        success: emptyText,
    };

    return (
        <ComboboxField
            {...props}
            emptyText={statusText[status]}
            onOpenChange={(open) => {
                setIsOpen(open);

                if (!open) {
                    setQuery('');
                }
            }}
            onSearchChange={(typed, details) => {
                if (isTypedQuery(details)) {
                    setQuery(typed);
                }
            }}
            options={options}
            selectedOptions={mergeOptions(selectedOptions ?? [], seen)}
        />
    );
}
