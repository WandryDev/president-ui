import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';

export const blockquoteClassName =
    'my-2 border-l-2 border-border pl-6 text-muted-foreground italic';

export function BlockquoteElementStatic(
    props: SlateElementProps,
): ReactElement {
    return (
        <SlateElement
            {...props}
            as="blockquote"
            className={blockquoteClassName}
        />
    );
}
