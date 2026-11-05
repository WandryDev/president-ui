import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { Country } from 'react-phone-number-input';
import { describe, expect, it, vi } from 'vitest';
import { InputGroupAddon } from '@/components/ui/input-group';
import { dropOverflowingPhoneDigits, PhoneInput } from './phone-input';

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

    it('stops at a full mobile number the mask would stretch', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<ControlledPhone onChange={onChange} />);

        // The mask would take a tenth digit as «0987 111 1112».
        await user.type(screen.getByLabelText('Телефон'), '09871111112');

        expect(onChange).toHaveBeenLastCalledWith('+380987111111');
        expect(screen.getByLabelText('Телефон')).toHaveValue('098 711 1111');
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

describe('dropOverflowingPhoneDigits', () => {
    function typed(value: string, caret = value.length): HTMLInputElement {
        const input = document.createElement('input');
        input.value = value;
        input.setSelectionRange(caret, caret);

        return input;
    }

    it('cuts the digits past the mask off the end, keeping the caret', () => {
        const input = typed('098 711 11112');

        dropOverflowingPhoneDigits(input, 'UA');

        expect(input.value).toBe('098 711 1111');
        expect(input.selectionStart).toBe(12);
    });

    it('keeps the caret where a digit was typed inside a full number', () => {
        // «5» typed after «098 ».
        const input = typed('098 5711 1111', 5);

        dropOverflowingPhoneDigits(input, 'UA');

        expect(input.value).toBe('098 5711 111');
        expect(input.selectionStart).toBe(5);
    });

    it('leaves a number that still fits alone', () => {
        const input = typed('098 711 11');

        dropOverflowingPhoneDigits(input, 'UA');

        expect(input.value).toBe('098 711 11');
    });
});
