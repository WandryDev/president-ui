import type { ColumnDef, RowData } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';

export const SELECTION_COLUMN_ID = 'select';

/**
 * The leading checkbox column. Add it to a table's columns to make rows
 * selectable; the selected rows are read from `table.getSelectedRowModel()`.
 *
 * The table it belongs to should define `getRowId`, since selection is stored
 * by row id and the default id is the row's index, which shifts as soon as the
 * data is sorted or reloaded.
 */
export function selectionColumn<TData extends RowData>(
    overrides?: Partial<ColumnDef<TData, unknown>>,
): ColumnDef<TData, unknown> {
    return {
        id: SELECTION_COLUMN_ID,
        size: 40,
        enableSorting: false,
        enableHiding: false,
        meta: { align: 'center' },
        header: ({ table }) => (
            <Checkbox
                aria-label="Select all rows on this page"
                checked={table.getIsAllPageRowsSelected()}
                indeterminate={table.getIsSomePageRowsSelected()}
                onCheckedChange={(checked) => {
                    table.toggleAllPageRowsSelected(checked);
                }}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                aria-label="Select row"
                checked={row.getIsSelected()}
                disabled={!row.getCanSelect()}
                onCheckedChange={(checked) => {
                    row.toggleSelected(checked);
                }}
            />
        ),
        ...overrides,
    };
}
