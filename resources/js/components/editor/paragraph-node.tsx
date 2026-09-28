import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import type { ReactElement } from 'react';
import { paragraphClassName } from '@/components/editor/paragraph-node-static';

export function ParagraphElement(props: PlateElementProps): ReactElement {
    return <PlateElement {...props} className={paragraphClassName} />;
}
