import type {
    Column,
    Header,
    Row,
    RowData,
    Table as TableInstance,
} from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTablePagination } from './data-table-pagination';
import type { DataTableAlign } from './types';
import type { UseDataTableOptions } from './use-data-table';
import { useDataTable } from './use-data-table';

const alignClasses: Record<DataTableAlign, string> = {
    start: 'text-left',
    center: 'text-center',
    end: 'text-right',
};

export type DataTableBaseProps<TData extends RowData> = {
    /** Rendered above the table — a search box, filters, bulk actions. */
    toolbar?: ReactNode;
    caption?: ReactNode;
    /** Swaps the rows for skeletons while the page waits for its data. */
    isLoading?: boolean;
    /** Defaults to a full page of skeletons. */
    skeletonRows?: number;
    /** Replaces the block shown when the table has no rows. */
    empty?: ReactNode;
    onRowClick?: (row: Row<TData>) => void;
    /** Hides the footer holding the page controls. */
    pagination?: boolean;
    pageSizeOptions?: number[];
    /** Drops the table's own border when the surface around it supplies one. */
    bordered?: boolean;
    fill?: boolean;
    footer?: ReactNode;
    className?: string;
};

type ProvidedDataTableProps<TData extends RowData> =
    DataTableBaseProps<TData> & {
        /** An existing instance from `useDataTable`, for pages that need its state outside the markup. */
        table: TableInstance<TData>;
    };

type ManagedDataTableProps<TData extends RowData> = DataTableBaseProps<TData> &
    UseDataTableOptions<TData> & { table?: undefined };

export type DataTableProps<TData extends RowData> =
    | ProvidedDataTableProps<TData>
    | ManagedDataTableProps<TData>;

function alignClassName<TData extends RowData>(
    column: Column<TData, unknown>,
): string {
    return alignClasses[column.columnDef.meta?.align ?? 'start'];
}

/** A width is only forced when the column asked for one. */
function widthStyle<TData extends RowData>(column: Column<TData, unknown>) {
    const { size } = column.columnDef;

    return size === undefined ? undefined : { width: size };
}

function ariaSort<TData extends RowData>(
    column: Column<TData, unknown>,
): 'ascending' | 'descending' | 'none' | undefined {
    if (!column.getCanSort()) {
        return undefined;
    }

    const sorted = column.getIsSorted();

    if (sorted === 'asc') {
        return 'ascending';
    }

    return sorted === 'desc' ? 'descending' : 'none';
}

/**
 * A clickable row must not swallow the controls inside it: a checkbox, a link
 * or a row action would otherwise fire and open the row at the same time.
 */
function startedOnControl(event: { target: EventTarget | null }): boolean {
    return (
        event.target instanceof Element &&
        event.target.closest(
            'a, button, input, select, textarea, [role="checkbox"], [role="menuitem"]',
        ) !== null
    );
}

function DataTableHeadCell<TData extends RowData>({
    header,
}: {
    header: Header<TData, unknown>;
}) {
    const { column } = header;
    const meta = column.columnDef.meta;

    if (header.isPlaceholder) {
        return <TableHead colSpan={header.colSpan} />;
    }

    const content = flexRender(column.columnDef.header, header.getContext());

    return (
        <TableHead
            colSpan={header.colSpan}
            aria-sort={ariaSort(column)}
            style={widthStyle(column)}
            className={cn(alignClassName(column), meta?.headerClassName)}
        >
            {column.getCanSort() ? (
                <DataTableColumnHeader column={column}>
                    {content}
                </DataTableColumnHeader>
            ) : (
                content
            )}
        </TableHead>
    );
}

