import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DataTableRowActionsProps = {
    /** The menu, buttons, and the dialogs or sheets they open. */
    children: ReactNode;
    align?: 'start' | 'end';
    className?: string;
};

/**
 * The cell of a clickable row that holds its actions. Menus, dialogs and
 * sheets are portalled, but React still bubbles their clicks and keys through
 * this cell to the row, which would open the row as well; this stops them.
 */
export function DataTableRowActions({
    children,
    align = 'end',
    className,
}: DataTableRowActionsProps): ReactElement {
    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: only stops propagation
        <div
            className={cn(
                'flex items-center gap-1',
                align === 'end' && 'justify-end',
                className,
            )}
            data-slot="data-table-row-actions"
            onClick={(event) => {
                event.stopPropagation();
            }}
            onKeyDown={(event) => {
                event.stopPropagation();
            }}
        >
            {children}
        </div>
    );
}
