import { ImagePlus, Star, X } from 'lucide-react';
import type { ChangeEvent, DragEvent, ReactElement } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { FormField } from '@/components/form/form-field';
import type { FormFieldBaseProps } from '@/components/form/types';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentGroup,
    AttachmentMedia,
} from '@/components/ui/attachment';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DEFAULT_ACCEPT = 'image/*';
const DEFAULT_MAX_SIZE = 8 * 1024 * 1024;

export type MediaFieldProps = FormFieldBaseProps & {
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    coverLabel?: string;
};

function isImage(file: File): boolean {
    return file.type.startsWith('image/');
}

function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
        : `${Math.round(bytes / 1024)} КБ`;
}

function usePreviews(files: File[]): string[] {
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        const urls = files.map((file) => URL.createObjectURL(file));

        setPreviews(urls);

        return () => {
            for (const url of urls) {
                URL.revokeObjectURL(url);
            }
        };
    }, [files]);

    return previews;
}

function MediaControl({
    files,
    onChange,
    accept,
    maxSize,
    maxFiles,
    coverLabel,
    inputId,
    describedBy,
    invalid,
}: {
    files: File[];
    onChange: (files: File[]) => void;
    accept: string;
    maxSize: number;
    maxFiles?: number;
    coverLabel: string;
    inputId: string;
    describedBy?: string;
    invalid?: boolean;
}): ReactElement {
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [rejected, setRejected] = useState<string[]>([]);
    const previews = usePreviews(files);
    const rejectedId = useId();

    const accepted = (incoming: File[]): File[] => {
        const problems: string[] = [];

        const kept = incoming.filter((file) => {
            if (!isImage(file)) {
                problems.push(`${file.name} — не изображение`);

                return false;
            }

            if (file.size > maxSize) {
                problems.push(`${file.name} — больше ${formatSize(maxSize)}`);

                return false;
            }

            return true;
        });

        setRejected(problems);

        const room = maxFiles ? maxFiles - files.length : kept.length;

        return kept.slice(0, Math.max(room, 0));
    };

    const add = (incoming: File[]): void => {
        const next = accepted(incoming);

        if (next.length > 0) {
            onChange([...files, ...next]);
        }
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        setDragging(false);
        add([...event.dataTransfer.files]);
    };

    const handlePick = (event: ChangeEvent<HTMLInputElement>): void => {
        add([...(event.target.files ?? [])]);
        event.target.value = '';
    };

    const remove = (index: number): void => {
        onChange(files.filter((_, position) => position !== index));
    };

    const makeCover = (index: number): void => {
        const next = [...files];
        const [picked] = next.splice(index, 1);

        onChange([picked, ...next]);
    };

    const full = maxFiles !== undefined && files.length >= maxFiles;

    return (
        <div className="space-y-2">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: a drop zone; the file input inside is the keyboard path */}
            <div
                className="flex items-start gap-3"
                onDragLeave={() => setDragging(false)}
                onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                }}
                onDrop={handleDrop}
            >
                <div
                    className={cn(
                        'flex h-24 w-36 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed transition-colors',
                        dragging && 'border-ring bg-accent/40',
                        invalid && 'border-destructive/48',
                        full && 'opacity-64',
                    )}
                >
                    <input
                        accept={accept}
                        aria-describedby={
                            rejected.length > 0 ? rejectedId : describedBy
                        }
                        aria-invalid={invalid}
                        className="sr-only"
                        disabled={full}
                        id={inputId}
                        multiple
                        onChange={handlePick}
                        ref={input}
                        type="file"
                    />

                    <ImagePlus className="size-5 text-muted-foreground" />

                    <label
                        className={cn(
                            'font-medium text-xs underline underline-offset-4',
                            full ? 'cursor-not-allowed' : 'cursor-pointer',
                        )}
                        htmlFor={inputId}
                    >
                        {full ? 'Лимит достигнут' : 'Добавить'}
                    </label>

                    {files.length > 0 && maxFiles !== undefined ? (
                        <span className="text-[0.6875rem] text-muted-foreground">
                            {files.length} из {maxFiles}
                        </span>
                    ) : null}
                </div>

                {files.length > 0 ? (
                    <AttachmentGroup className="min-w-0 flex-1 py-0">
                        {files.map((file, index) => (
                            <Attachment
                                key={`${file.name}-${file.size}-${file.lastModified}`}
                                orientation="vertical"
                            >
                                <AttachmentMedia variant="image">
                                    {previews[index] ? (
                                        <img
                                            alt={file.name}
                                            src={previews[index]}
                                        />
                                    ) : null}
                                </AttachmentMedia>

                                <AttachmentActions>
                                    {index === 0 ? null : (
                                        <AttachmentAction
                                            aria-label={`Сделать обложкой: ${file.name}`}
                                            onClick={() => makeCover(index)}
                                            type="button"
                                        >
                                            <Star />
                                        </AttachmentAction>
                                    )}

                                    <AttachmentAction
                                        aria-label={`Удалить ${file.name}`}
                                        onClick={() => remove(index)}
                                        type="button"
                                    >
                                        <X />
                                    </AttachmentAction>
                                </AttachmentActions>

                                {index === 0 ? (
                                    <Badge
                                        className="absolute top-2 left-2"
                                        size="sm"
                                    >
                                        {coverLabel}
                                    </Badge>
                                ) : null}
                            </Attachment>
                        ))}
                    </AttachmentGroup>
                ) : null}
            </div>

            {rejected.length > 0 ? (
                <ul
                    className="space-y-1 text-destructive text-xs"
                    id={rejectedId}
                    role="alert"
                >
                    {rejected.map((problem) => (
                        <li key={problem}>{problem}</li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}

export function MediaField({
    accept = DEFAULT_ACCEPT,
    maxSize = DEFAULT_MAX_SIZE,
    maxFiles,
    coverLabel = 'Обложка',
    ...props
}: MediaFieldProps): ReactElement {
    return (
        <FormField {...props}>
            {({ field, ...aria }) => (
                <MediaControl
                    accept={accept}
                    coverLabel={coverLabel}
                    describedBy={aria['aria-describedby']}
                    files={Array.isArray(field.value) ? field.value : []}
                    inputId={aria.id}
                    invalid={aria['aria-invalid']}
                    maxFiles={maxFiles}
                    maxSize={maxSize}
                    onChange={field.onChange}
                />
            )}
        </FormField>
    );
}
