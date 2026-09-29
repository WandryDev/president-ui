import type {
    Column,
    Header,
    Row,
    RowData,
    Table as TableInstance,
} from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { ChevronsLeftRight, ChevronsRightLeft } from 'lucide-react';
import type {
    CSSProperties,
    KeyboardEvent,
    MouseEvent,
    ReactNode,
} from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTablePagination } from './data-table-pagination';
import type { DataTableAlign } from './types';

export type DataTableMiddleTruncateProps<TData extends RowData> = {
    /**
     * The instance to render. Columns pinned left form the start, columns
     * pinned right form the end, and every other column is the middle.
     */
    table: TableInstance<TData>;
    /** Names the middle in the header row above it. */
    middleLabel?: string;
    /** Accessible name of the control that shows the middle. */
    expandLabel?: string;
    /** Accessible name of the control that hides the middle. */
    collapseLabel?: string;
    /** Whether the middle starts out shown. Ignored once `expanded` is set. */
    defaultExpanded?: boolean;
    expanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    /** Width of the rail the hidden middle collapses into. */
    railWidth?: number;
    toolbar?: ReactNode;
    empty?: ReactNode;
    onRowClick?: (row: Row<TData>) => void;
    pagination?: boolean;
    pageSizeOptions?: number[];
    className?: string;
};

type Zone = 'start' | 'middle' | 'end';

const alignClasses: Record<DataTableAlign, string> = {
    start: 'text-left',
    center: 'text-center',
    end: 'text-right',
};

/**
 * Pinned cells lie over the scrolling ones, so their background has to be
 * opaque and has to follow the row's hover and selected tints by itself.
 */
const pinnedCellClassName =
    'sticky z-10 bg-background in-[tr:hover]:bg-[color-mix(in_srgb,var(--background),var(--color-black)_2%)] in-data-[state=selected]:bg-[color-mix(in_srgb,var(--background),var(--color-black)_4%)] dark:in-[tr:hover]:bg-[color-mix(in_srgb,var(--background),var(--color-white)_2%)] dark:in-data-[state=selected]:bg-[color-mix(in_srgb,var(--background),var(--color-white)_4%)]';

/** Keeps the label of the middle clear of the edge of the start zone. */
const MIDDLE_LABEL_INSET = 8;

