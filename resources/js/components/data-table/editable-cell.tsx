import type { KeyboardEvent, ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { EditableCellStep } from '@/components/data-table/editable-cells';
import { useEditableCells } from '@/components/data-table/editable-cells';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SAVED_FEEDBACK_MS = 600;

const STEP_BY_KEY: Record<string, EditableCellStep> = {
    ArrowDown: 'down',
    ArrowUp: 'up',
};

export type EditableCellProps = {
    rowId: string;
    columnId: string;
    value: string;
    onCommit: (value: string) => void;
    label: string;
    placeholder?: string;
    className?: string;
};

export function EditableCell({
    rowId,
    columnId,
    value,
    onCommit,
    label,
    placeholder,
    className,
}: EditableCellProps): ReactElement {
    const { editing, start, stop, step } = useEditableCells();
    const [draft, setDraft] = useState(value);
    const [saved, setSaved] = useState(false);
    const handled = useRef(false);

    const isEditing =
        editing?.rowId === rowId && editing?.columnId === columnId;

    useEffect(() => {
        if (isEditing) {
            setDraft(value);
            handled.current = false;
        }
    }, [isEditing, value]);

    useEffect(() => {
        if (!saved) {
            return;
        }

        const timer = setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS);

        return () => clearTimeout(timer);
    }, [saved]);

    const commit = (next: string): void => {
        if (next !== value) {
            onCommit(next);
            setSaved(true);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Escape') {
            handled.current = true;
            setDraft(value);
            stop();

            return;
        }

        if (event.key === 'Enter') {
            handled.current = true;
            commit(draft);
            stop();

            return;
        }

        const direction =
            event.key === 'Tab'
                ? event.shiftKey
                    ? 'previous'
                    : 'next'
                : STEP_BY_KEY[event.key];

        if (!direction) {
            return;
        }

        event.preventDefault();
        handled.current = true;
        commit(draft);
        step({ columnId, rowId }, direction);
    };

    if (isEditing) {
        return (
            <Input
                aria-label={label}
                autoFocus
                className={className}
                onBlur={() => {
                    if (!handled.current) {
                        commit(draft);
                        stop();
                    }
                }}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                size="sm"
                value={draft}
            />
        );
    }

    return (
        <button
            aria-label={value ? undefined : `${label}, пусто`}
            className={cn(
                'flex h-8 w-full items-center rounded-md px-2 text-left transition-colors duration-500 hover:bg-accent sm:h-7',
                saved && 'bg-success/16 duration-0',
                className,
            )}
            data-saved={saved ? '' : undefined}
            onClick={() => start({ columnId, rowId })}
            type="button"
        >
            {value}
        </button>
    );
}
