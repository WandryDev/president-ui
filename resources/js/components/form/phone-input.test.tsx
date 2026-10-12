import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputGroupAddon } from '@/components/ui/input-group';
import { PhoneInput } from './phone-input';

function ControlledPhone({
    initial = '',
    onChange,
}: {
    initial?: string;
    onChange?: (value: string) => void;
}) {
    const [value, setValue] = useState(initial);

    return (
        <PhoneInput
            aria-label="Телефон"
            defaultCountry="UA"
            onChange={(next) => {
                setValue(next);
                onChange?.(next);
            }}
            value={value}
        >
            <InputGroupAddon align="inline-end">Основной</InputGroupAddon>
        </PhoneInput>
    );
}

describe('PhoneInput', () => {
    it('reports the typed number in E.164', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<ControlledPhone onChange={onChange} />);

        await user.type(screen.getByLabelText('Телефон'), '0671234567');

        expect(onChange).toHaveBeenLastCalledWith('+380671234567');
    });

    it('renders its children inside the input group', () => {
        render(<ControlledPhone />);

        expect(
            screen.getByText('Основной').closest('[data-slot="input-group"]'),
        ).toContainElement(screen.getByLabelText('Телефон'));
    });

    it('starts empty when the value is not a phone number', () => {
        render(<ControlledPhone initial="ada@example.com" />);

        expect(screen.getByLabelText('Телефон')).toHaveValue('');
    });
});
