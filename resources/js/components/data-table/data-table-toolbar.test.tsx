import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTableToolbar } from './data-table-toolbar';

describe('DataTableToolbar', () => {
    it('lays out the filters and the actions', () => {
        render(
            <DataTableToolbar actions={<button type="button">Добавить</button>}>
                <input aria-label="Поиск" />
            </DataTableToolbar>,
        );

        expect(screen.getByLabelText('Поиск')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Добавить' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Сбросить/ })).toBeNull();
    });

    it('ends the filters with a reset while filtered', async () => {
        const onReset = vi.fn();
        const user = userEvent.setup();

        render(<DataTableToolbar isFiltered onReset={onReset} />);

        await user.click(screen.getByRole('button', { name: /Сбросить/ }));

        expect(onReset).toHaveBeenCalledOnce();
    });

    it('hides the reset while nothing is filtered', () => {
        render(<DataTableToolbar isFiltered={false} onReset={vi.fn()} />);

        expect(screen.queryByRole('button', { name: /Сбросить/ })).toBeNull();
    });
});
