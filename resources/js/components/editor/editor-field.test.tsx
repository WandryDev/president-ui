import { act, screen } from '@testing-library/react';
import type { Point } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import { useEditorRef } from 'platejs/react';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EditorField } from '@/components/editor/editor-field';
import {
    EMPTY_EDITOR_VALUE,
    isEditorValueEmpty,
} from '@/components/editor/editor-value';
import {
    didSubmit,
    renderForm,
    respondWithErrors,
    submitForm,
    submittedData,
} from '@/test/form-harness';

const schema = z.object({
    content: z
        .array(z.any())
        .refine((value) => !isEditorValueEmpty(value), 'Напишите текст'),
});

type Harness = { editor: PlateEditor };

function CaptureEditor({ harness }: { harness: Harness }): null {
    harness.editor = useEditorRef();

    return null;
}

function renderEditorField() {
    const harness = {} as Harness;
    const result = renderForm({
        children: (
            <EditorField label="Текст" name="content">
                <CaptureEditor harness={harness} />
            </EditorField>
        ),
        defaultValues: { content: EMPTY_EDITOR_VALUE },
        schema,
    });

    return { ...result, harness };
}

describe('EditorField', () => {
    it('names the editor after its label', () => {
        renderEditorField();

        expect(
            screen.getByRole('textbox', { name: 'Текст' }),
        ).toBeInTheDocument();
    });

    it('submits the typed text as an editor document', async () => {
        const { user, harness } = renderEditorField();

        act(() => {
            harness.editor.tf.select(harness.editor.api.end([]) as Point);
            harness.editor.tf.insertText('Квартира у моря');
        });
        await submitForm(user);

        expect(submittedData().content).toEqual([
            expect.objectContaining({
                children: [{ text: 'Квартира у моря' }],
                type: 'p',
            }),
        ]);
    });

    it('shows the schema error under the editor', async () => {
        const { user } = renderEditorField();

        await submitForm(user);

        expect(didSubmit()).toBe(false);
        expect(screen.getByText('Напишите текст')).toBeInTheDocument();
    });

    it('shows a server error under the editor', async () => {
        const { user, harness } = renderEditorField();

        act(() => {
            harness.editor.tf.select(harness.editor.api.end([]) as Point);
            harness.editor.tf.insertText('Текст');
        });
        await submitForm(user);
        await respondWithErrors({ content: 'Текст слишком короткий' });

        expect(screen.getByText('Текст слишком короткий')).toBeInTheDocument();
    });
});
