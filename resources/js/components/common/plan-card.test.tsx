import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PlanCard } from './plan-card';

describe('PlanCard', () => {
    it('presents the name, tagline, price and period', () => {
        render(
            <PlanCard
                name="Agency"
                period="₴ в месяц"
                price="1 900"
                tagline="Агентству с командой и филиалами"
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Agency' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Агентству с командой и филиалами'),
        ).toBeInTheDocument();
        expect(screen.getByText('1 900')).toBeInTheDocument();
        expect(screen.getByText('₴ в месяц')).toBeInTheDocument();
    });

    it('lists the features in order', () => {
        render(
            <PlanCard
                features={['Один участник', 'Гости без ограничений']}
                name="Solo"
                price="490"
            />,
        );

        const items = within(screen.getByRole('list')).getAllByRole('listitem');

        expect(items.map((item) => item.textContent)).toEqual([
            'Один участник',
            'Гости без ограничений',
        ]);
    });

    it('leaves out the tagline and the list when there is nothing to show', () => {
        const { container } = render(<PlanCard name="Solo" price="490" />);

        expect(screen.queryByRole('list')).toBeNull();
        expect(container.querySelectorAll('p')).toHaveLength(0);
    });

    it('renders the indicator on the name row and the action below', () => {
        render(
            <PlanCard
                action={<button type="button">Изменить</button>}
                indicator={<span>Текущий</span>}
                name="Solo"
                price="490"
            />,
        );

        const heading = screen.getByRole('heading', { name: 'Solo' });

        expect(heading.parentElement).toHaveTextContent('Текущий');
        expect(
            screen.getByRole('button', { name: 'Изменить' }),
        ).toBeInTheDocument();
    });

    it('lets a control be labelled by the name and the tagline', () => {
        render(
            <PlanCard
                id="plan-solo"
                indicator={
                    <input
                        aria-labelledby="plan-solo-name plan-solo-tagline"
                        type="radio"
                    />
                }
                name="Solo"
                price="490"
                tagline="Риэлтору, который работает один"
            />,
        );

        expect(
            screen.getByRole('radio', {
                name: 'Solo Риэлтору, который работает один',
            }),
        ).toBeInTheDocument();
    });

    it('becomes the element it is rendered into', async () => {
        const user = userEvent.setup();

        render(
            <PlanCard
                indicator={<input aria-label="Solo" type="radio" />}
                name="Solo"
                price="490"
                // biome-ignore lint/a11y/noLabelWithoutControl: the card renders into this label, radio included
                render={<label />}
            />,
        );

        await user.click(screen.getByText('490'));

        expect(screen.getByRole('radio', { name: 'Solo' })).toBeChecked();
    });
});
