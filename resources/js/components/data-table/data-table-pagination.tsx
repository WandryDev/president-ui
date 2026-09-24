import type { RowData, Table } from '@tanstack/react-table';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export type DataTablePaginationProps<TData extends RowData> = {
    table: Table<TData>;
    pageSizeOptions?: number[];
    className?: string;
};

/** Keeps the current size selectable even when a page passes its own options. */
function withCurrentPageSize(options: number[], pageSize: number): number[] {
    if (options.includes(pageSize)) {
        return options;
    }

    return [...options, pageSize].sort((a, b) => a - b);
}

function summarise(
    rowCount: number,
    selectedCount: number,
    firstRow: number,
    lastRow: number,
): string {
    if (selectedCount > 0) {
        return `Выбрано ${selectedCount} из ${rowCount}`;
    }

    if (rowCount === 0) {
        return 'Нет строк';
    }

    return `${firstRow}–${lastRow} из ${rowCount}`;
}

/**
 * The footer below the table: what is on screen, how many rows a page holds and
 * the page controls.
 */
export function DataTablePagination<TData extends RowData>({
    table,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    className,
}: DataTablePaginationProps<TData>) {
    const pageSizeId = useId();
    const { pageIndex, pageSize } = table.getState().pagination;
    const rowCount = table.getRowCount();
    const pageCount = table.getPageCount();
    const selectedCount = table.getSelectedRowModel().rows.length;

    // A server driven table that reports neither a row nor a page count cannot
    // say where the end is, so the jump-to-edge buttons have nowhere to go.
    const hasKnownPageCount = pageCount >= 0;

    const firstRow = pageIndex * pageSize + 1;
    const lastRow = Math.min(firstRow + pageSize - 1, rowCount);

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-3',
                className,
            )}
        >
            <p className="text-muted-foreground text-sm tabular-nums">
                {summarise(rowCount, selectedCount, firstRow, lastRow)}
            </p>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label
                        htmlFor={pageSizeId}
                        className="text-muted-foreground text-sm"
                    >
                        Строк на странице
                    </label>

                    <NativeSelect
                        id={pageSizeId}
                        size="sm"
                        value={pageSize}
                        onChange={(event) => {
                            table.setPageSize(Number(event.target.value));
                        }}
                    >
                        {withCurrentPageSize(pageSizeOptions, pageSize).map(
                            (option) => (
                                <NativeSelectOption key={option} value={option}>
                                    {option}
                                </NativeSelectOption>
                            ),
                        )}
                    </NativeSelect>
                </div>

                <div className="flex items-center gap-2">
                    <p className="text-muted-foreground text-sm tabular-nums">
                        Страница {pageIndex + 1}
                        {hasKnownPageCount
                            ? ` из ${Math.max(pageCount, 1)}`
                            : null}
                    </p>

                    <div className="flex items-center gap-1">
                        {hasKnownPageCount ? (
                            <Button
                                variant="outline"
                                size="icon-sm"
                                aria-label="К первой странице"
                                disabled={!table.getCanPreviousPage()}
                                onClick={() => {
                                    table.setPageIndex(0);
                                }}
                            >
                                <ChevronsLeftIcon aria-hidden="true" />
                            </Button>
                        ) : null}

                        <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="На предыдущую страницу"
                            disabled={!table.getCanPreviousPage()}
                            onClick={() => {
                                table.previousPage();
                            }}
                        >
                            <ChevronLeftIcon aria-hidden="true" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="На следующую страницу"
                            disabled={!table.getCanNextPage()}
                            onClick={() => {
                                table.nextPage();
                            }}
                        >
                            <ChevronRightIcon aria-hidden="true" />
                        </Button>

                        {hasKnownPageCount ? (
                            <Button
                                variant="outline"
                                size="icon-sm"
                                aria-label="К последней странице"
                                disabled={!table.getCanNextPage()}
                                onClick={() => {
                                    table.setPageIndex(pageCount - 1);
                                }}
                            >
                                <ChevronsRightIcon aria-hidden="true" />
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