function startedOnControl(event: { target: EventTarget | null }): boolean {
    return (
        event.target instanceof Element &&
        event.target.closest(
            'a, button, input, select, textarea, [role="checkbox"], [role="menuitem"]',
        ) !== null
    );
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
 * `offsetWidth` rounds to whole pixels, and pinned columns placed by rounded
 * widths leave a hairline gap the scrolled middle shows through.
 */
function cellWidth(cell: HTMLTableCellElement | null | undefined): number {
    return cell?.getBoundingClientRect().width ?? 0;
}

/**
 * A table whose middle columns fold away. The start and the end stay on
 * screen and pinned while the middle scrolls between them; a control in the
 * header row hides the whole middle into a narrow rail and brings it back.
 * Rows, their order and their height do not change when it folds.
 *
 * The zones come from TanStack column pinning — pass
 * `initialState: { columnPinning: { left, right } }` to `useDataTable`.
 * Sorting, the column menu and row clicks work as in `DataTable`.
 */
export function DataTableMiddleTruncate<TData extends RowData>({
    table,
    middleLabel = 'More columns',
    expandLabel = 'Show columns',
    collapseLabel = 'Hide columns',
    defaultExpanded = false,
    expanded: controlledExpanded,
    onExpandedChange,
    railWidth = 32,
    toolbar,
    empty,
    onRowClick,
    pagination = true,
    pageSizeOptions,
    className,
}: DataTableMiddleTruncateProps<TData>) {
    const [uncontrolledExpanded, setUncontrolledExpanded] =
        useState(defaultExpanded);
    const expanded = controlledExpanded ?? uncontrolledExpanded;

    const setExpanded = (next: boolean): void => {
        setUncontrolledExpanded(next);
        onExpandedChange?.(next);
    };

    const start = table.getLeftVisibleLeafColumns();
    const middle = table.getCenterVisibleLeafColumns();
    const end = table.getRightVisibleLeafColumns();
    const rows = table.getRowModel().rows;
    const hasMiddle = middle.length > 0;
    const showsMiddle = hasMiddle && expanded;
    const showsRail = hasMiddle && !expanded;

    const headers = table.getLeafHeaders();
    const headersOf = (columns: Column<TData, unknown>[]) =>
        columns.flatMap((column) =>
            headers.filter((header) => header.column.id === column.id),
        );

    const tableRef = useRef<HTMLTableElement>(null);
    const headRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
    const [offsets, setOffsets] = useState<{
        left: Record<string, number>;
        right: Record<string, number>;
        startWidth: number;
    }>({ left: {}, right: {}, startWidth: 0 });

    const layoutKey = [
        ...start.map((column) => column.id),
        showsMiddle ? 'middle' : 'rail',
        ...end.map((column) => column.id),
    ].join('|');

    // biome-ignore lint/correctness/useExhaustiveDependencies: layoutKey stands for the pinned columns the effect measures
    useLayoutEffect(() => {
        const measure = (): void => {
            const left: Record<string, number> = {};
            const right: Record<string, number> = {};
            let offset = 0;

            for (const column of start) {
                left[column.id] = offset;
                offset += cellWidth(headRefs.current[column.id]);
            }

            const startWidth = offset;
            offset = 0;

            for (const column of [...end].reverse()) {
                right[column.id] = offset;
                offset += cellWidth(headRefs.current[column.id]);
            }

            const next = { left, right, startWidth };

            setOffsets((current) =>
                JSON.stringify(current) === JSON.stringify(next)
                    ? current
                    : next,
            );
        };

        measure();

        const element = tableRef.current;

        if (!element || typeof ResizeObserver === 'undefined') {
            return;
        }

        const observer = new ResizeObserver(measure);
        observer.observe(element);

        return () => observer.disconnect();
    }, [layoutKey]);

    const lastStart = start.at(-1)?.id;
    const firstEnd = end[0]?.id;

    const zoneOf = (column: Column<TData, unknown>): Zone => {
        const pinned = column.getIsPinned();

        if (pinned === 'left') {
            return 'start';
        }

        return pinned === 'right' ? 'end' : 'middle';
    };

    const cellLayout = (
        column: Column<TData, unknown>,
    ): { className: string; style: CSSProperties } => {
        const zone = zoneOf(column);

        return {
            className: cn(
                'border-b',
                alignClasses[column.columnDef.meta?.align ?? 'start'],
                zone !== 'middle' && pinnedCellClassName,
                zone === 'middle' && 'fade-in-0 animate-in duration-150',
                column.id === lastStart && 'border-e',
                column.id === firstEnd && 'border-s',
            ),
            style: {
                left: zone === 'start' ? offsets.left[column.id] : undefined,
                right: zone === 'end' ? offsets.right[column.id] : undefined,
                width: column.columnDef.size,
            },
        };
    };

    const railStyle: CSSProperties = {
        maxWidth: railWidth,
        minWidth: railWidth,
        width: railWidth,
    };

    const headCell = (header: Header<TData, unknown>) => {
        const { column } = header;
        const layout = cellLayout(column);
        const content = flexRender(
            column.columnDef.header,
            header.getContext(),
        );

        return (
            <TableHead
                aria-sort={ariaSort(column)}
                className={cn(
                    layout.className,
                    column.columnDef.meta?.headerClassName,
                )}
                key={header.id}
                ref={(element) => {
                    headRefs.current[column.id] = element;
                }}
                style={layout.style}
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
    };

    const handleRowClick = (event: MouseEvent, row: Row<TData>): void => {
        if (!startedOnControl(event)) {
            onRowClick?.(row);
        }
    };

    const handleRowKeyDown = (event: KeyboardEvent, row: Row<TData>): void => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        if (startedOnControl(event)) {
            return;
        }

        event.preventDefault();
        onRowClick?.(row);
    };

    const columnCount =
        start.length + end.length + (showsMiddle ? middle.length : 1);

    const expandName = `${expandLabel}: ${middleLabel} (${middle.length})`;

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            {toolbar}

            <div className="overflow-hidden rounded-xl border">
                <Table
                    className="border-separate border-spacing-0"
                    ref={tableRef}
                >
                    <TableHeader className="[&_th]:bg-secondary [&_tr]:border-b-0">
                        <TableRow className="hover:bg-transparent">
                            {start.length > 0 ? (
                                <TableHead
                                    className="sticky left-0 z-10 h-9 border-e border-b"
                                    colSpan={start.length}
                                />
                            ) : null}

                            {hasMiddle ? (
                                <TableHead
                                    className="h-9 border-b"
                                    colSpan={showsMiddle ? middle.length : 1}
                                    style={showsRail ? railStyle : undefined}
                                >
                                    {showsMiddle ? (
                                        // The cell spans the whole middle and scrolls away
                                        // with it; the label inside sticks to the edge of
                                        // the start zone while any middle column is visible.
                                        <div
                                            className="sticky w-fit"
                                            style={{
                                                left:
                                                    offsets.startWidth +
                                                    MIDDLE_LABEL_INSET,
                                            }}
                                        >
                                            <Button
                                                aria-label={`${collapseLabel}: ${middleLabel}`}
                                                onClick={() =>
                                                    setExpanded(false)
                                                }
                                                size="xs"
                                                variant="ghost"
                                            >
                                                <ChevronsRightLeft />
                                                {middleLabel}
                                            </Button>
                                        </div>
                                    ) : null}
                                </TableHead>
                            ) : null}

                            {end.length > 0 ? (
                                <TableHead
                                    className="sticky right-0 z-10 h-9 border-s border-b"
                                    colSpan={end.length}
                                />
                            ) : null}
                        </TableRow>

                        <TableRow className="hover:bg-transparent">
                            {headersOf(start).map(headCell)}

                            {showsMiddle
                                ? headersOf(middle).map(headCell)
                                : null}

                            {showsRail ? (
                                <TableHead
                                    className="border-b p-0 text-center"
                                    style={railStyle}
                                >
                                    <Button
                                        aria-label={expandName}
                                        className="size-full min-w-0 rounded-none px-0"
                                        onClick={() => setExpanded(true)}
                                        size="xs"
                                        title={expandName}
                                        variant="ghost"
                                    >
                                        <ChevronsLeftRight />
                                    </Button>
                                </TableHead>
                            ) : null}

                            {headersOf(end).map(headCell)}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    className="whitespace-normal p-0"
                                    colSpan={columnCount}
                                >
                                    {empty ?? (
                                        <Empty className="border-0">
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    Ничего не найдено
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    Здесь пока нет ни одной
                                                    строки.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => {
                                const cells = row.getVisibleCells();
                                const renderCell = (
                                    cell: (typeof cells)[number],
                                ) => {
                                    const layout = cellLayout(cell.column);

                                    return (
                                        <TableCell
                                            className={cn(
                                                layout.className,
                                                cell.column.columnDef.meta
                                                    ?.cellClassName,
                                            )}
                                            key={cell.id}
                                            style={layout.style}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    );
                                };

                                return (
                                    <TableRow
                                        className={
                                            onRowClick
                                                ? 'cursor-pointer'
                                                : undefined
                                        }
                                        data-state={
                                            row.getIsSelected()
                                                ? 'selected'
                                                : undefined
                                        }
                                        key={row.id}
                                        onClick={
                                            onRowClick
                                                ? (event) =>
                                                      handleRowClick(event, row)
                                                : undefined
                                        }
                                        onKeyDown={
                                            onRowClick
                                                ? (event) =>
                                                      handleRowKeyDown(
                                                          event,
                                                          row,
                                                      )
                                                : undefined
                                        }
                                        tabIndex={onRowClick ? 0 : undefined}
                                    >
                                        {row
                                            .getLeftVisibleCells()
                                            .map(renderCell)}

                                        {showsMiddle
                                            ? row
                                                  .getCenterVisibleCells()
                                                  .map(renderCell)
                                            : null}

                                        {showsRail ? (
                                            <TableCell
                                                aria-hidden="true"
                                                className="border-b bg-secondary p-0"
                                                style={railStyle}
                                            />
                                        ) : null}

                                        {row
                                            .getRightVisibleCells()
                                            .map(renderCell)}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination ? (
                <DataTablePagination
                    pageSizeOptions={pageSizeOptions}
                    table={table}
                />
            ) : null}
        </div>
    );
}
