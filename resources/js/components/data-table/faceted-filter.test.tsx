import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { FacetedFilterOption } from './faceted-filter';
import { FacetedFilter } from './faceted-filter';

const options: FacetedFilterOption[] = [
    { count: 12, label: 'Сайт', value: 'site' },
    { count: 3, icon: Star, label: 'Рекомендация', value: 'referral' },
];

function ControlledFilter({
    onValueChange,
    initial = [],
}: {
    onValueChange?: (value: string[]) => void;
    initial?: string[];
}) {
    const [value, setValue] = useState<string[]>(initial);

    return (
        <FacetedFilter
            onValueChange={(next) => {
                setValue(next);
                onValueChange?.(next);
            }}
            options={options}
            title="Источник"
            value={value}
        />
    );
}

describe('FacetedFilter', () => {
    it('adds and removes values without a table', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();

        render(<ControlledFilter onValueChange={onValueChange} />);

        await user.click(screen.getByRole('button', { name: 'Источник' }));
        await user.click(
            await screen.findByRole('menuitemcheckbox', { name: /Сайт/ }),
        );
        await user.click(
            screen.getByRole('menuitemcheckbox', { name: /Рекомендация/ }),
        );

        expect(onValueChange).toHaveBeenLastCalledWith(['site', 'referral']);

        await user.click(
            screen.getByRole('menuitemcheckbox', { name: /Сайт/ }),
        );

        expect(onValueChange).toHaveBeenLastCalledWith(['referral']);
    });

    it('shows the count of each option', async () => {
        const user = userEvent.setup();

        render(<ControlledFilter />);

        await user.click(screen.getByRole('button', { name: 'Источник' }));

        expect(
            await screen.findByRole('menuitemcheckbox', { name: /Сайт/ }),
        ).toHaveTextContent('12');
    });

    it('shows the picked values on the trigger and clears them', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();

        render(
            <ControlledFilter
                initial={['site']}
                onValueChange={onValueChange}
            />,
        );

        expect(
            screen.getByRole('button', { name: /Источник/ }),
        ).toHaveTextContent('Сайт');

        await user.click(screen.getByRole('button', { name: /Источник/ }));
        await user.click(
            await screen.findByRole('menuitem', { name: 'Сбросить' }),
        );

        expect(onValueChange).toHaveBeenLastCalledWith([]);
    });
});
