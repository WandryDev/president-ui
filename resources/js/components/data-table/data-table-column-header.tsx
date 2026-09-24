import type { Column, RowData, SortDirection } from '@tanstack/react-table';
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DataTableColumnHeaderProps<TData extends RowData, TValue> = {
    column: Column<TData, TValue>;
    children: ReactNode;
    className?: string;
};

const sortIcons: Record<SortDirection, typeof ArrowUpIcon> = {
    asc: ArrowUpIcon,
    desc: ArrowDownIcon,
};

/**
 * The sort control of a header cell. `DataTable` wraps every sortable column in
 * it, so a column definition only supplies its title. A column that renders its
 * own header control should set `enableSorting: false` to avoid nested buttons.
 *
 * The sort state itself is announced through `aria-sort` on the header cell,
 * which `DataTable` owns.
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
    column,
    children,
    className,
}: DataTableColumnHeaderProps<TData, TValue>) {
    const sorted = column.getIsSorted();
    const SortIcon = sorted ? sortIcons[sorted] : ChevronsUpDownIcon;

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn('-mx-2.5 font-medium', className)}
            onClick={column.getToggleSortingHandler()}
        >
            {children}
            <SortIcon
                aria-hidden="true"
                className={cn('text-muted-foreground', !sorted && 'opacity-50')}
            />
        </Button>
    );
}
