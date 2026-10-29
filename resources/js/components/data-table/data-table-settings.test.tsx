import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { headerTexts, renderWithTable } from '@/test/table-harness';
import { DataTable } from './data-table';
import { DataTableSettings } from './data-table-settings';

function renderSettings(onReset?: () => void) {
    return renderWithTable((table) => (
        <DataTable
            table={table}
            toolbar={<DataTableSettings onReset={onReset} table={table} />}
        />
    ));
}

describe('DataTableSettings', () => {
    it('hides a column', async () => {
        const { user } = renderSettings();

        await user.click(
            screen.getByRole('button', { name: 'Настройки таблицы' }),
        );
        await user.click(
            await screen.findByRole('checkbox', { name: 'Email' }),
        );
        await user.keyboard('{Escape}');

        await waitFor(() => expect(headerTexts()).toEqual(['Name', 'Age']));
    });

    it('pins a column to the left', async () => {
        const { user } = renderSettings();

        await user.click(
            screen.getByRole('button', { name: 'Настройки таблицы' }),
        );

        const pinning = await screen.findByRole('group', {
            name: 'Закрепление: Age',
        });

        await user.click(
            within(pinning).getByRole('button', { name: 'Слева' }),
        );

        expect(
            within(
                screen.getByRole('region', { name: 'Закреплены слева' }),
            ).getByText('Age'),
        ).toBeInTheDocument();
    });

    it('offers a reset when the page can restore the layout', async () => {
        const onReset = vi.fn();
        const { user } = renderSettings(onReset);

        await user.click(
            screen.getByRole('button', { name: 'Настройки таблицы' }),
        );
        await user.click(
            await screen.findByRole('button', { name: 'Сбросить' }),
        );

        expect(onReset).toHaveBeenCalledOnce();
    });
});
