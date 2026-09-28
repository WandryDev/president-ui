import { insertImage } from '@platejs/media';
import { ImagePlus, Upload } from 'lucide-react';
import { useEditorRef, usePluginOption } from 'platejs/react';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useId, useRef, useState } from 'react';
import { EditorToolbarButton } from '@/components/editor/editor-toolbar';
import {
    EditorUploadPlugin,
    imageFiles,
    insertUploadedImages,
} from '@/components/editor/editor-upload';
import { isAllowedImageUrl } from '@/components/editor/editor-url';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover';

export function ImageToolbarButton(): ReactElement {
    const editor = useEditorRef();
    const uploadImage = usePluginOption(EditorUploadPlugin, 'uploadImage');
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const errorId = useId();

    const reset = (): void => {
        setOpen(false);
        setUrl('');
        setError(null);
    };

    const close = (): void => {
        reset();
        editor.tf.focus();
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        event.stopPropagation();

        if (!isAllowedImageUrl(url)) {
            setError('Ссылка должна начинаться с http:// или https://');

            return;
        }

        insertImage(editor, url.trim());
        close();
    };

    const upload = async (
        event: ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        const files = imageFiles(event.target.files);

        event.target.value = '';

        if (!uploadImage || files.length === 0) {
            return;
        }

        setUploading(true);

        try {
            await insertUploadedImages(editor, files, uploadImage);
            close();
        } catch (uploadError) {
            setError('Не удалось загрузить изображение');
            editor.getOption(
                EditorUploadPlugin,
                'onUploadError',
            )?.(uploadError);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Popover
            onOpenChange={(next) => (next ? setOpen(true) : reset())}
            open={open}
        >
            <PopoverTrigger
                render={
                    <EditorToolbarButton label="Изображение">
                        <ImagePlus />
                    </EditorToolbarButton>
                }
            />
            <PopoverPopup align="start" className="w-80">
                <form className="flex flex-col gap-2" onSubmit={submit}>
                    <Input
                        aria-describedby={error ? errorId : undefined}
                        aria-invalid={error ? true : undefined}
                        aria-label="Ссылка на изображение"
                        autoFocus
                        onChange={(event) => {
                            setUrl(event.target.value);
                            setError(null);
                        }}
                        placeholder="https://"
                        value={url}
                    />
                    {error ? (
                        <p
                            className="text-destructive-foreground text-xs"
                            id={errorId}
                        >
                            {error}
                        </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                        {uploadImage ? (
                            <>
                                <input
                                    accept="image/*"
                                    aria-label="Файл изображения"
                                    className="sr-only"
                                    onChange={upload}
                                    ref={fileInput}
                                    type="file"
                                />
                                <Button
                                    loading={uploading}
                                    onClick={() => fileInput.current?.click()}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Upload />
                                    Загрузить файл
                                </Button>
                            </>
                        ) : (
                            <span />
                        )}
                        <Button size="sm" type="submit">
                            Вставить
                        </Button>
                    </div>
                </form>
            </PopoverPopup>
        </Popover>
    );
}
