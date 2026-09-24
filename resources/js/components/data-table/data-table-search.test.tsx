import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { columnTexts, renderWithTable } from '@/test/table-harness';
import { DataTable } from './data-table';
import { DataTableSearch } from './data-table-search';

function renderSearchableTable() {
    return renderWithTable((table) => (
        <DataTable table={table} toolbar={<DataTableSearch table={table} />} />
    ));
}

describe('DataTableSearch', () => {
    it('keeps only the rows that match', async () => {
        const { user } = renderSearchableTable();

        await user.type(screen.getByLabelText('Search'), 'grace');

        expect(columnTexts(0)).toEqual(['Grace Hopper']);
    });

    it('shows the empty block when nothing matches', async () => {
        const { user } = renderSearchableTable();

        await user.type(screen.getByLabelText('Search'), 'nobody');

        expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    });
});
