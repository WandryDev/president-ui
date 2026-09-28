import { act, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { Point } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import { useEditorRef } from 'platejs/react';
import { describe, expect, it, vi } from 'vitest';
import type { EditorProps } from '@/components/editor/editor';
import { Editor } from '@/components/editor/editor';
import {
    getCurrentBlockType,
    insertBlock,
    setBlockType,
} from '@/components/editor/editor-transforms';
import type { EditorValue } from '@/components/editor/editor-value';

type Harness = { editor: PlateEditor };

function CaptureEditor({ harness }: { harness: Harness }): null {
    harness.editor = useEditorRef();

    return null;
}

function renderEditor(props: Partial<EditorProps> = {}) {
    const harness = {} as Harness;
    const user = userEvent.setup();

    render(
        <Editor aria-label="Текст статьи" {...props}>
            <CaptureEditor harness={harness} />
        </Editor>,
    );

    return { editor: harness.editor, user };
}

function paragraph(text: string): EditorValue {
    return [{ type: 'p', children: [{ text }] }];
}

function selectAll(editor: PlateEditor): void {
    act(() => {
        editor.tf.select({
            anchor: editor.api.start([]) as Point,
            focus: editor.api.end([]) as Point,
        });
    });
}

function typeText(editor: PlateEditor, text: string): void {
    act(() => {
        if (!editor.selection) {
            editor.tf.select(editor.api.end([]) as Point);
        }

        for (const character of text) {
            editor.tf.insertText(character);
        }
    });
}

describe('Editor', () => {
    it('offers blocks through the slash menu and nothing from AI or comments', async () => {
        const { editor } = renderEditor();

        typeText(editor, '/');

        const menu = await screen.findByRole('listbox');
        const labels = within(menu)
            .getAllByRole('option')
            .map((option) => option.textContent);

        expect(labels).toEqual(
            expect.arrayContaining([
                'Заголовок 2',
                'Заголовок 3',
                'Заголовок 4',
                'Таблица',
                'Выноска',
                'Блок кода',
                'Цитата',
                'Разделитель',
            ]),
        );
        expect(labels.join(' ')).not.toMatch(
            /AI|ИИ|Коммент|Заголовок 1|Упомин/,
        );
    });

    it('inserts a table from the slash menu', async () => {
        const { editor, user } = renderEditor();

        typeText(editor, '/');
        await user.click(
            within(await screen.findByRole('listbox')).getByRole('option', {
                name: 'Таблица',
            }),
        );

        expect(editor.children.map((node) => node.type)).toEqual([
            'table',
            'p',
        ]);
    });

    it('marks the selection bold from the toolbar', async () => {
        const { editor, user } = renderEditor({ value: paragraph('Цена') });

        selectAll(editor);
        await user.click(screen.getByRole('button', { name: 'Полужирный' }));

        expect(editor.children[0]).toMatchObject({
            children: [{ bold: true, text: 'Цена' }],
        });
    });

    it('shows the floating toolbar for a selection', async () => {
        const { editor, user } = renderEditor({ value: paragraph('Цена') });

        act(() => {
            editor.tf.focus();
        });
        selectAll(editor);

        const floating = await screen.findByRole('toolbar', {
            name: 'Форматирование выделения',
        });

        await user.click(
            within(floating).getByRole('button', { name: 'Курсив' }),
        );

        expect(editor.children[0]).toMatchObject({
            children: [{ italic: true, text: 'Цена' }],
        });
    });

    it('turns a paragraph into a heading with a markdown shortcut', () => {
        const { editor } = renderEditor();

        typeText(editor, '## Район');

        expect(editor.children[0]).toMatchObject({
            children: [{ text: 'Район' }],
            type: 'h2',
        });
    });

    it('turns a paragraph into a list with a markdown shortcut', () => {
        const { editor } = renderEditor();

        typeText(editor, '- Метро');

        expect(editor.children[0]).toMatchObject({ listStyleType: 'disc' });
    });

    it('inserts an image by url only when uploads are not available', async () => {
        const { editor, user } = renderEditor({ value: paragraph('') });

        await user.click(screen.getByRole('button', { name: 'Изображение' }));

        expect(
            screen.queryByRole('button', { name: /Загрузить файл/ }),
        ).toBeNull();

        await user.type(
            screen.getByRole('textbox', { name: 'Ссылка на изображение' }),
            'https://cdn.example.com/plan.webp',
        );
        await user.click(screen.getByRole('button', { name: 'Вставить' }));

        expect(editor.children).toContainEqual(
            expect.objectContaining({
                type: 'img',
                url: 'https://cdn.example.com/plan.webp',
            }),
        );
    });

    it('rejects an image url without http or https', async () => {
        const { editor, user } = renderEditor({ value: paragraph('') });

        await user.click(screen.getByRole('button', { name: 'Изображение' }));
        await user.type(
            screen.getByRole('textbox', { name: 'Ссылка на изображение' }),
            'data:image/png;base64,AAAA',
        );
        await user.click(screen.getByRole('button', { name: 'Вставить' }));

        expect(
            screen.getByText('Ссылка должна начинаться с http:// или https://'),
        ).toBeInTheDocument();
        expect(editor.children.some((node) => node.type === 'img')).toBe(false);
    });

    it('uploads a chosen file through uploadImage', async () => {
        const uploadImage = vi.fn(async () => 'https://cdn.example.com/up.png');
        const { editor, user } = renderEditor({
            uploadImage,
            value: paragraph(''),
        });

        await user.click(screen.getByRole('button', { name: 'Изображение' }));
        await user.upload(
            screen.getByLabelText('Файл изображения'),
            new File(['png'], 'photo.png', { type: 'image/png' }),
        );

        await waitFor(() =>
            expect(editor.children).toContainEqual(
                expect.objectContaining({
                    type: 'img',
                    url: 'https://cdn.example.com/up.png',
                }),
            ),
        );
        expect(uploadImage).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'photo.png' }),
        );
    });

    it('uploads a dropped file through uploadImage', async () => {
        const uploadImage = vi.fn(
            async () => 'https://cdn.example.com/drop.png',
        );
        const { editor } = renderEditor({ uploadImage, value: paragraph('') });
        const file = new File(['png'], 'drop.png', { type: 'image/png' });

        act(() => {
            editor.tf.select(editor.api.end([]) as Point);
            editor.tf.insertData({
                files: [file],
                getData: () => '',
                types: ['Files'],
            } as unknown as DataTransfer);
        });

        await waitFor(() =>
            expect(editor.children).toContainEqual(
                expect.objectContaining({
                    type: 'img',
                    url: 'https://cdn.example.com/drop.png',
                }),
            ),
        );
    });

    it('does not insert a dropped file without uploadImage', () => {
        const { editor } = renderEditor({ value: paragraph('') });

        act(() => {
            editor.tf.select(editor.api.end([]) as Point);
            editor.tf.insertData({
                files: [new File(['png'], 'drop.png', { type: 'image/png' })],
                getData: () => '',
                types: ['Files'],
            } as unknown as DataTransfer);
        });

        expect(editor.children.some((node) => node.type === 'img')).toBe(false);
    });

    it('refuses a javascript: link', async () => {
        const { editor, user } = renderEditor({ value: paragraph('Опасно') });

        selectAll(editor);
        await user.click(screen.getByRole('button', { name: 'Ссылка' }));
        await user.type(
            await screen.findByRole('textbox', { name: 'Адрес ссылки' }),
            'javascript:alert(1){Enter}',
        );

        expect(JSON.stringify(editor.children)).not.toContain('"type":"a"');
    });

    it('creates an https link', async () => {
        const { editor, user } = renderEditor({ value: paragraph('Блог') });

        selectAll(editor);
        await user.click(screen.getByRole('button', { name: 'Ссылка' }));
        await user.type(
            await screen.findByRole('textbox', { name: 'Адрес ссылки' }),
            'https://president.ua/blog{Enter}',
        );

        expect(JSON.stringify(editor.children)).toContain(
            '"url":"https://president.ua/blog"',
        );
    });

    it('inserts a table after a code block, not inside it', () => {
        const { editor } = renderEditor({
            value: [
                {
                    type: 'code_block',
                    children: [
                        { type: 'code_line', children: [{ text: 'a' }] },
                    ],
                },
            ],
        });

        act(() => {
            editor.tf.select(editor.api.end([0]) as Point);
            insertBlock(editor, 'table');
        });

        expect(editor.children.map((node) => node.type)).toEqual([
            'code_block',
            'table',
            'p',
        ]);
    });

    it('inserts a table after the table the caret is in', () => {
        const { editor } = renderEditor();

        act(() => {
            editor.tf.select(editor.api.end([]) as Point);
            insertBlock(editor, 'table');
            editor.tf.select(editor.api.start([0]) as Point);
            insertBlock(editor, 'table');
        });

        expect(editor.children.map((node) => node.type)).toEqual([
            'table',
            'table',
            'p',
        ]);
    });

    it('adds a code block after a paragraph with the caret at its start', () => {
        const { editor } = renderEditor({
            value: [
                { type: 'p', children: [{ text: 'Вступление' }] },
                { type: 'h2', children: [{ text: 'Глава' }] },
            ],
        });

        act(() => {
            editor.tf.select(editor.api.start([0]) as Point);
            insertBlock(editor, 'code_block');
        });

        expect(editor.children.map((node) => node.type)).toEqual([
            'p',
            'code_block',
            'h2',
            'p',
        ]);
    });

    it('turns a code block back into text', () => {
        const { editor } = renderEditor({
            value: [
                {
                    type: 'code_block',
                    children: [
                        { type: 'code_line', children: [{ text: 'a' }] },
                    ],
                },
            ],
        });

        act(() => {
            editor.tf.select(editor.api.end([0]) as Point);
        });

        expect(getCurrentBlockType(editor)).toBe('code_block');

        act(() => {
            setBlockType(editor, 'p');
        });

        expect(editor.children[0]).toMatchObject({
            children: [{ text: 'a' }],
            type: 'p',
        });
    });

    it('drops unsafe links and images that arrive in the document', () => {
        const { editor } = renderEditor({ value: paragraph('') });

        act(() => {
            editor.tf.insertNodes(
                [
                    {
                        type: 'p',
                        children: [
                            {
                                type: 'a',
                                url: 'javascript:alert(1)',
                                children: [{ text: 'x' }],
                            },
                        ],
                    },
                    {
                        type: 'img',
                        url: 'data:image/png;base64,AAAA',
                        children: [{ text: '' }],
                    },
                ],
                { at: [1] },
            );
        });

        const json = JSON.stringify(editor.children);

        expect(json).not.toContain('javascript:');
        expect(json).not.toContain('data:image');
        expect(json).toContain('"text":"x"');
    });

    it('does not submit the surrounding form on Enter in the image description', async () => {
        const onSubmit = vi.fn((event: Event) => event.preventDefault());
        const harness = {} as Harness;
        const user = userEvent.setup();

        render(
            <form onSubmit={onSubmit as never}>
                <Editor
                    aria-label="Текст"
                    value={[
                        {
                            type: 'img',
                            url: 'https://cdn.example.com/a.png',
                            children: [{ text: '' }],
                        },
                        { type: 'p', children: [{ text: '' }] },
                    ]}
                >
                    <CaptureEditor harness={harness} />
                </Editor>
            </form>,
        );

        act(() => {
            harness.editor.tf.focus();
            harness.editor.tf.select(harness.editor.api.start([0]) as Point);
        });

        await user.type(
            await screen.findByRole('textbox', {
                name: 'Описание изображения',
            }),
            'Фасад{Enter}',
        );

        expect(onSubmit).not.toHaveBeenCalled();
        expect(harness.editor.children[0]).toMatchObject({ alt: 'Фасад' });
    });

    it('does not announce plain actions as toggles', () => {
        renderEditor();

        expect(
            screen.getByRole('button', { name: 'Отменить' }),
        ).not.toHaveAttribute('aria-pressed');
        expect(
            screen.getByRole('button', { name: 'Полужирный' }),
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('reports a failed upload and resolves relative urls', async () => {
        const onUploadError = vi.fn();
        const uploadImage = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce('/storage/cms/a.png');
        const { editor } = renderEditor({
            onUploadError,
            uploadImage,
            value: paragraph(''),
        });
        const drop = () =>
            act(() => {
                editor.tf.select(editor.api.end([]) as Point);
                editor.tf.insertData({
                    files: [new File(['png'], 'a.png', { type: 'image/png' })],
                    getData: () => '',
                    types: ['Files'],
                } as unknown as DataTransfer);
            });

        drop();
        await waitFor(() => expect(onUploadError).toHaveBeenCalled());

        drop();
        await waitFor(() =>
            expect(editor.children).toContainEqual(
                expect.objectContaining({
                    type: 'img',
                    url: `${window.location.origin}/storage/cms/a.png`,
                }),
            ),
        );
    });

    it('does not mark an empty value as changed on mount', () => {
        const onChange = vi.fn();

        renderEditor({ onChange, value: [] });

        expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the text through a round trip to a code block', () => {
        const { editor } = renderEditor({ value: paragraph('keep me') });

        act(() => {
            editor.tf.select(editor.api.end([0]) as Point);
            setBlockType(editor, 'code_block');
        });

        expect(editor.children[0]).toEqual({
            children: [
                expect.objectContaining({
                    children: [{ text: 'keep me' }],
                    type: 'code_line',
                }),
            ],
            type: 'code_block',
        });

        act(() => {
            setBlockType(editor, 'p');
        });

        expect(editor.children[0]).toMatchObject({
            children: [{ text: 'keep me' }],
            type: 'p',
        });
    });

    it('turns an empty line inside a quote into a heading in place', () => {
        const { editor } = renderEditor({
            value: [
                {
                    type: 'blockquote',
                    children: [{ type: 'p', children: [{ text: '' }] }],
                },
            ],
        });

        act(() => {
            editor.tf.select(editor.api.start([0]) as Point);
            insertBlock(editor, 'h2');
        });

        expect(editor.children.map((node) => node.type)).toEqual(['h2', 'p']);
    });
});