function DataTableView<TData extends RowData>({
    table,
    toolbar,
    caption,
    isLoading = false,
    skeletonRows,
    empty,
    onRowClick,
    pagination = true,
    pageSizeOptions,
    bordered = true,
    fill = false,
    footer,
    className,
}: ProvidedDataTableProps<TData>) {
    const columns = table.getVisibleLeafColumns();
    const rows = table.getRowModel().rows;

    const { columnFilters, globalFilter } = table.getState();
    const isFiltered = columnFilters.length > 0 || Boolean(globalFilter);
    const isEmpty = !isLoading && rows.length === 0;

    const placeholderRowIds = Array.from(
        { length: skeletonRows ?? table.getState().pagination.pageSize },
        (_, index) => `skeleton-row-${index}`,
    );

    const handleRowClick = (event: MouseEvent, row: Row<TData>) => {
        if (startedOnControl(event)) {
            return;
        }

        onRowClick?.(row);
    };

    const handleRowKeyDown = (event: KeyboardEvent, row: Row<TData>) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        if (startedOnControl(event)) {
            return;
        }

        event.preventDefault();
        onRowClick?.(row);
    };

    return (
        <div
            className={cn(
                'flex flex-col gap-3',
                fill && 'h-full min-h-0',
                className,
            )}
        >
            {toolbar}

            <div
                className={cn(
                    'flex flex-col overflow-hidden',
                    fill && 'min-h-0 flex-1',
                    bordered && 'rounded-xl border',
                )}
            >
                <Table
                    aria-busy={isLoading}
                    className={cn(fill && isEmpty && 'h-full')}
                    render={
                        fill ? (
                            <div className="h-full overflow-auto overscroll-none" />
                        ) : undefined
                    }
                >
                    {caption ? <TableCaption>{caption}</TableCaption> : null}

                    <TableHeader
                        className={cn(
                            'bg-background [&_th]:bg-secondary',
                            fill &&
                                'sticky top-0 z-10 [&_th]:border-b [&_tr]:border-b-0',
                        )}
                    >
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow
                                key={headerGroup.id}
                                className="hover:bg-transparent"
                            >
                                {headerGroup.headers.map((header) => (
                                    <DataTableHeadCell
                                        key={header.id}
                                        header={header}
                                    />
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            placeholderRowIds.map((rowId) => (
                                <TableRow
                                    key={rowId}
                                    className="hover:bg-transparent"
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column.id}>
                                            <Skeleton className="h-4 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : rows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={columns.length}
                                    className="whitespace-normal p-0"
                                >
                                    {empty ?? (
                                        <Empty className="border-0">
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    Ничего не найдено
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    {isFiltered
                                                        ? 'Попробуйте изменить запрос или сбросить фильтры.'
                                                        : 'Здесь пока нет ни одной строки.'}
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected()
                                            ? 'selected'
                                            : undefined
                                    }
                                    className={
                                        onRowClick
                                            ? 'cursor-pointer'
                                            : undefined
                                    }
                                    tabIndex={onRowClick ? 0 : undefined}
                                    onClick={
                                        onRowClick
                                            ? (event) => {
                                                  handleRowClick(event, row);
                                              }
                                            : undefined
                                    }
                                    onKeyDown={
                                        onRowClick
                                            ? (event) => {
                                                  handleRowKeyDown(event, row);
                                              }
                                            : undefined
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={widthStyle(cell.column)}
                                            className={cn(
                                                alignClassName(cell.column),
                                                cell.column.columnDef.meta
                                                    ?.cellClassName,
                                            )}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {footer ? (
                    <div className="shrink-0 border-t bg-background">
                        {footer}
                    </div>
                ) : null}
            </div>

            {pagination ? (
                <DataTablePagination
                    table={table}
                    pageSizeOptions={pageSizeOptions}
                />
            ) : null}
        </div>
    );
}

function ManagedDataTable<TData extends RowData>({
    toolbar,
    caption,
    isLoading,
    skeletonRows,
    empty,
    onRowClick,
    pagination,
    pageSizeOptions,
    bordered,
    className,
    ...options
}: ManagedDataTableProps<TData>) {
    const table = useDataTable<TData>(options);

    return (
        <DataTableView
            table={table}
            toolbar={toolbar}
            caption={caption}
            isLoading={isLoading}
            skeletonRows={skeletonRows}
            empty={empty}
            onRowClick={onRowClick}
            pagination={pagination}
            pageSizeOptions={pageSizeOptions}
            bordered={bordered}
            className={className}
        />
    );
}

/**
 * Renders the table chrome around a TanStack instance: header cells with their
 * sort control and `aria-sort`, the rows, a loading and an empty state, and the
 * page controls. Builds the instance itself unless one is passed in.
 *
 * Column definitions stay plain: alignment, a hidden-column label and extra
 * classes travel in `meta`, and the sort affordance is added here rather than
 * in every column's `header`.
 */
export function DataTable<TData extends RowData>(props: DataTableProps<TData>) {
    if (props.table) {
        return <DataTableView {...props} />;
    }

    return <ManagedDataTable {...props} />;
}
