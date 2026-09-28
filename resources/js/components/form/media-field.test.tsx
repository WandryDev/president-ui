import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { MediaField } from '@/components/form/media-field';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';

const schema = z.object({
    cover: z.array(z.union([z.instanceof(File), z.string()])),
});

const SAVED = 'https://cdn.example.com/covers/kvartira.webp';

function renderMediaField(cover: (File | string)[] = []) {
    return renderForm({
        children: (
            <MediaField
                accept="image/jpeg,image/png,image/webp"
                label="Обложка"
                maxFiles={1}
                name="cover"
            />
        ),
        defaultValues: { cover },
        schema,
    });
}

describe('MediaField', () => {
    beforeEach(() => {
        URL.createObjectURL = vi.fn(() => 'blob:preview');
        URL.revokeObjectURL = vi.fn();
    });

    it('shows a saved image by its url', () => {
        renderMediaField([SAVED]);

        expect(
            screen.getByRole('img', { name: 'kvartira.webp' }),
        ).toHaveAttribute('src', SAVED);
    });

    it('keeps a saved url in the payload until it is removed', async () => {
        const { user } = renderMediaField([SAVED]);

        await submitForm(user);

        expect(submittedData().cover).toEqual([SAVED]);
    });

    it('removes a saved image', async () => {
        const { user } = renderMediaField([SAVED]);

        await user.click(
            screen.getByRole('button', { name: 'Удалить kvartira.webp' }),
        );
        await submitForm(user);

        expect(screen.queryByRole('img')).toBeNull();
        expect(submittedData().cover).toEqual([]);
    });

    it('sends a picked file', async () => {
        const { user } = renderMediaField();
        const file = new File(['png'], 'plan.png', { type: 'image/png' });

        await user.upload(screen.getByLabelText('Обложка'), file);
        await submitForm(user);

        expect(submittedData().cover).toEqual([file]);
    });

    it('rejects an image outside of accept', () => {
        renderMediaField();

        fireEvent.change(screen.getByLabelText('Обложка'), {
            target: {
                files: [new File(['gif'], 'anim.gif', { type: 'image/gif' })],
            },
        });

        expect(screen.getByRole('alert')).toHaveTextContent(
            'anim.gif — неподходящий формат',
        );
    });

    it('survives a malformed saved url', () => {
        renderMediaField(['https://cdn.example.com/%E0%A4%A.png']);

        expect(screen.getByRole('img')).toHaveAttribute(
            'src',
            'https://cdn.example.com/%E0%A4%A.png',
        );
    });

    it('names the file input with aria-label', () => {
        renderForm({
            children: <MediaField aria-label="Фото объекта" name="cover" />,
            defaultValues: { cover: [] },
            schema,
        });

        expect(screen.getByLabelText('Фото объекта')).toHaveAttribute(
            'type',
            'file',
        );
    });

    it('rejects a file over the size limit', async () => {
        const { user } = renderMediaField();
        const big = new File([new Uint8Array(9 * 1024 * 1024)], 'big.png', {
            type: 'image/png',
        });

        await user.upload(screen.getByLabelText('Обложка'), big);

        expect(screen.getByRole('alert')).toHaveTextContent(
            'big.png — больше 8.0 МБ',
        );
    });
});
