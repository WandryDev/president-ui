import { createStaticEditor, PlateStatic } from 'platejs/static';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { BaseEditorKit } from '@/components/editor/base-editor-kit';
import type { EditorValue } from '@/components/editor/editor-value';
import { cn } from '@/lib/utils';

export const editorContentClassName =
    'relative w-full whitespace-break-spaces break-words text-base text-foreground [&_strong]:font-semibold';

export type EditorStaticProps = {
    value: EditorValue;
    className?: string;
};

export function EditorStatic({
    value,
    className,
}: EditorStaticProps): ReactElement {
    const editor = useMemo(
        () => createStaticEditor({ plugins: BaseEditorKit, value }),
        [value],
    );

    return (
        <PlateStatic
            className={cn(editorContentClassName, className)}
            editor={editor}
        />
    );
}
