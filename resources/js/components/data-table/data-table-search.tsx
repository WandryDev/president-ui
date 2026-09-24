import type { RowData, Table } from '@tanstack/react-table';
import { SearchIcon } from 'lucide-react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

export type DataTableSearchProps<TData extends RowData> = {
    table: Table<TData>;
    placeholder?: string;
    /** Names the input, which shows no visible label. */
    label?: string;
    className?: string;
};

/**
 * Drives the table's global filter. Rows are matched in the browser unless the
 * table was built with `manualFiltering`, in which case `onGlobalFilterChange`
 * is where the request to the server belongs.
 */
export function DataTableSearch<TData extends RowData>({
    table,
    placeholder = 'Search',
    label = 'Search',
    className,
}: DataTableSearchProps<TData>) {
    const value = (table.getState().globalFilter ?? '') as string;

    return (
        <InputGroup className={cn('w-full sm:max-w-64', className)}>
            <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
            </InputGroupAddon>

            <InputGroupInput
                type="search"
                value={value}
                aria-label={label}
                placeholder={placeholder}
                onChange={(event) => {
                    table.setGlobalFilter(event.target.value);
                }}
            />
        </InputGroup>
    );
}
