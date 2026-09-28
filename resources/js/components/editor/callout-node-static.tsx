import { Info } from 'lucide-react';
import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';

export const calloutClassName =
    'my-2 flex gap-3 rounded-lg border bg-muted/60 px-4 py-3';

export function CalloutElementStatic({
    children,
    ...props
}: SlateElementProps): ReactElement {
    return (
        <SlateElement {...props} className={calloutClassName}>
            <Info
                aria-hidden
                className="mt-1.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 flex-1">{children}</div>
        </SlateElement>
    );
}
