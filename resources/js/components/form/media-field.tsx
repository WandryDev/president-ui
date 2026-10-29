import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    FileText,
    Star,
    X,
} from 'lucide-react';
import type { ReactElement, ReactNode, Ref } from 'react';
import { useEffect, useId, useState } from 'react';
import type { DropzoneSize } from '@/components/form/dropzone';
import { Dropzone } from '@/components/form/dropzone';
import { FormField } from '@/components/form/form-field';
import { formatFileSize } from '@/components/form/format-file-size';
import type { FormFieldBaseProps } from '@/components/form/types';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
} from '@/components/ui/attachment';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DEFAULT_IMAGE_ACCEPT = 'image/*';
const DEFAULT_MAX_SIZE = 8 * 1024 * 1024;

/** A saved image passed as its URL, or a file picked to add. */
export type MediaItem = File | string;

export type MediaFieldVariant = 'image' | 'file';

/**
 * Reads an item the server already has. A `string` is taken as its URL; an
 * object is read through `id`, `url`, `name` and `size` unless a getter says
 * otherwise, e.g. `getPreviewUrl={(photo) => photo.thumb_url}`.
 */
export type MediaFieldItemAdapter<TItem> = {
    /** Stable across reorders. Defaults to the URL, or to `id`. */
    getKey?: (item: TItem) => string;
    /** The thumbnail of the `image` variant. Defaults to the URL, or to `url`. */
    getPreviewUrl?: (item: TItem) => string | null | undefined;
    /** Names the item in its row and in the action labels. */
    getName?: (item: TItem) => string;
    /** Bytes, shown next to the name in the `file` variant. */
    getSize?: (item: TItem) => number | null | undefined;
    /** A download link on the name in the `file` variant. */
    getHref?: (item: TItem) => string | null | undefined;
};

export type MediaFieldProps<TItem = string> = FormFieldBaseProps &
    MediaFieldItemAdapter<TItem> & {
        /** `image` shows thumbnails; `file` shows rows with a name and a size, for PDF or Word documents. */
        variant?: MediaFieldVariant;
        /** Defaults to `image/*` for images and to any file for documents. */
        accept?: string;
        maxSize?: number;
        maxFiles?: number;
        /** Marks the first item as the cover and offers to make any other one the cover. On by default for images. */
        cover?: boolean;
        coverLabel?: string;
        /** Adds buttons that move an item one place earlier or later. */
        reorderable?: boolean;
        /** Defaults to a tile next to the thumbnails for images, a wide block for documents. */
        dropzoneSize?: DropzoneSize;
        /** The hint inside a wide drop zone. */
        dropzoneHint?: ReactNode;
    };

