import type { ReactElement } from 'react';
import type { EditorProps } from '@/components/editor/editor';
import { Editor } from '@/components/editor/editor';
import { FormField } from '@/components/form/form-field';
import type { FormFieldBaseProps } from '@/components/form/types';

export type EditorFieldProps = FormFieldBaseProps &
    Pick<
        EditorProps,
        | 'placeholder'
        | 'uploadImage'
        | 'onUploadError'
        | 'contentClassName'
        | 'children'
    > & {
        editorClassName?: string;
    };

export function EditorField({
    placeholder,
    uploadImage,
    onUploadError,
    contentClassName,
    editorClassName,
    children,
    ...props
}: EditorFieldProps): ReactElement {
    return (
        <FormField {...props}>
            {({ field, ...aria }) => (
                <Editor
                    {...aria}
                    aria-label={
                        aria['aria-label'] ??
                        (typeof props.label === 'string'
                            ? props.label
                            : undefined)
                    }
                    className={editorClassName}
                    contentClassName={contentClassName}
                    disabled={field.disabled}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    placeholder={placeholder}
                    onUploadError={onUploadError}
                    uploadImage={uploadImage}
                    value={field.value}
                >
                    {children}
                </Editor>
            )}
        </FormField>
    );
}
