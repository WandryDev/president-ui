import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';
import { SliderField } from './slider-field';

const schema = z.object({ volume: z.number() });

// Base UI renders both a thumb and a hidden range input, and keeps the thumb
// visibility:hidden until it has measured the track — which never happens
// without layout. The range input is the stable handle in jsdom.
function sliderInput(): HTMLInputElement {
    const input = document.querySelector<HTMLInputElement>(
        'input[type="range"]',
    );

    if (input === null) {
        throw new Error('SliderField did not render a range input.');
    }

    return input;
}

const field = (
    <SliderField name="volume" label="Volume" min={0} max={100} step={10} />
);

describe('SliderField', () => {
    it('renders a slider holding the current value', () => {
        renderForm({
            schema,
            defaultValues: { volume: 20 },
            children: field,
        });

        expect(sliderInput()).toHaveValue('20');
    });

    it('sends the value moved to with the keyboard', async () => {
        const { user } = renderForm({
            schema,
            defaultValues: { volume: 20 },
            children: field,
        });

        sliderInput().focus();
        await user.keyboard('{ArrowRight}');
        await submitForm(user);

        expect(submittedData()).toEqual({ volume: 30 });
    });
});
