import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
    bodyRows,
    columnTexts,
    headerTexts,
    people,
    personColumns,
    renderDataTable,
} from '@/test/table-harness';
import { DataTable } from './data-table';

describe('DataTable', () => {
    it('renders a header and a row for every record', () => {
        render(<DataTable data={people} columns={personColumns} />);

        expect(headerTexts()).toEqual(['Name', 'Email', 'Age']);
        expect(columnTexts(0)).toEqual([
            'Ada Lovelace',
            'Grace Hopper',
            'Alan Turing',
        ]);
    });

    it('sorts a column and announces the direction', async () => {
        const { user } = renderDataTable();

        await user.click(screen.getByRole('button', { name: 'Name' }));

        expect(columnTexts(0)).toEqual([
            'Ada Lovelace',
            'Alan Turing',
            'Grace Hopper',
        ]);
        expect(
            screen.getByRole('columnheader', { name: 'Name' }),
        ).toHaveAttribute('aria-sort', 'ascending');

        await user.click(screen.getByRole('button', { name: 'Name' }));

        expect(columnTexts(0)).toEqual([
            'Grace Hopper',
            'Alan Turing',
            'Ada Lovelace',
        ]);
        expect(
            screen.getByRole('columnheader', { name: 'Name' }),
        ).toHaveAttribute('aria-sort', 'descending');
    });

    it('leaves a column that cannot be sorted without a control', () => {
        renderDataTable({}, { enableSorting: false });

        expect(
            screen.queryByRole('button', { name: 'Name' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Name' }),
        ).not.toHaveAttribute('aria-sort');
    });

    it('shows the empty block when there are no rows', () => {
        render(<DataTable data={[]} columns={personColumns} />);

        expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
        expect(bodyRows()).toHaveLength(1);
    });

    it('replaces the rows with skeletons while loading', () => {
        renderDataTable({ isLoading: true, skeletonRows: 3 });

        expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
        expect(bodyRows()).toHaveLength(3);
        expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    });

    it('reports the clicked row', async () => {
        const onRowClick = vi.fn();
        const { user } = renderDataTable({ onRowClick });

        await user.click(screen.getByText('Grace Hopper'));

        expect(onRowClick).toHaveBeenCalledTimes(1);
        expect(onRowClick.mock.calls[0][0].original).toEqual(people[1]);
    });

    it('opens a row from the keyboard', async () => {
        const onRowClick = vi.fn();
        const { user } = renderDataTable({ onRowClick });

        bodyRows()[0].focus();
        await user.keyboard('{Enter}');

        expect(onRowClick).toHaveBeenCalledTimes(1);
        expect(onRowClick.mock.calls[0][0].original).toEqual(people[0]);
    });

    it('aligns a column the way its meta asks', () => {
        renderDataTable();

        expect(screen.getByRole('columnheader', { name: 'Age' })).toHaveClass(
            'text-right',
        );
        expect(bodyRows()[0].querySelectorAll('td')[2]).toHaveClass(
            'text-right',
        );
    });

    it('hides the page controls when asked', () => {
        renderDataTable({ pagination: false });

        expect(
            screen.queryByLabelText('Go to next page'),
        ).not.toBeInTheDocument();
    });
});

describe('DataTable header surface', () => {
    it('gives the header its own band', () => {
        const { container } = renderDataTable();

        const header = container.querySelector('[data-slot="table-header"]');

        expect(header?.className).toContain('[&_th]:bg-secondary');
    });

    it('keeps the band opaque so pinned rows cannot show through', () => {
        const { container } = renderDataTable({ fill: true });

        const header = container.querySelector('[data-slot="table-header"]');

        expect(header?.className).toContain('bg-background');
        expect(header?.className).toContain('sticky');
    });
});

describe('DataTable fill', () => {
    it('leaves the page to scroll by default', () => {
        const { container } = renderDataTable();

        const scroller = container.querySelector(
            '[data-slot="table-container"]',
        );

        expect(scroller?.className).not.toContain('overflow-auto');
        expect(
            container.querySelector('[data-slot="table-header"]')?.className,
        ).not.toContain('sticky');
    });

    it('stretches an empty body so the block centres on the table', () => {
        const { container } = renderDataTable({ fill: true }, { data: [] });

        expect(container.querySelector('table')?.className).toContain('h-full');
    });

    it('leaves the rows their own height once there are any', () => {
        const { container } = renderDataTable({ fill: true });

        expect(container.querySelector('table')?.className).not.toContain(
            'h-full',
        );
    });

    it('stretches an empty body even when a footer is pinned below it', () => {
        const { container } = renderDataTable(
            { fill: true, footer: <div>composer</div> },
            { data: [] },
        );

        expect(container.querySelector('table')?.className).toContain('h-full');
    });

    it('keeps the footer outside the scroller so no row hides under it', () => {
        const { container } = renderDataTable({
            fill: true,
            footer: <div data-test="composer">composer</div>,
        });

        const scroller = container.querySelector(
            '[data-slot="table-container"]',
        );
        const composer = screen.getByTestId('composer');

        expect(scroller).not.toContainElement(composer);
        expect(scroller?.parentElement).toContainElement(composer);
    });

    it('keeps the bounce out of the rows', () => {
        const { container } = renderDataTable({ fill: true });

        expect(
            container.querySelector('[data-slot="table-container"]')?.className,
        ).toContain('overscroll-none');
    });

    it('moves the scroll onto the rows and pins the header', () => {
        const { container } = renderDataTable({ fill: true });

        const scroller = container.querySelector(
            '[data-slot="table-container"]',
        );

        expect(scroller?.className).toContain('overflow-auto');
        expect(scroller?.className).toContain('h-full');

        const header = container.querySelector('[data-slot="table-header"]');

        expect(header?.className).toContain('sticky');
        expect(header?.className).toContain('top-0');
    });
});
