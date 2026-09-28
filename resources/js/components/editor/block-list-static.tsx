import { isOrderedList } from '@platejs/list';
import { Check } from 'lucide-react';
import type { RenderStaticNodeWrapper, TElement, TListElement } from 'platejs';
import type { SlateRenderElementProps } from 'platejs/static';
import type { CSSProperties, ReactElement } from 'react';
import { cn } from '@/lib/utils';

export const LIST_INDENT = 24;

export function isTodoList(element: TElement): boolean {
    return element.listStyleType === 'todo';
}

export function isBulletList(element: TElement): boolean {
    return (
        Boolean(element.listStyleType) &&
        !isOrderedList(element) &&
        !isTodoList(element)
    );
}

export function isWrappedList(element: TElement): boolean {
    return (
        Boolean(element.listStyleType) &&
        (isOrderedList(element) || isTodoList(element))
    );
}

export function listStyle(element: TElement): CSSProperties {
    const { indent, listStyleType } = element as TListElement & {
        indent?: number;
    };

    return {
        listStyleType: isTodoList(element) ? 'none' : listStyleType,
        paddingLeft: (indent ?? 1) * LIST_INDENT,
    };
}

export const listClassName = 'm-0';

export function listItemClassName(element: TElement): string {
    return cn(
        'relative [&>*]:ml-0!',
        isTodoList(element) &&
            Boolean(element.checked) &&
            'text-muted-foreground line-through',
    );
}

export const todoMarkerClassName = 'absolute top-2 -left-6';

function TodoMarkerStatic({ checked }: { checked: boolean }): ReactElement {
    return (
        <span
            aria-hidden
            className={cn(
                todoMarkerClassName,
                'flex size-4 items-center justify-center rounded-[4px] border border-input bg-background',
                checked && 'border-primary bg-primary text-primary-foreground',
            )}
            contentEditable={false}
        >
            {checked ? <Check className="size-3" /> : null}
        </span>
    );
}

function ListStatic(props: SlateRenderElementProps): ReactElement {
    const element = props.element as TListElement;
    const Tag = isOrderedList(element) ? 'ol' : 'ul';

    return (
        <Tag
            className={listClassName}
            start={element.listStart}
            style={listStyle(element)}
        >
            <li className={listItemClassName(element)}>
                {isTodoList(element) ? (
                    <TodoMarkerStatic checked={Boolean(element.checked)} />
                ) : null}
                {props.children}
            </li>
        </Tag>
    );
}

export const BlockListStatic: RenderStaticNodeWrapper = (props) => {
    if (!isWrappedList(props.element)) {
        return;
    }

    return (wrapped) => <ListStatic {...wrapped} />;
};
