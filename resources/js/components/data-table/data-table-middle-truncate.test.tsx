import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { headerTexts, renderWithTable, rowTexts } from '@/test/table-harness';
import { DataTableMiddleTruncate } from './data-table-middle-truncate';

const pinning = {
    initialState: { columnPinning: { left: ['name'], right: ['age'] } },
};

describe('DataTableMiddleTruncate', () => {
    it('keeps the pinned start and end while the middle is folded', () => {
        renderWithTable(
            (table) => (
                <DataTableMiddleTruncate middleLabel="Contacts" table={table} />
            ),
            pinning,
        );

        expect(headerTexts()).toEqual(['', '', '', 'Name', '', 'Age']);
        expect(
            screen.getByRole('button', {
                name: 'Show columns: Contacts (1)',
            }),
        ).toBeInTheDocument();
        expect(screen.queryByText('ada@example.com')).toBeNull();
    });

    it('shows the middle from the rail and folds it back from the header', async () => {
        const onExpandedChange = vi.fn();

        const { user } = renderWithTable(
            (table) => (
                <DataTableMiddleTruncate
                    middleLabel="Contacts"
                    onExpandedChange={onExpandedChange}
                    table={table}
                />
            ),
            pinning,
        );

        await user.click(
            screen.getByRole('button', { name: 'Show columns: Contacts (1)' }),
        );

        expect(screen.getByText('ada@example.com')).toBeInTheDocument();
        expect(onExpandedChange).toHaveBeenLastCalledWith(true);

        await user.click(
            screen.getByRole('button', { name: 'Hide columns: Contacts' }),
        );

        expect(screen.queryByText('ada@example.com')).toBeNull();
        expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    });

    it('starts expanded and keeps the zone order', () => {
        renderWithTable(
            (table) => (
                <DataTableMiddleTruncate defaultExpanded table={table} />
            ),
            pinning,
        );

        expect(rowTexts()[0]).toEqual([
            'Ada Lovelace',
            'ada@example.com',
            '36',
        ]);
    });

    it('sorts from a pinned header and opens a row on click', async () => {
        const onRowClick = vi.fn();

        const { user } = renderWithTable(
            (table) => (
                <DataTableMiddleTruncate
                    onRowClick={onRowClick}
                    table={table}
                />
            ),
            pinning,
        );

        await user.click(screen.getByRole('button', { name: 'Name' }));

        expect(
            screen.getByRole('columnheader', { name: 'Name' }),
        ).toHaveAttribute('aria-sort', 'ascending');

        await user.click(screen.getByText('Grace Hopper'));

        expect(onRowClick).toHaveBeenCalledWith(
            expect.objectContaining({ id: '2' }),
        );
    });
});
