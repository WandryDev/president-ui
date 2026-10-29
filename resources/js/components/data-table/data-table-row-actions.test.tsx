import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Person } from '@/test/table-harness';
import { personColumns, renderDataTable } from '@/test/table-harness';
import { DataTableRowActions } from './data-table-row-actions';
import type { DataTableColumn } from './types';

const onEdit = vi.fn();

const columns: DataTableColumn<Person>[] = [
    ...personColumns,
    {
        id: 'actions',
        cell: ({ row }) => (
            <DataTableRowActions>
                {/* A plain element, like the body of a portalled dialog. */}
                <span>Действия {row.original.name}</span>
                <button onClick={onEdit} type="button">
                    Изменить {row.original.name}
                </button>
            </DataTableRowActions>
        ),
    },
];

describe('DataTableRowActions', () => {
    it('keeps a click inside the actions from opening the row', async () => {
        const onRowClick = vi.fn();
        const { user } = renderDataTable({ onRowClick }, { columns });

        await user.click(screen.getByText('Действия Ada Lovelace'));
        await user.click(
            screen.getByRole('button', { name: 'Изменить Ada Lovelace' }),
        );

        expect(onEdit).toHaveBeenCalledOnce();
        expect(onRowClick).not.toHaveBeenCalled();

        await user.click(screen.getByText('ada@example.com'));

        expect(onRowClick).toHaveBeenCalledOnce();
    });

    it('keeps a key pressed inside the actions from opening the row', async () => {
        const onRowClick = vi.fn();
        const { user } = renderDataTable({ onRowClick }, { columns });

        screen.getByRole('button', { name: 'Изменить Grace Hopper' }).focus();
        await user.keyboard('{Enter}');

        expect(onRowClick).not.toHaveBeenCalled();
    });
});
