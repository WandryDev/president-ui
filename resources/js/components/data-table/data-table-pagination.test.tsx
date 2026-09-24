import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { columnTexts, renderDataTable } from '@/test/table-harness';

describe('DataTablePagination', () => {
    it('shows the visible range and the page count', () => {
        renderDataTable({}, { pageSize: 2 });

        expect(screen.getByText('1–2 из 3')).toBeInTheDocument();
        expect(screen.getByText('Страница 1 из 2')).toBeInTheDocument();
        expect(screen.getByLabelText('На предыдущую страницу')).toBeDisabled();
    });

    it('walks through the pages', async () => {
        const { user } = renderDataTable({}, { pageSize: 2 });

        await user.click(screen.getByLabelText('На следующую страницу'));

        expect(columnTexts(0)).toEqual(['Alan Turing']);
        expect(screen.getByText('3–3 из 3')).toBeInTheDocument();
        expect(screen.getByLabelText('На следующую страницу')).toBeDisabled();

        await user.click(screen.getByLabelText('К первой странице'));

        expect(columnTexts(0)).toEqual(['Ada Lovelace', 'Grace Hopper']);
    });

    it('changes how many rows a page holds', async () => {
        const { user } = renderDataTable({}, { pageSize: 2 });

        await user.selectOptions(
            screen.getByLabelText('Строк на странице'),
            '25',
        );

        expect(columnTexts(0)).toHaveLength(3);
        expect(screen.getByText('1–3 из 3')).toBeInTheDocument();
    });

    it('keeps a page size that is not one of the options selectable', () => {
        renderDataTable({}, { pageSize: 2 });

        expect(screen.getByLabelText('Строк на странице')).toHaveValue('2');
    });

    it('drops the jump-to-edge buttons when the last page is unknown', () => {
        renderDataTable({}, { manualPagination: true, pageCount: -1 });

        expect(
            screen.queryByLabelText('К первой странице'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText('К последней странице'),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Страница 1')).toBeInTheDocument();
        expect(screen.getByLabelText('На следующую страницу')).toBeEnabled();
    });
});
