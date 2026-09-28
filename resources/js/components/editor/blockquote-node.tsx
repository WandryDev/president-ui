import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import type { ReactElement } from 'react';
import { blockquoteClassName } from '@/components/editor/blockquote-node-static';

export function BlockquoteElement(props: PlateElementProps): ReactElement {
    return (
        <PlateElement
            {...props}
            as="blockquote"
            className={blockquoteClassName}
        />
    );
}
