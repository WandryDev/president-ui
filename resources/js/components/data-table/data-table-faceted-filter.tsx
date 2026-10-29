import type { Column, RowData } from '@tanstack/react-table';
import type { ReactElement } from 'react';
import type { FacetedFilterOption } from './faceted-filter';
import { FacetedFilter } from './faceted-filter';

export type DataTableFilterOption = FacetedFilterOption;

export type DataTableFacetedFilterProps<TData extends RowData> = {
    column: Column<TData, unknown>;
    label: string;
    options: DataTableFilterOption[];
    className?: string;
};

function selectedValues<TData extends RowData>(
    column: Column<TData, unknown>,
): string[] {
    const value = column.getFilterValue();

    return Array.isArray(value) ? (value as string[]) : [];
}

/** `FacetedFilter` bound to a column's filter value; an empty choice clears the filter. */
export function DataTableFacetedFilter<TData extends RowData>({
    column,
    label,
    options,
    className,
}: DataTableFacetedFilterProps<TData>): ReactElement {
    return (
        <FacetedFilter
            className={className}
            onValueChange={(next) => {
                column.setFilterValue(next.length > 0 ? next : undefined);
            }}
            options={options}
            title={label}
            value={selectedValues(column)}
        />
    );
}
