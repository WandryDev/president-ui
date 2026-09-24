import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { HarnessOptions, Person } from '@/test/table-harness';
import { people, personColumns } from '@/test/table-harness';
import { useDataTable } from './use-data-table';

function setupTable(options?: HarnessOptions) {
    const { result } = renderHook(() =>
        useDataTable<Person>({
            data: people,
            columns: personColumns,
            ...options,
        }),
    );

    return result;
}

function names(table: ReturnType<typeof setupTable>['current']): string[] {
    return table.getRowModel().rows.map((row) => row.original.name);
}

describe('useDataTable', () => {
    it('paginates in the browser', () => {
        const table = setupTable({ pageSize: 2 }).current;

        expect(table.getRowModel().rows).toHaveLength(2);
        expect(table.getRowCount()).toBe(3);
        expect(table.getPageCount()).toBe(2);
    });

    it('sorts in the browser', () => {
        const table = setupTable({
            initialState: { sorting: [{ id: 'name', desc: true }] },
        }).current;

        expect(names(table)[0]).toBe('Grace Hopper');
    });

    it('leaves the rows alone when the server paginates', () => {
        const table = setupTable({
            manualPagination: true,
            rowCount: 30,
            pageSize: 2,
        }).current;

        expect(table.getRowModel().rows).toHaveLength(people.length);
        expect(table.getRowCount()).toBe(30);
        expect(table.getPageCount()).toBe(15);
    });

    it('leaves the order alone when the server sorts', () => {
        const table = setupTable({
            manualSorting: true,
            initialState: { sorting: [{ id: 'name', desc: true }] },
        }).current;

        expect(names(table)).toEqual(people.map((person) => person.name));
    });
});
