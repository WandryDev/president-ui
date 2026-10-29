import type { RowData, Table as TableInstance } from '@tanstack/react-table';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { DataTableFilterOption } from './data-table-faceted-filter';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableResetButton } from './data-table-reset-button';

export type DataTableFilterDef = {
    columnId: string;
    label: string;
    options: DataTableFilterOption[];
};

export type DataTableFiltersProps<TData extends RowData> = {
    table: TableInstance<TData>;
    filters: DataTableFilterDef[];
    label?: string;
    resetLabel?: string;
    /**
     * Whether to offer the reset. Defaults to whether any column filter is
     * set; a server-driven table that also filters by search or dates passes
     * its own answer.
     */
    isFiltered?: boolean;
    /** Replaces clearing the column filters, e.g. a visit without the query. */
    onReset?: () => void;
    /** More filters after the declared ones, e.g. a date range. */
    children?: ReactNode;
    className?: string;
};

export function DataTableFilters<TData extends RowData>({
    table,
    filters,
    label = 'Фильтры',
    resetLabel = 'Сбросить',
    isFiltered: isFilteredOverride,
    onReset,
    children,
    className,
}: DataTableFiltersProps<TData>): ReactElement {
    const isFiltered =
        isFilteredOverride ?? table.getState().columnFilters.length > 0;

    return (
        // biome-ignore lint/a11y/useSemanticElements: a fieldset brings legend semantics and min-content sizing to a toolbar row
        <div
            aria-label={label}
            className={cn('flex flex-wrap items-center gap-2', className)}
            role="group"
        >
            {filters.map((filter) => {
                const column = table.getColumn(filter.columnId);

                if (!column) {
                    return null;
                }

                return (
                    <DataTableFacetedFilter
                        column={column}
                        key={filter.columnId}
                        label={filter.label}
                        options={filter.options}
                    />
                );
            })}

            {children}

            {isFiltered ? (
                <DataTableResetButton
                    label={resetLabel}
                    onReset={onReset ?? (() => table.resetColumnFilters())}
                />
            ) : null}
        </div>
    );
}
