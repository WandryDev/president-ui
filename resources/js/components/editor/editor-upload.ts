import { insertImage } from '@platejs/media';
import type { Path, PathRef, SlateEditor, TElement } from 'platejs';
import { KEYS, PathApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';
import {
    isAllowedImageUrl,
    isAllowedLinkUrl,
} from '@/components/editor/editor-url';

export type UploadImage = (file: File) => Promise<string>;

export type UploadError = (error: unknown) => void;

export class RejectedUploadUrlError extends Error {
    constructor(public url: string) {
        super(`uploadImage returned a url the editor cannot show: ${url}`);
    }
}

export const EditorUploadPlugin = createPlatePlugin({
    key: 'editorUpload',
    options: {
        onUploadError: null as UploadError | null,
        uploadImage: null as UploadImage | null,
    },
}).overrideEditor(({ editor, getOption, tf: { insertData } }) => ({
    transforms: {
        insertData(data) {
            const uploadImage = getOption('uploadImage');
            const images = imageFiles(data.files);

            if (!uploadImage || images.length === 0) {
                insertData(data);

                return;
            }

            insertUploadedImages(editor, images, uploadImage).catch(
                (error: unknown) => getOption('onUploadError')?.(error),
            );
        },
    },
}));

export const EditorUrlPolicyPlugin = createPlatePlugin({
    key: 'editorUrlPolicy',
}).overrideEditor(({ editor, tf: { normalizeNode } }) => ({
    transforms: {
        normalizeNode(entry) {
            const [node, path] = entry as [TElement, Path];

            if (node.type === KEYS.link && !isAllowedLinkUrl(node.url)) {
                editor.tf.unwrapNodes({ at: path });

                return;
            }

            if (node.type === KEYS.img && !isAllowedImageUrl(node.url)) {
                editor.tf.removeNodes({ at: path });

                return;
            }

            normalizeNode(entry);
        },
    },
}));

export function imageFiles(
    files: FileList | File[] | null | undefined,
): File[] {
    return [...(files ?? [])].filter((file) => file.type.startsWith('image/'));
}

function absoluteUrl(url: string): string {
    try {
        return new URL(url, window.location.href).href;
    } catch {
        return url;
    }
}

export async function insertUploadedImages(
    editor: SlateEditor,
    files: File[],
    uploadImage: UploadImage,
    at?: Path,
): Promise<void> {
    let target: PathRef | null = at ? editor.api.pathRef(at) : null;

    try {
        for (const file of files) {
            const url = absoluteUrl(await uploadImage(file));

            if (!isAllowedImageUrl(url)) {
                throw new RejectedUploadUrlError(url);
            }

            const path = target?.current ?? undefined;

            insertImage(
                editor,
                url,
                path ? { at: path, nextBlock: false } : undefined,
            );

            if (target && path) {
                target.unref();
                target = editor.api.pathRef(PathApi.next(path));
            }
        }
    } finally {
        target?.unref();
    }
}
