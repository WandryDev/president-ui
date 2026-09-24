import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Person } from '@/test/table-harness';
import { bodyRows, personColumns, renderDataTable } from '@/test/table-harness';
import { selectionColumn } from './selection-column';

const columns = [selectionColumn<Person>(), ...personColumns];

describe('selectionColumn', () => {
    it('selects every row on the page at once', async () => {
        const { user } = renderDataTable({}, { columns });

        await user.click(screen.getByLabelText('Select all rows on this page'));

        expect(screen.getByText('Выбрано 3 из 3')).toBeInTheDocument();
    });

    it('selects a single row', async () => {
        const { user } = renderDataTable({}, { columns });

        await user.click(screen.getAllByLabelText('Select row')[0]);

        expect(screen.getByText('Выбрано 1 из 3')).toBeInTheDocument();
        expect(bodyRows()[0]).toHaveAttribute('data-state', 'selected');
    });

    it('does not open the row it is selecting', async () => {
        const onRowClick = vi.fn();
        const { user } = renderDataTable({ onRowClick }, { columns });

        await user.click(screen.getAllByLabelText('Select row')[1]);

        expect(screen.getByText('Выбрано 1 из 3')).toBeInTheDocument();
        expect(onRowClick).not.toHaveBeenCalled();
    });
});
