import type { PlateContentProps } from 'platejs/react';
import {
    Plate,
    PlateContainer,
    PlateContent,
    usePlateEditor,
} from 'platejs/react';
import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';
import { EditorKit } from '@/components/editor/editor-kit';
import { editorContentClassName } from '@/components/editor/editor-static';
import type {
    UploadError,
    UploadImage,
} from '@/components/editor/editor-upload';
import { EditorUploadPlugin } from '@/components/editor/editor-upload';
import type { EditorValue } from '@/components/editor/editor-value';
import { EMPTY_EDITOR_VALUE } from '@/components/editor/editor-value';
import { FixedToolbar } from '@/components/editor/fixed-toolbar';
import { cn } from '@/lib/utils';

export type EditorProps = Pick<
    PlateContentProps,
    | 'id'
    | 'aria-label'
    | 'aria-labelledby'
    | 'aria-describedby'
    | 'aria-invalid'
    | 'onBlur'
    | 'placeholder'
    | 'name'
> & {
    value?: EditorValue | null;
    onChange?: (value: EditorValue) => void;
    uploadImage?: UploadImage;
    onUploadError?: UploadError;
    disabled?: boolean;
    className?: string;
    contentClassName?: string;
    children?: ReactNode;
};

export function Editor({
    value,
    onChange,
    uploadImage,
    onUploadError,
    disabled = false,
    placeholder = 'Начните писать или нажмите / для вставки блока',
    className,
    contentClassName,
    children,
    ...contentProps
}: EditorProps): ReactElement {
    const editor = usePlateEditor({
        plugins: EditorKit,
        value: value && value.length > 0 ? value : EMPTY_EDITOR_VALUE,
    });

    useEffect(() => {
        editor.setOption(
            EditorUploadPlugin,
            'uploadImage',
            uploadImage ?? null,
        );
        editor.setOption(
            EditorUploadPlugin,
            'onUploadError',
            onUploadError ?? null,
        );
    }, [editor, onUploadError, uploadImage]);

    useEffect(() => {
        if (!value || value === editor.children) {
            return;
        }

        const next = value.length > 0 ? value : EMPTY_EDITOR_VALUE;

        if (JSON.stringify(next) === JSON.stringify(editor.children)) {
            return;
        }

        editor.tf.setValue(next);
    }, [editor, value]);

    return (
        <Plate
            editor={editor}
            onValueChange={({ value: next }) => onChange?.(next)}
            readOnly={disabled}
        >
            <div
                className={cn(
                    'relative w-full rounded-lg border border-input bg-background not-dark:bg-clip-padding shadow-xs/5 transition-shadow has-[[data-slate-editor]:focus-visible]:border-ring has-aria-invalid:border-destructive/36 has-[[data-slate-editor]:focus-visible]:ring-[3px] has-[[data-slate-editor]:focus-visible]:ring-ring/24 dark:bg-input/32',
                    disabled && 'opacity-64',
                    className,
                )}
                data-slot="editor"
            >
                {disabled ? null : <FixedToolbar />}
                <PlateContainer className="relative">
                    <PlateContent
                        {...contentProps}
                        className={cn(
                            editorContentClassName,
                            'min-h-80 px-5 pt-4 pb-16 outline-none sm:px-12 [&_[data-slate-placeholder]]:text-muted-foreground/72 [&_[data-slate-placeholder]]:opacity-100!',
                            contentClassName,
                        )}
                        disableDefaultStyles
                        placeholder={placeholder}
                    />
                </PlateContainer>
            </div>
            {children}
        </Plate>
    );
}
