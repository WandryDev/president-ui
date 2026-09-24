import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DataTableToolbarProps = {
    /** Filters and search, laid out from the start of the row. */
    children?: ReactNode;
    /** Buttons pushed to the end of the row — "Add", the column menu, an export. */
    actions?: ReactNode;
    className?: string;
};

/** The row above the table. Pass it to `DataTable` as its `toolbar`. */
export function DataTableToolbar({
    children,
    actions,
    className,
}: DataTableToolbarProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-2',
                className,
            )}
        >
            <div className="flex flex-1 flex-wrap items-center gap-2">
                {children}
            </div>

            {actions ? (
                <div className="flex items-center gap-2">{actions}</div>
            ) : null}
        </div>
    );
}
