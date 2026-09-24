import type { Column, RowData, Table } from '@tanstack/react-table';
import { SlidersHorizontalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type DataTableViewOptionsProps<TData extends RowData> = {
    table: Table<TData>;
    label?: string;
};

/** A column names itself through `meta.label`, or through a plain string header. */
function columnLabel<TData extends RowData>(
    column: Column<TData, unknown>,
): string {
    const { meta, header } = column.columnDef;

    if (meta?.label) {
        return meta.label;
    }

    return typeof header === 'string' ? header : column.id;
}

/** Toggles which columns are visible. Renders nothing when none may be hidden. */
export function DataTableViewOptions<TData extends RowData>({
    table,
    label = 'Columns',
}: DataTableViewOptionsProps<TData>) {
    const columns = table
        .getAllLeafColumns()
        .filter((column) => column.getCanHide());

    if (columns.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="outline" size="sm">
                        <SlidersHorizontalIcon aria-hidden="true" />
                        {label}
                    </Button>
                }
            />

            <DropdownMenuContent align="end" className="w-44">
                {/* Base UI reads its group context from GroupLabel, so the
                    heading has to sit inside a group of its own. */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(visible) => {
                            column.toggleVisibility(visible);
                        }}
                    >
                        {columnLabel(column)}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
