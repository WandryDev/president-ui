import type { ColumnDef, RowData } from '@tanstack/react-table';

export type DataTableAlign = 'start' | 'center' | 'end';

declare module '@tanstack/react-table' {
    /**
     * Extra column configuration the table chrome reads. Augmented here so a
     * column definition can carry it without a cast at the call site.
     */
    interface ColumnMeta<TData extends RowData, TValue> {
        /** Horizontal alignment of the header and of every cell in the column. */
        align?: DataTableAlign;
        headerClassName?: string;
        cellClassName?: string;
        /** Names the column in the visibility menu when `header` is not a string. */
        label?: string;
    }
}

export type DataTableColumn<
    TData extends RowData,
    TValue = unknown,
> = ColumnDef<TData, TValue>;