type ItemView = {
    key: string;
    name: string;
    size: number | null;
    href: string | null;
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

function nameFromUrl(url: string): string {
    const path = url.split(/[?#]/)[0];
    const name = path.slice(path.lastIndexOf('/') + 1);

    try {
        return decodeURIComponent(name) || url;
    } catch {
        return name || url;
    }
}

function fileKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

function readString(item: unknown, key: string): string | null {
    if (typeof item !== 'object' || item === null) {
        return null;
    }

    const value = (item as Record<string, unknown>)[key];

    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : null;
}

function defaultUrl(item: unknown): string | null {
    return typeof item === 'string' ? item : readString(item, 'url');
}

function defaultKey(item: unknown): string {
    return (
        defaultUrl(item) ??
        readString(item, 'id') ??
        readString(item, 'name') ??
        ''
    );
}

function defaultName(item: unknown): string {
    const name = readString(item, 'name');

    if (name !== null) {
        return name;
    }

    const url = defaultUrl(item);

    return url === null ? defaultKey(item) : nameFromUrl(url);
}

function defaultSize(item: unknown): number | null {
    if (typeof item !== 'object' || item === null) {
        return null;
    }

    const size = (item as Record<string, unknown>).size;

    return typeof size === 'number' ? size : null;
}

/** Duplicates (the same URL twice) still need distinct React keys. */
function uniqueKeys(keys: string[]): string[] {
    const seen = new Map<string, number>();

    return keys.map((key) => {
        const count = seen.get(key) ?? 0;

        seen.set(key, count + 1);

        return count === 0 ? key : `${key}#${count}`;
    });
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
    const next = [...items];
    const [moved] = next.splice(from, 1);

    next.splice(to, 0, moved);

    return next;
}

/** Object URLs for the picked files, alive for as long as the files are listed. */
function useFilePreviews(
    items: unknown[],
    isEnabled: boolean,
): Map<File, string> {
    const [previews, setPreviews] = useState(() => new Map<File, string>());

    useEffect(() => {
        const files = isEnabled
            ? items.filter((item): item is File => item instanceof File)
            : [];
        const next = new Map(
            files.map((file): [File, string] => [
                file,
                URL.createObjectURL(file),
            ]),
        );

        setPreviews(next);

        return () => {
            for (const url of next.values()) {
                URL.revokeObjectURL(url);
            }
        };
    }, [items, isEnabled]);

    return previews;
}

type ItemActionsProps = {
    view: ItemView;
    index: number;
    count: number;
    variant: MediaFieldVariant;
    cover: boolean;
    reorderable: boolean;
    disabled: boolean;
    onMove: (from: number, to: number) => void;
    onRemove: (index: number) => void;
};

function MoveActions({
    view,
    index,
    count,
    variant,
    disabled,
    onMove,
}: Omit<ItemActionsProps, 'cover' | 'reorderable' | 'onRemove'>): ReactElement {
    const isList = variant === 'file';

    return (
        <>
            <AttachmentAction
                aria-label={`Переместить раньше: ${view.name}`}
                disabled={disabled || index === 0}
                onClick={() => onMove(index, index - 1)}
                type="button"
            >
                {isList ? <ChevronUp /> : <ChevronLeft />}
            </AttachmentAction>
            <AttachmentAction
                aria-label={`Переместить позже: ${view.name}`}
                disabled={disabled || index === count - 1}
                onClick={() => onMove(index, index + 1)}
                type="button"
            >
                {isList ? <ChevronDown /> : <ChevronRight />}
            </AttachmentAction>
        </>
    );
}

function CoverAction({
    view,
    index,
    disabled,
    onMove,
}: Pick<
    ItemActionsProps,
    'view' | 'index' | 'disabled' | 'onMove'
>): ReactElement | null {
    if (index === 0) {
        return null;
    }

    return (
        <AttachmentAction
            aria-label={`Сделать обложкой: ${view.name}`}
            disabled={disabled}
            onClick={() => onMove(index, 0)}
            type="button"
        >
            <Star />
        </AttachmentAction>
    );
}

function RemoveAction({
    view,
    index,
    disabled,
    onRemove,
}: Pick<
    ItemActionsProps,
    'view' | 'index' | 'disabled' | 'onRemove'
>): ReactElement {
    return (
        <AttachmentAction
            aria-label={`Удалить ${view.name}`}
            disabled={disabled}
            onClick={() => onRemove(index)}
            type="button"
        >
            <X />
        </AttachmentAction>
    );
}

function ImageTile({
    preview,
    coverLabel,
    ...props
}: ItemActionsProps & {
    preview: string | null;
    coverLabel: string;
}): ReactElement {
    const { view, index, cover, reorderable } = props;

    return (
        <Attachment data-key={view.key} orientation="vertical">
            <AttachmentMedia variant="image">
                {preview ? <img alt={view.name} src={preview} /> : null}
            </AttachmentMedia>

            <AttachmentActions>
                {cover ? <CoverAction {...props} /> : null}
                <RemoveAction {...props} />
            </AttachmentActions>

            {reorderable ? (
                <AttachmentContent className="flex justify-center gap-1">
                    <MoveActions {...props} />
                </AttachmentContent>
            ) : null}

            {cover && index === 0 ? (
                <Badge className="absolute top-2 left-2" size="sm">
                    {coverLabel}
                </Badge>
            ) : null}
        </Attachment>
    );
}

function FileRow({
    coverLabel,
    ...props
}: ItemActionsProps & { coverLabel: string }): ReactElement {
    const { view, index, cover, reorderable } = props;

    return (
        <Attachment className="w-full" data-key={view.key}>
            <AttachmentMedia>
                <FileText />
            </AttachmentMedia>

            <AttachmentContent>
                <AttachmentTitle className="flex items-center gap-2">
                    {view.href ? (
                        <a
                            className="truncate underline-offset-4 hover:underline"
                            download
                            href={view.href}
                        >
                            {view.name}
                        </a>
                    ) : (
                        <span className="truncate">{view.name}</span>
                    )}
                    {cover && index === 0 ? (
                        <Badge size="sm">{coverLabel}</Badge>
                    ) : null}
                </AttachmentTitle>
                {view.size === null ? null : (
                    <AttachmentDescription>
                        {formatFileSize(view.size)}
                    </AttachmentDescription>
                )}
            </AttachmentContent>

            <AttachmentActions className="gap-0.5">
                {reorderable ? <MoveActions {...props} /> : null}
                {cover ? <CoverAction {...props} /> : null}
                <RemoveAction {...props} />
            </AttachmentActions>
        </Attachment>
    );
}

type MediaControlProps<TItem> = Required<
    Pick<MediaFieldItemAdapter<TItem>, 'getKey' | 'getName'>
> &
    Pick<
        MediaFieldItemAdapter<TItem>,
        'getPreviewUrl' | 'getSize' | 'getHref'
    > & {
        items: (File | TItem)[];
        onChange: (items: (File | TItem)[]) => void;
        onBlur: () => void;
        inputRef: Ref<HTMLInputElement>;
        variant: MediaFieldVariant;
        accept?: string;
        maxSize: number;
        maxFiles?: number;
        cover: boolean;
        coverLabel: string;
        reorderable: boolean;
        dropzoneSize: DropzoneSize;
        dropzoneHint?: ReactNode;
        disabled: boolean;
        inputId: string;
        describedBy?: string;
        ariaLabel?: string;
        invalid?: boolean;
    };

function MediaControl<TItem>({
    items,
    onChange,
    onBlur,
    inputRef,
    variant,
    accept,
    maxSize,
    maxFiles,
    cover,
    coverLabel,
    reorderable,
    dropzoneSize,
    dropzoneHint,
    disabled,
    inputId,
    describedBy,
    ariaLabel,
    invalid,
    getKey,
    getName,
    getPreviewUrl,
    getSize,
    getHref,
}: MediaControlProps<TItem>): ReactElement {
    const [rejected, setRejected] = useState<string[]>([]);
    const rejectedId = useId();
    const isImageVariant = variant === 'image';
    const filePreviews = useFilePreviews(items, isImageVariant);

    const keyOf = (item: File | TItem): string =>
        item instanceof File ? fileKey(item) : getKey(item);

    const keys = uniqueKeys(items.map(keyOf));

    const previewOf = (item: File | TItem): string | null =>
        item instanceof File
            ? (filePreviews.get(item) ?? null)
            : ((getPreviewUrl ?? defaultUrl)(item) ?? null);

    const views: ItemView[] = items.map((item, index) =>
        item instanceof File
            ? {
                  href: null,
                  key: keys[index],
                  name: item.name,
                  size: item.size,
              }
            : {
                  href: (getHref ?? defaultUrl)(item) ?? null,
                  key: keys[index],
                  name: getName(item),
                  size: (getSize ?? defaultSize)(item) ?? null,
              },
    );

    const add = (incoming: File[]): void => {
        const problems: string[] = [];
        const known = new Set(items.map(keyOf));

        const kept = incoming.filter((file) => {
            if (isImageVariant && !isImage(file)) {
                problems.push(`${file.name} — не изображение`);

                return false;
            }

            if (accept && !matchesAccept(file, accept)) {
                problems.push(`${file.name} — неподходящий формат`);

                return false;
            }

            if (file.size > maxSize) {
                problems.push(
                    `${file.name} — больше ${formatFileSize(maxSize)}`,
                );

                return false;
            }

            // The same file picked twice is added once.
            if (known.has(fileKey(file))) {
                return false;
            }

            known.add(fileKey(file));

            return true;
        });

        const room =
            maxFiles === undefined
                ? kept.length
                : Math.max(maxFiles - items.length, 0);

        if (kept.length > room) {
            problems.push(`Не больше ${maxFiles} — лишние файлы не добавлены`);
        }

        setRejected(problems);

        if (room > 0 && kept.length > 0) {
            onChange([...items, ...kept.slice(0, room)]);
        }
    };

    const move = (from: number, to: number): void => {
        onChange(moveItem(items, from, to));
    };

    const remove = (index: number): void => {
        onChange(items.filter((_, position) => position !== index));
    };

    const isFull = maxFiles !== undefined && items.length >= maxFiles;
    const isCompact = dropzoneSize === 'compact';

    const actionProps = {
        count: items.length,
        cover,
        disabled,
        onMove: move,
        onRemove: remove,
        reorderable,
        variant,
    };

    const dropzone = (
        <Dropzone
            accept={accept}
            aria-describedby={rejected.length > 0 ? rejectedId : describedBy}
            aria-label={ariaLabel}
            buttonLabel={
                isFull
                    ? 'Лимит достигнут'
                    : isCompact
                      ? 'Добавить'
                      : 'Выберите файлы'
            }
            disabled={disabled || isFull}
            hint={dropzoneHint}
            icon={isImageVariant ? undefined : <FileText />}
            inputId={inputId}
            inputRef={inputRef}
            invalid={invalid}
            multiple={maxFiles !== 1}
            onBlur={onBlur}
            onFiles={add}
            size={dropzoneSize}
        >
            {items.length > 0 && maxFiles !== undefined ? (
                <span className="text-[0.6875rem] text-muted-foreground">
                    {items.length} из {maxFiles}
                </span>
            ) : null}
        </Dropzone>
    );

    const list =
        items.length === 0 ? null : isImageVariant ? (
            <AttachmentGroup
                className={cn('min-w-0 py-0', isCompact && 'flex-1')}
            >
                {views.map((view, index) => (
                    <ImageTile
                        {...actionProps}
                        coverLabel={coverLabel}
                        index={index}
                        key={view.key}
                        preview={previewOf(items[index])}
                        view={view}
                    />
                ))}
            </AttachmentGroup>
        ) : (
            <ul className="flex w-full flex-col gap-2">
                {views.map((view, index) => (
                    <li key={view.key}>
                        <FileRow
                            {...actionProps}
                            coverLabel={coverLabel}
                            index={index}
                            view={view}
                        />
                    </li>
                ))}
            </ul>
        );

    return (
        <div className="flex w-full flex-col gap-2">
            {isCompact ? (
                <div className="flex items-start gap-3">
                    {dropzone}
                    {list}
                </div>
            ) : (
                <>
                    {list}
                    {dropzone}
                </>
            )}

            {rejected.length > 0 ? (
                <ul
                    className="flex flex-col gap-1 text-destructive text-xs"
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

/**
 * Images or documents of a form, kept in form state as one ordered list:
 * items the server already has (URLs, or records read through the adapter
 * getters) next to `File`s picked to add. Removing, reordering and adding all
 * travel with the form.
 */
export function MediaField<TItem = string>({
    name,
    label,
    labelAction,
    'aria-label': ariaLabel,
    description,
    className,
    orientation,
    disabled,
    variant = 'image',
    accept = variant === 'image' ? DEFAULT_IMAGE_ACCEPT : undefined,
    maxSize = DEFAULT_MAX_SIZE,
    maxFiles,
    cover = variant === 'image',
    coverLabel = 'Обложка',
    reorderable = false,
    dropzoneSize = variant === 'image' ? 'compact' : 'default',
    dropzoneHint,
    getKey = defaultKey,
    getName = defaultName,
    getPreviewUrl,
    getSize,
    getHref,
}: MediaFieldProps<TItem>): ReactElement {
    return (
        <FormField
            aria-label={ariaLabel}
            className={className}
            description={description}
            disabled={disabled}
            label={label}
            labelAction={labelAction}
            name={name}
            orientation={orientation}
        >
            {({ field, ...aria }) => (
                <MediaControl<TItem>
                    accept={accept}
                    ariaLabel={aria['aria-label']}
                    cover={cover}
                    coverLabel={coverLabel}
                    describedBy={aria['aria-describedby']}
                    disabled={Boolean(field.disabled)}
                    dropzoneHint={dropzoneHint}
                    dropzoneSize={dropzoneSize}
                    getHref={getHref}
                    getKey={getKey}
                    getName={getName}
                    getPreviewUrl={getPreviewUrl}
                    getSize={getSize}
                    inputId={aria.id}
                    inputRef={field.ref}
                    invalid={aria['aria-invalid']}
                    items={Array.isArray(field.value) ? field.value : []}
                    maxFiles={maxFiles}
                    maxSize={maxSize}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    reorderable={reorderable}
                    variant={variant}
                />
            )}
        </FormField>
    );
}
