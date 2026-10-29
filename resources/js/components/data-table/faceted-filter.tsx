import { ListFilter } from 'lucide-react';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type FacetedFilterOption = {
    value: string;
    label: string;
    /** How many rows have this value, shown at the end of its row. */
    count?: number;
    icon?: ComponentType<{ className?: string }>;
};

export type FacetedFilterProps = {
    title: string;
    options: FacetedFilterOption[];
    value: string[];
    onValueChange: (value: string[]) => void;
    /** Replaces the filter icon of the trigger. */
    icon?: ReactNode;
    /** The menu item that clears this filter; shown while something is picked. */
    clearLabel?: string;
    className?: string;
};

/**
 * A dashed trigger with a menu of checkboxes. Controlled, so it filters
 * whatever the caller keeps: a TanStack column (`DataTableFacetedFilter`), a
 * query string parameter, a list that is not a table.
 */
export function FacetedFilter({
    title,
    options,
    value,
    onValueChange,
    icon,
    clearLabel = 'Сбросить',
    className,
}: FacetedFilterProps): ReactElement {
    const toggle = (optionValue: string, checked: boolean): void => {
        onValueChange(
            checked
                ? [...value, optionValue]
                : value.filter((item) => item !== optionValue),
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        className={cn('border-dashed', className)}
                        size="sm"
                        variant="outline"
                    >
                        {icon ?? <ListFilter aria-hidden="true" />}
                        {title}

                        {value.length > 0 ? (
                            <>
                                <Separator
                                    className="mx-0.5 h-3.5"
                                    orientation="vertical"
                                />
                                {options
                                    .filter((option) =>
                                        value.includes(option.value),
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

            <DropdownMenuContent align="start" className="min-w-44">
                <DropdownMenuGroup>
                    {options.map((option) => (
                        <DropdownMenuCheckboxItem
                            checked={value.includes(option.value)}
                            key={option.value}
                            onCheckedChange={(checked) => {
                                toggle(option.value, checked);
                            }}
                        >
                            {option.icon ? (
                                <option.icon className="text-muted-foreground" />
                            ) : null}
                            {option.label}
                            {option.count === undefined ? null : (
                                <span className="ms-auto ps-3 text-muted-foreground text-xs tabular-nums">
                                    {option.count}
                                </span>
                            )}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuGroup>

                {value.length > 0 ? (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => {
                                onValueChange([]);
                            }}
                        >
                            {clearLabel}
                        </DropdownMenuItem>
                    </>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
