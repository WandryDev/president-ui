import type { PlateLeafProps } from 'platejs/react';
import { PlateLeaf } from 'platejs/react';
import type { ReactElement } from 'react';
import { codeLeafClassName } from '@/components/editor/code-node-static';

export function CodeLeaf(props: PlateLeafProps): ReactElement {
    return <PlateLeaf {...props} as="code" className={codeLeafClassName} />;
}
