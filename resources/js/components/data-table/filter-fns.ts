import type { Row, RowData } from '@tanstack/react-table';

export function facetedFilterFn<TData extends RowData>(
    row: Row<TData>,
    columnId: string,
    value: unknown,
): boolean {
    if (!Array.isArray(value) || value.length === 0) {
        return true;
    }

    return value.includes(String(row.getValue(columnId)));
}
