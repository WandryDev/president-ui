import { Info } from 'lucide-react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import type { ReactElement } from 'react';
import { calloutClassName } from '@/components/editor/callout-node-static';

export function CalloutElement({
    children,
    ...props
}: PlateElementProps): ReactElement {
    return (
        <PlateElement {...props} className={calloutClassName}>
            <span className="select-none" contentEditable={false}>
                <Info
                    aria-hidden
                    className="mt-1.5 size-4 shrink-0 text-muted-foreground"
                />
            </span>
            <div className="min-w-0 flex-1">{children}</div>
        </PlateElement>
    );
}
