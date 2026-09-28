import type { UseVirtualFloatingOptions } from '@platejs/floating';
import { flip, offset } from '@platejs/floating';
import { getLinkAttributes } from '@platejs/link';
import {
    FloatingLinkUrlInput,
    useFloatingLinkEdit,
    useFloatingLinkEditState,
    useFloatingLinkInsert,
    useFloatingLinkInsertState,
    useLinkToolbarButton,
    useLinkToolbarButtonState,
} from '@platejs/link/react';
import { ExternalLink, Link, Text, Unlink } from 'lucide-react';
import type { TLinkElement } from 'platejs';
import { KEYS } from 'platejs';
import {
    useEditorRef,
    useEditorSelection,
    useFormInputProps,
} from 'platejs/react';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { EditorToolbarButton } from '@/components/editor/editor-toolbar';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const floatingOptions: UseVirtualFloatingOptions = {
    middleware: [
        offset(8),
        flip({
            fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
            padding: 12,
        }),
    ],
    placement: 'bottom-start',
};

const popoverClassName =
    'z-50 w-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg/5 outline-hidden';

const inputClassName =
    'flex h-8 w-full rounded-md border-none bg-transparent px-1.5 text-base outline-none placeholder:text-muted-foreground sm:text-sm';

export function LinkToolbarButton(): ReactElement {
    const state = useLinkToolbarButtonState();
    const { props } = useLinkToolbarButton(state);

    return (
        <EditorToolbarButton
            data-plate-focus
            label="Ссылка"
            onClick={props.onClick}
            pressed={props.pressed}
        >
            <Link />
        </EditorToolbarButton>
    );
}

function LinkOpenButton(): ReactElement | null {
    const editor = useEditorRef();
    const selection = useEditorSelection();

    const href = useMemo(() => {
        if (!selection) {
            return undefined;
        }

        const entry = editor.api.node<TLinkElement>({
            match: { type: editor.getType(KEYS.link) },
        });

        return entry ? getLinkAttributes(editor, entry[0]).href : undefined;
    }, [editor, selection]);

    if (!href) {
        return null;
    }

    return (
        <a
            aria-label="Открыть ссылку"
            className={buttonVariants({ size: 'icon-sm', variant: 'ghost' })}
            href={href}
            rel="noopener noreferrer"
            target="_blank"
        >
            <ExternalLink />
        </a>
    );
}

export function LinkFloatingToolbar(): ReactElement | null {
    const insertState = useFloatingLinkInsertState({ floatingOptions });
    const {
        hidden,
        props: insertProps,
        ref: insertRef,
        textInputProps,
    } = useFloatingLinkInsert(insertState);

    const editState = useFloatingLinkEditState({ floatingOptions });
    const {
        editButtonProps,
        props: editProps,
        ref: editRef,
        unlinkButtonProps,
    } = useFloatingLinkEdit(editState);

    const inputProps = useFormInputProps({
        preventDefaultOnEnterKeydown: true,
    });

    if (hidden) {
        return null;
    }

    const input = (
        <div className="flex w-[330px] flex-col" {...inputProps}>
            <div className="flex items-center">
                <Link className="mx-2 size-4 shrink-0 text-muted-foreground" />
                <FloatingLinkUrlInput
                    aria-label="Адрес ссылки"
                    className={inputClassName}
                    data-plate-focus
                    placeholder="https://"
                />
            </div>
            <Separator className="my-1" />
            <div className="flex items-center">
                <Text className="mx-2 size-4 shrink-0 text-muted-foreground" />
                <input
                    aria-label="Текст ссылки"
                    className={inputClassName}
                    data-plate-focus
                    placeholder="Текст ссылки"
                    {...textInputProps}
                />
            </div>
        </div>
    );

    const editContent = editState.isEditing ? (
        input
    ) : (
        <div className="flex items-center gap-0.5">
            <button
                className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                type="button"
                {...editButtonProps}
            >
                Изменить
            </button>
            <Separator className="h-5" orientation="vertical" />
            <LinkOpenButton />
            <button
                aria-label="Убрать ссылку"
                className={buttonVariants({
                    size: 'icon-sm',
                    variant: 'ghost',
                })}
                type="button"
                {...unlinkButtonProps}
            >
                <Unlink />
            </button>
        </div>
    );

    return (
        <>
            <div className={popoverClassName} ref={insertRef} {...insertProps}>
                {input}
            </div>
            <div className={popoverClassName} ref={editRef} {...editProps}>
                {editContent}
            </div>
        </>
    );
}
