import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Country } from 'react-phone-number-input';
import { describe, expect, it, vi } from 'vitest';
import { InputGroupAddon } from '@/components/ui/input-group';
import { PhoneInput } from './phone-input';

function ControlledPhone({
    initial = '',
    country = 'UA',
    onChange,
}: {
    initial?: string;
    country?: Country;
    onChange?: (value: string) => void;
}) {
    const [value, setValue] = useState(initial);

    return (
        <PhoneInput
            aria-label="Телефон"
            defaultCountry={country}
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

    it('drops digits typed past the end of the mask', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<ControlledPhone onChange={onChange} />);

        await user.type(screen.getByLabelText('Телефон'), '067123456789');

        expect(onChange).toHaveBeenLastCalledWith('+380671234567');
        expect(screen.getByLabelText('Телефон')).toHaveValue('067 123 4567');
    });

    it('cuts a pasted number that is too long down to the mask', async () => {
        const user = userEvent.setup();

        render(<ControlledPhone />);

        await user.click(screen.getByLabelText('Телефон'));
        await user.paste('0671234567890');

        expect(screen.getByLabelText('Телефон')).toHaveValue('067 123 4567');
    });

    it('pushes the last digit out when one is typed inside a full number', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<ControlledPhone initial="+380671234567" onChange={onChange} />);

        // After «067 ».
        await user.type(screen.getByLabelText('Телефон'), '9', {
            initialSelectionEnd: 4,
            initialSelectionStart: 4,
        });

        expect(onChange).toHaveBeenLastCalledWith('+380679123456');
        expect(screen.getByLabelText('Телефон')).toHaveValue('067 912 3456');
    });

    it('stops an international number at the end of its mask', async () => {
        const user = userEvent.setup();

        render(<ControlledPhone />);

        await user.type(screen.getByLabelText('Телефон'), '+3806712345678');

        expect(screen.getByLabelText('Телефон')).toHaveValue(
            '+380 67 123 4567',
        );
    });

    it('stops at the end of the mask of the country picked', async () => {
        const user = userEvent.setup();

        render(<ControlledPhone country="RU" />);

        await user.type(screen.getByLabelText('Телефон'), '891612345678');

        expect(screen.getByLabelText('Телефон')).toHaveValue(
            '8 (916) 123-45-67',
        );
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
