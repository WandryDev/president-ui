import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Person } from '@/test/table-harness';
import {
    headerTexts,
    personColumns,
    renderWithTable,
} from '@/test/table-harness';
import { DataTable } from './data-table';
import { DataTableViewOptions } from './data-table-view-options';
import { selectionColumn } from './selection-column';

describe('DataTableViewOptions', () => {
    it('hides and restores a column', async () => {
        const { user } = renderWithTable((table) => (
            <DataTable
                table={table}
                toolbar={<DataTableViewOptions table={table} />}
            />
        ));

        await user.click(screen.getByRole('button', { name: 'Columns' }));
        await user.click(
            await screen.findByRole('menuitemcheckbox', { name: 'Email' }),
        );

        expect(headerTexts()).toEqual(['Name', 'Age']);

        await user.click(
            screen.getByRole('menuitemcheckbox', { name: 'Email' }),
        );

        expect(headerTexts()).toEqual(['Name', 'Email', 'Age']);
    });

    it('leaves out the columns that may not be hidden', async () => {
        const { user } = renderWithTable(
            (table) => <DataTableViewOptions table={table} />,
            { columns: [selectionColumn<Person>(), ...personColumns] },
        );

        await user.click(screen.getByRole('button', { name: 'Columns' }));

        expect(await screen.findAllByRole('menuitemcheckbox')).toHaveLength(3);
    });
});
