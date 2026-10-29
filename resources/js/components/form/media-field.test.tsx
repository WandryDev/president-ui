import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { MediaField } from '@/components/form/media-field';
import { renderForm, submitForm, submittedData } from '@/test/form-harness';

const schema = z.object({
    cover: z.array(z.union([z.instanceof(File), z.string()])),
});

const SAVED = 'https://cdn.example.com/covers/kvartira.webp';

type SavedPhoto = { id: string; thumb_url: string };

type SavedDocument = { id: string; name: string; size: number; url: string };

const photosSchema = z.object({ photos: z.array(z.any()) });

const documentsSchema = z.object({ documents: z.array(z.any()) });

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
            'big.png — больше 8 МБ',
        );
    });

    it('moves an item earlier and later when reorderable', async () => {
        const { user } = renderForm({
            children: <MediaField label="Фото" name="photos" reorderable />,
            defaultValues: {
                photos: [
                    'https://cdn.example.com/a.webp',
                    'https://cdn.example.com/b.webp',
                    'https://cdn.example.com/c.webp',
                ],
            },
            schema: photosSchema,
        });

        expect(
            screen.getByRole('button', { name: 'Переместить раньше: a.webp' }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Переместить позже: c.webp' }),
        ).toBeDisabled();

        await user.click(
            screen.getByRole('button', { name: 'Переместить позже: a.webp' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Переместить раньше: c.webp' }),
        );
        await submitForm(user);

        expect(submittedData().photos).toEqual([
            'https://cdn.example.com/b.webp',
            'https://cdn.example.com/c.webp',
            'https://cdn.example.com/a.webp',
        ]);
    });

    it('makes another image the cover by moving it first', async () => {
        const { user } = renderForm({
            children: <MediaField label="Фото" name="photos" />,
            defaultValues: {
                photos: [
                    'https://cdn.example.com/a.webp',
                    'https://cdn.example.com/b.webp',
                ],
            },
            schema: photosSchema,
        });

        expect(
            screen.queryByRole('button', { name: 'Сделать обложкой: a.webp' }),
        ).toBeNull();

        await user.click(
            screen.getByRole('button', { name: 'Сделать обложкой: b.webp' }),
        );
        await submitForm(user);

        expect(submittedData().photos).toEqual([
            'https://cdn.example.com/b.webp',
            'https://cdn.example.com/a.webp',
        ]);
    });

    it('offers no cover when cover is off', () => {
        renderForm({
            children: <MediaField cover={false} label="Фото" name="photos" />,
            defaultValues: {
                photos: [
                    'https://cdn.example.com/a.webp',
                    'https://cdn.example.com/b.webp',
                ],
            },
            schema: photosSchema,
        });

        expect(screen.queryByText('Обложка')).toBeNull();
        expect(
            screen.queryByRole('button', { name: /Сделать обложкой/ }),
        ).toBeNull();
    });

    it('reads saved records through the adapter and keeps them next to new files', async () => {
        const { user } = renderForm({
            children: (
                <MediaField<SavedPhoto>
                    getKey={(photo) => photo.id}
                    getName={(photo) => `Фото ${photo.id}`}
                    getPreviewUrl={(photo) => photo.thumb_url}
                    label="Фото"
                    name="photos"
                    reorderable
                />
            ),
            defaultValues: {
                photos: [
                    { id: '7', thumb_url: 'https://cdn.example.com/7.jpg' },
                ],
            },
            schema: photosSchema,
        });
        const file = new File(['png'], 'plan.png', { type: 'image/png' });

        expect(screen.getByRole('img', { name: 'Фото 7' })).toHaveAttribute(
            'src',
            'https://cdn.example.com/7.jpg',
        );

        await user.upload(screen.getByLabelText('Фото'), file);
        await user.click(
            screen.getByRole('button', {
                name: 'Переместить раньше: plan.png',
            }),
        );
        await submitForm(user);

        expect(submittedData().photos).toEqual([
            file,
            { id: '7', thumb_url: 'https://cdn.example.com/7.jpg' },
        ]);
    });

    it('adds the same file once', async () => {
        const { user } = renderForm({
            children: <MediaField label="Фото" name="photos" />,
            defaultValues: { photos: [] },
            schema: photosSchema,
        });
        const file = new File(['png'], 'plan.png', { type: 'image/png' });

        await user.upload(screen.getByLabelText('Фото'), file);
        await user.upload(screen.getByLabelText('Фото'), file);
        await submitForm(user);

        expect(submittedData().photos).toEqual([file]);
    });

    it('names the files left out over maxFiles', async () => {
        const { user } = renderForm({
            children: <MediaField label="Фото" maxFiles={2} name="photos" />,
            defaultValues: { photos: [] },
            schema: photosSchema,
        });
        const files = ['a', 'b', 'c'].map(
            (name) => new File([name], `${name}.png`, { type: 'image/png' }),
        );

        await user.upload(screen.getByLabelText('Фото'), files);
        await submitForm(user);

        expect(screen.getByRole('alert')).toHaveTextContent('Не больше 2');
        expect(submittedData().photos).toEqual(files.slice(0, 2));
    });

    describe('file variant', () => {
        function renderDocuments(documents: (File | SavedDocument)[] = []) {
            return renderForm({
                children: (
                    <MediaField<SavedDocument>
                        accept=".pdf,.doc,.docx"
                        getKey={(document) => document.id}
                        label="Документы"
                        name="documents"
                        reorderable
                        variant="file"
                    />
                ),
                defaultValues: { documents },
                schema: documentsSchema,
            });
        }

        const contract: SavedDocument = {
            id: 'd1',
            name: 'Договор.pdf',
            size: 1.5 * 1024 * 1024,
            url: 'https://cdn.example.com/d1.pdf',
        };

        it('lists a saved document with its size and a download link', () => {
            renderDocuments([contract]);

            expect(
                screen.getByRole('link', { name: 'Договор.pdf' }),
            ).toHaveAttribute('href', 'https://cdn.example.com/d1.pdf');
            expect(screen.getByText('1,5 МБ')).toBeInTheDocument();
            expect(screen.queryByRole('img')).toBeNull();
        });

        it('adds a document that is not an image', async () => {
            const { user } = renderDocuments([contract]);
            const scan = new File(['pdf'], 'Акт.pdf', {
                type: 'application/pdf',
            });

            await user.upload(screen.getByLabelText('Документы'), scan);
            await submitForm(user);

            expect(screen.getByText('Акт.pdf')).toBeInTheDocument();
            expect(submittedData().documents).toEqual([contract, scan]);
        });

        it('rejects a document outside of accept', () => {
            renderDocuments();

            fireEvent.change(screen.getByLabelText('Документы'), {
                target: {
                    files: [new File(['x'], 'run.exe', { type: '' })],
                },
            });

            expect(screen.getByRole('alert')).toHaveTextContent(
                'run.exe — неподходящий формат',
            );
        });

        it('removes and reorders documents', async () => {
            const act: SavedDocument = {
                ...contract,
                id: 'd2',
                name: 'Акт.pdf',
            };
            const { user } = renderDocuments([contract, act]);

            await user.click(
                screen.getByRole('button', {
                    name: 'Переместить раньше: Акт.pdf',
                }),
            );
            await user.click(
                screen.getByRole('button', { name: 'Удалить Договор.pdf' }),
            );
            await submitForm(user);

            expect(submittedData().documents).toEqual([act]);
        });
    });
});
