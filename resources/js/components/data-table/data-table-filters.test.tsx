import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DataTableFilterDef } from '@/components/data-table';
import {
    DataTable,
    DataTableFilters,
    facetedFilterFn,
} from '@/components/data-table';
import type { HarnessOptions, Person } from '@/test/table-harness';
import { personColumns, renderWithTable, rowTexts } from '@/test/table-harness';

const FILTERS: DataTableFilterDef[] = [
    {
        columnId: 'name',
        label: 'Имя',
        options: [
            { label: 'Ada', value: 'Ada Lovelace' },
            { label: 'Grace', value: 'Grace Hopper' },
        ],
    },
];

const options: HarnessOptions = {
    columns: personColumns.map((column) =>
        'accessorKey' in column && column.accessorKey === 'name'
            ? { ...column, filterFn: facetedFilterFn<Person> }
            : column,
    ),
};

function renderFiltered() {
    return renderWithTable(
        (table) => (
            <DataTable
                table={table}
                toolbar={<DataTableFilters filters={FILTERS} table={table} />}
            />
        ),
        options,
    );
}

describe('DataTableFilters', () => {
    it('renders a control per declared filter', () => {
        renderFiltered();

        expect(screen.getByRole('button', { name: /Имя/ })).toBeInTheDocument();
    });

    it('narrows the rows to the option that was picked', async () => {
        const { user } = renderFiltered();

        expect(rowTexts()).toHaveLength(3);

        await user.click(screen.getByRole('button', { name: /Имя/ }));
        await user.click(
            await screen.findByRole('menuitemcheckbox', { name: 'Ada' }),
        );

        expect(rowTexts().map((cells) => cells[0])).toEqual(['Ada Lovelace']);
    });

    it('keeps several options of one filter as a union', async () => {
        const { user } = renderFiltered();

        await user.click(screen.getByRole('button', { name: /Имя/ }));
        await user.click(
            await screen.findByRole('menuitemcheckbox', { name: 'Ada' }),
        );
        await user.click(
            await screen.findByRole('menuitemcheckbox', { name: 'Grace' }),
        );

        expect(rowTexts().map((cells) => cells[0])).toEqual([
            'Ada Lovelace',
            'Grace Hopper',
        ]);
    });

    it('offers a reset only once something is filtered', async () => {
        const { user } = renderFiltered();

        expect(screen.queryByRole('button', { name: /Сбросить/ })).toBeNull();

        await user.click(screen.getByRole('button', { name: /Имя/ }));
        await user.click(
            await screen.findByRole('menuitemcheckbox', { name: 'Ada' }),
        );
        await user.click(screen.getByRole('button', { name: /Сбросить/ }));

        expect(rowTexts()).toHaveLength(3);
    });

    it('skips a filter whose column the table does not have', () => {
        renderWithTable(
            (table) => (
                <DataTableFilters
                    filters={[
                        { columnId: 'nope', label: 'Нет такой', options: [] },
                    ]}
                    table={table}
                />
            ),
            options,
        );

        expect(screen.queryByRole('button', { name: /Нет такой/ })).toBeNull();
    });
});
