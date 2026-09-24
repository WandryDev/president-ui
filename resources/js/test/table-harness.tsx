import type { Table } from '@tanstack/react-table';
import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type {
    DataTableBaseProps,
    DataTableColumn,
    UseDataTableOptions,
} from '@/components/data-table';
import { DataTable, useDataTable } from '@/components/data-table';

export type Person = {
    id: string;
    name: string;
    email: string;
    age: number;
};

export const people: Person[] = [
    { id: '1', name: 'Ada Lovelace', email: 'ada@example.com', age: 36 },
    { id: '2', name: 'Grace Hopper', email: 'grace@example.com', age: 45 },
    { id: '3', name: 'Alan Turing', email: 'alan@example.com', age: 41 },
];

export const personColumns: DataTableColumn<Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'age', header: 'Age', meta: { align: 'end' } },
];

export type HarnessOptions = Partial<UseDataTableOptions<Person>>;

type HarnessProps = {
    options?: HarnessOptions;
    children: (table: Table<Person>) => ReactNode;
};

function TableHarness({ options, children }: HarnessProps) {
    const table = useDataTable<Person>({
        data: people,
        columns: personColumns,
        getRowId: (person) => person.id,
        ...options,
    });

    return children(table);
}

/** Renders whatever a test needs around one live table instance. */
export function renderWithTable(
    children: (table: Table<Person>) => ReactNode,
    options?: HarnessOptions,
) {
    const user = userEvent.setup();

    const result = render(
        <TableHarness options={options}>{children}</TableHarness>,
    );

    return { user, ...result };
}

/** The common case: the component under test is the table itself. */
export function renderDataTable(
    props?: DataTableBaseProps<Person>,
    options?: HarnessOptions,
) {
    return renderWithTable(
        (table) => <DataTable table={table} {...props} />,
        options,
    );
}

function textOf(element: HTMLElement): string {
    return element.textContent?.trim() ?? '';
}

export function headerTexts(): string[] {
    return screen.getAllByRole('columnheader').map(textOf);
}

export function bodyRows(): HTMLElement[] {
    // The head is the first rowgroup, the body the second.
    const [, body] = screen.getAllByRole('rowgroup');

    return within(body).queryAllByRole('row');
}

export function rowTexts(): string[][] {
    return bodyRows().map((row) =>
        within(row).getAllByRole('cell').map(textOf),
    );
}

export function columnTexts(index: number): string[] {
    return rowTexts().map((cells) => cells[index] ?? '');
}
