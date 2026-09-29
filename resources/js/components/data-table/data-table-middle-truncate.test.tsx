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

        expect(headerTexts()).toEqual(['Name', '', 'Age']);
        expect(screen.getAllByRole('row')).toHaveLength(1 + 3);
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
        expect(headerTexts()).toEqual([
            '',
            'Contacts',
            '',
            'Name',
            'Email',
            'Age',
        ]);

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

    it('paints the header opaque so pinned cells hide what scrolls under them', () => {
        renderWithTable(
            (table) => <DataTableMiddleTruncate table={table} />,
            pinning,
        );

        const [head] = screen.getAllByRole('rowgroup');

        expect(head.className).toContain('[&_th]:bg-background');
        expect(head.className).not.toContain('[&_th]:bg-secondary');
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

    it('leaves the page to scroll by default', () => {
        const { container } = renderWithTable(
            (table) => <DataTableMiddleTruncate table={table} />,
            pinning,
        );

        expect(
            container.querySelector('[data-slot="table-container"]')?.className,
        ).not.toContain('overflow-auto');
        expect(
            container.querySelector('[data-slot="table-header"]')?.className,
        ).not.toContain('sticky');
    });

    it('scrolls the rows inside the table under a sticky header when filling', () => {
        const { container } = renderWithTable(
            (table) => <DataTableMiddleTruncate fill table={table} />,
            pinning,
        );

        const scroller = container.querySelector(
            '[data-slot="table-container"]',
        );

        expect(scroller?.className).toContain('overflow-auto');
        expect(
            container.querySelector('[data-slot="table-header"]')?.className,
        ).toContain('sticky top-0');
        expect(
            scroller?.contains(
                screen.getByRole('button', { name: 'На следующую страницу' }),
            ),
        ).toBe(false);
    });
});
