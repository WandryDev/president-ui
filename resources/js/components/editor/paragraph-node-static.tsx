import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';

export const paragraphClassName = 'm-0 px-0 py-1 leading-7';

export function ParagraphElementStatic(props: SlateElementProps): ReactElement {
    return <SlateElement {...props} className={paragraphClassName} />;
}
