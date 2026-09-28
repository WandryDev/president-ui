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

export type MediaItem = File | string;

export type MediaFieldProps = FormFieldBaseProps & {
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    coverLabel?: string;
};

function isImage(file: File): boolean {
    return file.type.startsWith('image/');
}

function matchesAccept(file: File, accept: string): boolean {
    const patterns = accept
        .split(',')
        .map((pattern) => pattern.trim().toLowerCase())
        .filter(Boolean);

    if (patterns.length === 0) {
        return true;
    }

    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    return patterns.some((pattern) => {
        if (pattern.startsWith('.')) {
            return name.endsWith(pattern);
        }

        if (pattern.endsWith('/*')) {
            return type.startsWith(pattern.slice(0, -1));
        }

        return type === pattern;
    });
}

function itemName(item: MediaItem): string {
    if (typeof item !== 'string') {
        return item.name;
    }

    const path = item.split(/[?#]/)[0];
    const name = path.slice(path.lastIndexOf('/') + 1);

    try {
        return decodeURIComponent(name) || item;
    } catch {
        return name || item;
    }
}

function itemKey(item: MediaItem): string {
    return typeof item === 'string'
        ? item
        : `${item.name}-${item.size}-${item.lastModified}`;
}

function uniqueKeys(items: MediaItem[]): string[] {
    const seen = new Map<string, number>();

    return items.map((item) => {
        const key = itemKey(item);
        const count = seen.get(key) ?? 0;

        seen.set(key, count + 1);

        return count === 0 ? key : `${key}#${count}`;
    });
}

function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
        ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
        : `${Math.round(bytes / 1024)} КБ`;
}

function usePreviews(items: MediaItem[]): string[] {
    const [previews, setPreviews] = useState<string[]>([]);

    useEffect(() => {
        const created: string[] = [];
        const urls = items.map((item) => {
            if (typeof item === 'string') {
                return item;
            }

            const url = URL.createObjectURL(item);

            created.push(url);

            return url;
        });

        setPreviews(urls);

        return () => {
            for (const url of created) {
                URL.revokeObjectURL(url);
            }
        };
    }, [items]);

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
    ariaLabel,
    invalid,
}: {
    files: MediaItem[];
    onChange: (files: MediaItem[]) => void;
    accept: string;
    maxSize: number;
    maxFiles?: number;
    coverLabel: string;
    inputId: string;
    describedBy?: string;
    ariaLabel?: string;
    invalid?: boolean;
}): ReactElement {
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [rejected, setRejected] = useState<string[]>([]);
    const previews = usePreviews(files);
    const keys = uniqueKeys(files);
    const rejectedId = useId();

    const accepted = (incoming: File[]): File[] => {
        const problems: string[] = [];

        const kept = incoming.filter((file) => {
            if (!isImage(file)) {
                problems.push(`${file.name} — не изображение`);

                return false;
            }

            if (!matchesAccept(file, accept)) {
                problems.push(`${file.name} — неподходящий формат`);

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
                        aria-label={ariaLabel}
                        className="sr-only"
                        disabled={full}
                        id={inputId}
                        multiple={maxFiles !== 1}
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
                                key={keys[index]}
                                orientation="vertical"
                            >
                                <AttachmentMedia variant="image">
                                    {previews[index] ? (
                                        <img
                                            alt={itemName(file)}
                                            src={previews[index]}
                                        />
                                    ) : null}
                                </AttachmentMedia>

                                <AttachmentActions>
                                    {index === 0 ? null : (
                                        <AttachmentAction
                                            aria-label={`Сделать обложкой: ${itemName(file)}`}
                                            onClick={() => makeCover(index)}
                                            type="button"
                                        >
                                            <Star />
                                        </AttachmentAction>
                                    )}

                                    <AttachmentAction
                                        aria-label={`Удалить ${itemName(file)}`}
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
                    ariaLabel={aria['aria-label']}
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
