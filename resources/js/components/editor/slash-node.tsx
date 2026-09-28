import { filterWords } from '@platejs/combobox';
import {
    useComboboxInput,
    useHTMLInputCursorState,
} from '@platejs/combobox/react';
import type { PointRef, TComboboxInputElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useEditorRef } from 'platejs/react';
import type { KeyboardEvent, ReactElement } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { BlockOption } from '@/components/editor/block-menus';
import {
    INSERT_OPTIONS,
    TURN_INTO_OPTIONS,
} from '@/components/editor/block-menus';
import { insertBlock } from '@/components/editor/editor-transforms';
import { cn } from '@/lib/utils';

const SLASH_OPTIONS: BlockOption[] = [
    ...TURN_INTO_OPTIONS,
    ...INSERT_OPTIONS.filter(
        (option) =>
            !TURN_INTO_OPTIONS.some((block) => block.value === option.value),
    ),
];

function matches(option: BlockOption, search: string): boolean {
    if (!search) {
        return true;
    }

    return [option.label, option.value, ...(option.keywords ?? [])].some(
        (term) => filterWords(term, search),
    );
}

function SlashCombobox({
    element,
}: {
    element: TComboboxInputElement;
}): ReactElement {
    const editor = useEditorRef();
    const inputRef = useRef<HTMLInputElement>(null);
    const cursorState = useHTMLInputCursorState(inputRef);
    const insertPoint = useRef<PointRef | null>(null);
    const [search, setSearch] = useState('');
    const [active, setActive] = useState(0);
    const listId = useId();

    useEffect(() => {
        const path = editor.api.findPath(element);
        const point = path ? editor.api.before(path) : undefined;

        if (!point) {
            return;
        }

        const pointRef = editor.api.pointRef(point);

        insertPoint.current = pointRef;

        return () => {
            pointRef.unref();
        };
    }, [editor, element]);

    const { props: inputProps, removeInput } = useComboboxInput({
        autoFocus: true,
        cancelInputOnBlur: true,
        cursorState,
        onCancelInput: (cause) => {
            if (cause !== 'backspace') {
                editor.tf.insertText(`/${search}`, {
                    at: insertPoint.current?.current ?? undefined,
                });
            }
        },
        ref: inputRef,
    });

    const options = useMemo(
        () => SLASH_OPTIONS.filter((option) => matches(option, search)),
        [search],
    );

    useEffect(() => {
        document
            .getElementById(`${listId}-${active}`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [active, listId]);

    const choose = (option: BlockOption | undefined): void => {
        if (!option) {
            return;
        }

        removeInput(true);
        insertBlock(editor, option.value);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();

            const step = event.key === 'ArrowDown' ? 1 : -1;

            setActive((current) =>
                options.length === 0
                    ? 0
                    : (current + step + options.length) % options.length,
            );

            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            choose(options[active]);

            return;
        }

        inputProps.onKeyDown(event);
    };

    return (
        <span className="relative" contentEditable={false}>
            /
            <input
                aria-activedescendant={
                    options[active] ? `${listId}-${active}` : undefined
                }
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded
                aria-label="Поиск блока"
                className="w-24 bg-transparent outline-none"
                onBlur={inputProps.onBlur}
                onChange={(event) => {
                    setSearch(event.target.value);
                    setActive(0);
                }}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                role="combobox"
                value={search}
            />
            <span
                className="absolute top-full left-0 z-50 mt-1 flex max-h-72 w-64 flex-col overflow-y-auto rounded-lg border bg-popover p-1 font-normal text-base text-popover-foreground shadow-lg/5 sm:text-sm"
                id={listId}
                role="listbox"
            >
                {options.length === 0 ? (
                    <span className="px-2 py-1.5 text-muted-foreground">
                        Ничего не найдено
                    </span>
                ) : (
                    options.map((option, index) => (
                        <span
                            aria-selected={index === active}
                            className={cn(
                                'flex min-h-8 cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1 sm:min-h-7 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-80',
                                index === active &&
                                    'bg-accent text-accent-foreground',
                            )}
                            id={`${listId}-${index}`}
                            key={option.value}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                choose(option);
                            }}
                            onMouseEnter={() => setActive(index)}
                            role="option"
                            tabIndex={-1}
                        >
                            {option.icon}
                            {option.label}
                        </span>
                    ))
                )}
            </span>
        </span>
    );
}

export function SlashInputElement(
    props: PlateElementProps<TComboboxInputElement>,
): ReactElement {
    return (
        <PlateElement {...props} as="span">
            <SlashCombobox element={props.element} />
            {props.children}
        </PlateElement>
    );
}
