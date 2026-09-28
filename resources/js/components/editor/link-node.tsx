import { getLinkAttributes } from '@platejs/link';
import type { TLinkElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import type { ReactElement } from 'react';
import { isAllowedLinkUrl } from '@/components/editor/editor-url';
import { linkClassName } from '@/components/editor/link-node-static';

export function LinkElement(
    props: PlateElementProps<TLinkElement>,
): ReactElement {
    return (
        <PlateElement
            {...props}
            as="a"
            attributes={{
                ...props.attributes,
                ...(isAllowedLinkUrl(props.element.url)
                    ? getLinkAttributes(props.editor, props.element)
                    : {}),
                onMouseOver: (event) => {
                    event.stopPropagation();
                },
            }}
            className={linkClassName}
        />
    );
}
