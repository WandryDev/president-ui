import type { RowData, Table as TableInstance } from '@tanstack/react-table';
import { X } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DataTableFilterOption } from './data-table-faceted-filter';
import { DataTableFacetedFilter } from './data-table-faceted-filter';

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
    className?: string;
};

export function DataTableFilters<TData extends RowData>({
    table,
    filters,
    label = 'Фильтры',
    resetLabel = 'Сбросить',
    className,
}: DataTableFiltersProps<TData>): ReactElement {
    const isFiltered = table.getState().columnFilters.length > 0;

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

            {isFiltered ? (
                <Button
                    onClick={() => table.resetColumnFilters()}
                    size="sm"
                    type="button"
                    variant="ghost"
                >
                    {resetLabel}
                    <X />
                </Button>
            ) : null}
        </div>
    );
}
