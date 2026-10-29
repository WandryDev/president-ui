import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTableDateRangeFilter } from './data-table-date-range-filter';

function dayButton(day: number): HTMLElement {
    return screen.getAllByRole('button', {
        name: new RegExp(`\\b${day}(st|nd|rd|th)\\b`),
    })[0];
}

describe('DataTableDateRangeFilter', () => {
    it('applies a range of two picked days as yyyy-MM-dd', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(
            <DataTableDateRangeFilter
                from="2026-03-01"
                onChange={onChange}
                title="Дата создания"
                to="2026-03-01"
            />,
        );

        await user.click(screen.getByRole('button', { name: /Дата создания/ }));
        await user.click(dayButton(10));

        expect(onChange).not.toHaveBeenCalled();

        await user.click(dayButton(14));

        expect(onChange).toHaveBeenCalledWith({
            from: '2026-03-10',
            to: '2026-03-14',
        });
    });

    it('shows the applied range on the trigger', () => {
        render(
            <DataTableDateRangeFilter
                from="2026-03-10"
                onChange={vi.fn()}
                title="Дата создания"
                to="2026-03-14"
            />,
        );

        expect(
            screen.getByRole('button', { name: /Дата создания/ }),
        ).toHaveTextContent(/10.+14.+2026/);
    });

    it('clears the range', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();

        render(
            <DataTableDateRangeFilter
                from="2026-03-10"
                onChange={onChange}
                title="Дата создания"
                to="2026-03-14"
            />,
        );

        await user.click(screen.getByRole('button', { name: /Дата создания/ }));
        await user.click(
            await screen.findByRole('button', { name: 'Очистить даты' }),
        );

        expect(onChange).toHaveBeenCalledWith({
            from: undefined,
            to: undefined,
        });
    });
});
