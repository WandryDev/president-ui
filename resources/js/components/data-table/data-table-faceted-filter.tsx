import type { Column, RowData } from '@tanstack/react-table';
import { ListFilter } from 'lucide-react';
import type { ReactElement } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

export type DataTableFilterOption = {
    value: string;
    label: string;
};

export type DataTableFacetedFilterProps<TData extends RowData> = {
    column: Column<TData, unknown>;
    label: string;
    options: DataTableFilterOption[];
};

function selectedValues<TData extends RowData>(
    column: Column<TData, unknown>,
): string[] {
    const value = column.getFilterValue();

    return Array.isArray(value) ? (value as string[]) : [];
}

export function DataTableFacetedFilter<TData extends RowData>({
    column,
    label,
    options,
}: DataTableFacetedFilterProps<TData>): ReactElement {
    const selected = selectedValues(column);

    const toggle = (value: string, checked: boolean): void => {
        const next = checked
            ? [...selected, value]
            : selected.filter((item) => item !== value);

        column.setFilterValue(next.length > 0 ? next : undefined);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        className="border-dashed"
                        size="sm"
                        variant="outline"
                    >
                        <ListFilter aria-hidden="true" />
                        {label}

                        {selected.length > 0 ? (
                            <>
                                <Separator
                                    className="mx-0.5 h-3.5"
                                    orientation="vertical"
                                />
                                {options
                                    .filter((option) =>
                                        selected.includes(option.value),
                                    )
                                    .map((option) => (
                                        <Badge
                                            key={option.value}
                                            size="sm"
                                            variant="secondary"
                                        >
                                            {option.label}
                                        </Badge>
                                    ))}
                            </>
                        ) : null}
                    </Button>
                }
            />

            <DropdownMenuContent align="start" className="w-44">
                {options.map((option) => (
                    <DropdownMenuCheckboxItem
                        checked={selected.includes(option.value)}
                        key={option.value}
                        onCheckedChange={(checked) => {
                            toggle(option.value, checked);
                        }}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
