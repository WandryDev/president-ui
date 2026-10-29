import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { DataTableResetButton } from './data-table-reset-button';

export type DataTableToolbarProps = {
    /** Filters and search, laid out from the start of the row. */
    children?: ReactNode;
    /** Buttons pushed to the end of the row — "Add", the column menu, an export. */
    actions?: ReactNode;
    /**
     * Ends the filters with a reset. Pass it for filters the table does not
     * own — query parameters of a server-driven list.
     */
    onReset?: () => void;
    /** Shows the reset only while true. */
    isFiltered?: boolean;
    resetLabel?: string;
    className?: string;
};

/** The row above the table. Pass it to `DataTable` as its `toolbar`. */
export function DataTableToolbar({
    children,
    actions,
    onReset,
    isFiltered = true,
    resetLabel,
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

                {onReset && isFiltered ? (
                    <DataTableResetButton
                        label={resetLabel}
                        onReset={onReset}
                    />
                ) : null}
            </div>

            {actions ? (
                <div className="flex items-center gap-2">{actions}</div>
            ) : null}
        </div>
    );
}
