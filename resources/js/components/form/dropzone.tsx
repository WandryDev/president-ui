import { ImagePlus } from 'lucide-react';
import type {
    ChangeEvent,
    DragEvent,
    ReactElement,
    ReactNode,
    Ref,
} from 'react';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DropzoneSize = 'default' | 'compact';

export type DropzoneProps = {
    /** Receives the files dropped or picked; the zone itself keeps nothing. */
    onFiles: (files: File[]) => void;
    /** Narrows the file picker. Dropped files are not filtered: the caller checks them. */
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /**
     * `default` is a wide block with a hint and a button; `compact` is a small
     * tile that sits next to a row of thumbnails.
     */
    size?: DropzoneSize;
    /** Defaults to an image icon. */
    icon?: ReactNode;
    /** The hint of the `default` size, replaced while files are dragged over. */
    hint?: ReactNode;
    draggingHint?: ReactNode;
    /** The text of the button, or of the link in a `compact` tile. */
    buttonLabel?: ReactNode;
    /** Rendered under the button, e.g. «3 из 10». */
    children?: ReactNode;
    /** Points a field label at the file input. */
    inputId?: string;
    inputRef?: Ref<HTMLInputElement>;
    onBlur?: () => void;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-label'?: string;
    className?: string;
};

/**
 * Where files are dropped or picked. The file input stays in the tab order
 * (visually hidden, its label styled as the button), so the field label,
 * description and error reach it as they reach any other control.
 */
export function Dropzone({
    onFiles,
    accept,
    multiple = true,
    disabled = false,
    invalid = false,
    size = 'default',
    icon,
    hint = 'Перетащите файлы сюда или',
    draggingHint = 'Отпустите, чтобы добавить',
    buttonLabel = size === 'compact' ? 'Добавить' : 'Выберите файлы',
    children,
    inputId,
    inputRef,
    onBlur,
    'aria-describedby': describedBy,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    className,
}: DropzoneProps): ReactElement {
    const [isDragging, setIsDragging] = useState(false);
    const isCompact = size === 'compact';

    const pick = (event: ChangeEvent<HTMLInputElement>): void => {
        const files = [...(event.target.files ?? [])];

        event.target.value = '';

        if (files.length > 0) {
            onFiles(files);
        }
    };

    const drop = (event: DragEvent<HTMLDivElement>): void => {
        event.preventDefault();
        setIsDragging(false);

        const files = [...event.dataTransfer.files];

        if (!disabled && files.length > 0) {
            onFiles(multiple ? files : files.slice(0, 1));
        }
    };

    const input = (
        <input
            accept={accept}
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid || invalid || undefined}
            aria-label={ariaLabel}
            className="sr-only"
            disabled={disabled}
            id={inputId}
            multiple={multiple}
            onBlur={onBlur}
            onChange={pick}
            ref={inputRef}
            type="file"
        />
    );

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: a drop zone; the file input inside is the keyboard path
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed text-center transition-[color,background-color,border-color,box-shadow] has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/24',
                isCompact
                    ? 'h-24 w-36 shrink-0 gap-1.5'
                    : 'w-full gap-3 px-4 py-8',
                isDragging && 'border-ring bg-accent/40',
                invalid && 'border-destructive/48',
                disabled && 'opacity-64',
                className,
            )}
            data-dragging={isDragging || undefined}
            data-slot="dropzone"
            onDragLeave={() => {
                setIsDragging(false);
            }}
            onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(!disabled);
            }}
            onDrop={drop}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'text-muted-foreground [&_svg]:pointer-events-none',
                    isCompact
                        ? '[&_svg:not([class*=size-])]:size-5'
                        : '[&_svg:not([class*=size-])]:size-6',
                )}
            >
                {icon ?? <ImagePlus />}
            </span>

            {isCompact ? null : (
                <p className="text-muted-foreground text-sm">
                    {isDragging ? draggingHint : hint}
                </p>
            )}

            <label
                className={cn(
                    isCompact
                        ? 'font-medium text-xs underline underline-offset-4'
                        : buttonVariants({ size: 'sm', variant: 'outline' }),
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                )}
                htmlFor={inputId}
            >
                {buttonLabel}
                {input}
            </label>

            {children}
        </div>
    );
}
