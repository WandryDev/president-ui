import type { Column, RowData, Table } from '@tanstack/react-table';
import { Settings2 } from 'lucide-react';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Drawer,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerPanel,
    DrawerPopup,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type DataTableSettingsProps<TData extends RowData> = {
    table: Table<TData>;
    /** Возвращает раскладку таблицы к исходной. */
    onReset?: () => void;
    /** Applied to the trigger button. */
    className?: string;
};

type Pin = 'left' | 'none' | 'right';

const pinOptions: { value: Pin; label: string }[] = [
    { label: 'Слева', value: 'left' },
    { label: 'Нет', value: 'none' },
    { label: 'Справа', value: 'right' },
];

const sections: { pin: Pin; title: string; empty: string }[] = [
    {
        empty: 'Ничего не закреплено слева',
        pin: 'left',
        title: 'Закреплены слева',
    },
    {
        empty: 'Все колонки закреплены',
        pin: 'none',
        title: 'Прокручиваются',
    },
    {
        empty: 'Ничего не закреплено справа',
        pin: 'right',
        title: 'Закреплены справа',
    },
];

function columnLabel<TData extends RowData>(
    column: Column<TData, unknown>,
): string {
    const { meta, header } = column.columnDef;

    return meta?.label ?? (typeof header === 'string' ? header : column.id);
}

function pinOf<TData extends RowData>(column: Column<TData, unknown>): Pin {
    return column.getIsPinned() || 'none';
}

function ColumnRow<TData extends RowData>({
    column,
}: {
    column: Column<TData, unknown>;
}): ReactElement {
    const id = useId();
    const label = columnLabel(column);

    return (
        <li className="flex items-center justify-between gap-3 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
                <Checkbox
                    checked={column.getIsVisible()}
                    disabled={!column.getCanHide()}
                    id={id}
                    onCheckedChange={(checked) =>
                        column.toggleVisibility(checked === true)
                    }
                />
                <Label className="truncate font-normal" htmlFor={id}>
                    {label}
                </Label>
            </div>

            <ToggleGroup
                aria-label={`Закрепление: ${label}`}
                onValueChange={(values) => {
                    const next = values.at(-1) as Pin | undefined;

                    if (next) {
                        column.pin(next === 'none' ? false : next);
                    }
                }}
                size="sm"
                value={[pinOf(column)]}
                variant="outline"
            >
                {pinOptions.map((option) => (
                    <ToggleGroupItem
                        className="px-2 text-xs"
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </li>
    );
}

/**
 * Настройки таблицы в боковой панели: какие колонки видны и какие закреплены
 * слева или справа. Колонки разложены по зонам, в которых они сейчас стоят.
 */
export function DataTableSettings<TData extends RowData>({
    table,
    onReset,
    className,
}: DataTableSettingsProps<TData>): ReactElement {
    // Reads the TanStack table, which mutates in place: memoizing on it would go stale.
    'use no memo';

    const columns = table.getAllLeafColumns();
    const { left = [], right = [] } = table.getState().columnPinning;

    // Закреплённые колонки идут в порядке закрепления — так же, как в таблице.
    const byPin: Record<Pin, Column<TData, unknown>[]> = {
        left: left.flatMap((id) =>
            columns.filter((column) => column.id === id),
        ),
        none: columns.filter((column) => pinOf(column) === 'none'),
        right: right.flatMap((id) =>
            columns.filter((column) => column.id === id),
        ),
    };

    return (
        <Drawer position="right">
            <DrawerTrigger
                render={
                    <Button
                        aria-label="Настройки таблицы"
                        className={className}
                        size="icon"
                        title="Настройки таблицы"
                        variant="outline"
                    />
                }
            >
                <Settings2 />
            </DrawerTrigger>

            <DrawerPopup showCloseButton variant="inset">
                <DrawerHeader>
                    <DrawerTitle>Настройки таблицы</DrawerTitle>
                    <DrawerDescription>
                        Какие колонки видны и какие закреплены по краям.
                        Остальные прокручиваются и сворачиваются в середине.
                    </DrawerDescription>
                </DrawerHeader>

                <DrawerPanel>
                    <div className="flex flex-col gap-6">
                        {sections.map((section) => (
                            <section
                                aria-label={section.title}
                                className="flex flex-col gap-1"
                                key={section.pin}
                            >
                                <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                                    {section.title}
                                </h3>

                                {byPin[section.pin].length === 0 ? (
                                    <p className="py-1.5 text-muted-foreground text-sm">
                                        {section.empty}
                                    </p>
                                ) : (
                                    <ul className="divide-y">
                                        {byPin[section.pin].map((column) => (
                                            <ColumnRow
                                                column={column}
                                                key={column.id}
                                            />
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </div>
                </DrawerPanel>

                {onReset ? (
                    <DrawerFooter>
                        <Button onClick={onReset} variant="outline">
                            Сбросить
                        </Button>
                    </DrawerFooter>
                ) : null}
            </DrawerPopup>
        </Drawer>
    );
}
