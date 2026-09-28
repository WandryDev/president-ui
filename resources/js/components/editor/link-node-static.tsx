import { getLinkAttributes } from '@platejs/link';
import type { TLinkElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';
import { isAllowedLinkUrl } from '@/components/editor/editor-url';

export const linkClassName =
    'font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary';

export function LinkElementStatic(
    props: SlateElementProps<TLinkElement>,
): ReactElement {
    return (
        <SlateElement
            {...props}
            as="a"
            attributes={{
                ...props.attributes,
                ...(isAllowedLinkUrl(props.element.url)
                    ? getLinkAttributes(props.editor, props.element)
                    : {}),
            }}
            className={linkClassName}
        />
    );
}
