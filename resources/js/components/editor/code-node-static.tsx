import type { SlateLeafProps } from 'platejs/static';
import { SlateLeaf } from 'platejs/static';
import type { ReactElement } from 'react';

export const codeLeafClassName =
    'whitespace-pre-wrap rounded-md bg-muted px-[0.3em] py-[0.2em] font-mono text-[0.875em]';

export function CodeLeafStatic(props: SlateLeafProps): ReactElement {
    return <SlateLeaf {...props} as="code" className={codeLeafClassName} />;
}
