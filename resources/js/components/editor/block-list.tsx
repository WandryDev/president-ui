import { isOrderedList } from '@platejs/list';
import {
    useTodoListElement,
    useTodoListElementState,
} from '@platejs/list/react';
import type { TListElement } from 'platejs';
import type { PlateElementProps, RenderNodeWrapper } from 'platejs/react';
import { useReadOnly } from 'platejs/react';
import type { ReactElement } from 'react';
import {
    isTodoList,
    isWrappedList,
    listClassName,
    listItemClassName,
    listStyle,
    todoMarkerClassName,
} from '@/components/editor/block-list-static';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

function TodoMarker(props: PlateElementProps): ReactElement {
    const state = useTodoListElementState({ element: props.element });
    const { checkboxProps } = useTodoListElement(state);
    const readOnly = useReadOnly();

    return (
        <span contentEditable={false}>
            <Checkbox
                aria-label="Задача выполнена"
                className={cn(
                    todoMarkerClassName,
                    readOnly && 'pointer-events-none',
                )}
                {...checkboxProps}
            />
        </span>
    );
}

function List(props: PlateElementProps): ReactElement {
    const element = props.element as TListElement;
    const Tag = isOrderedList(element) ? 'ol' : 'ul';

    return (
        <Tag
            className={listClassName}
            start={element.listStart}
            style={listStyle(element)}
        >
            <li className={listItemClassName(element)}>
                {isTodoList(element) ? <TodoMarker {...props} /> : null}
                {props.children}
            </li>
        </Tag>
    );
}

export const BlockList: RenderNodeWrapper = (props) => {
    if (!isWrappedList(props.element)) {
        return;
    }

    return (wrapped) => <List {...wrapped} />;
};
