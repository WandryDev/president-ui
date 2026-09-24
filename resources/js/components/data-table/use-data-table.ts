import type { RowData, Table, TableOptions } from '@tanstack/react-table';
import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';

export const DEFAULT_PAGE_SIZE = 10;

/** The row models belong to the hook; everything else is passed straight through. */
type OwnedOptions =
    | 'getCoreRowModel'
    | 'getSortedRowModel'
    | 'getFilteredRowModel'
    | 'getPaginationRowModel';

export type UseDataTableOptions<TData extends RowData> = Omit<
    TableOptions<TData>,
    OwnedOptions
> & {
    /** Rows per page before the user changes it. Ignored once `state.pagination` is controlled. */
    pageSize?: number;
};

/**
 * Builds the TanStack table instance the components render. Sorting, filtering
 * and pagination run in the browser by default; setting the matching `manual*`
 * option hands that job to the server, and the row model is then left out so
 * the current page is not sorted or sliced a second time.
 *
 * Any TanStack option can be passed through, so a feature table can control a
 * slice of state — a page index kept in the URL, for one — by supplying
 * `state` and the matching `on*Change` callback. A `manualPagination` table
 * should also pass `rowCount`: without it only the rows of the current page can
 * be counted, and the footer reports a single page.
 *
 * Pass `getRowId` whenever rows are selectable: selection is keyed by row id,
 * and the default id is the row's index, which moves when the data reloads.
 */
export function useDataTable<TData extends RowData>({
    pageSize = DEFAULT_PAGE_SIZE,
    initialState,
    ...options
}: UseDataTableOptions<TData>): Table<TData> {
    return useReactTable({
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: options.manualSorting
            ? undefined
            : getSortedRowModel(),
        getFilteredRowModel: options.manualFiltering
            ? undefined
            : getFilteredRowModel(),
        getPaginationRowModel: options.manualPagination
            ? undefined
            : getPaginationRowModel(),
        ...options,
        initialState: {
            ...initialState,
            pagination: {
                pageIndex: 0,
                pageSize,
                ...initialState?.pagination,
            },
        },
    });
}
