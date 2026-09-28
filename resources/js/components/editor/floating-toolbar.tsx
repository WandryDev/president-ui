import {
    flip,
    offset,
    useFloatingToolbar,
    useFloatingToolbarState,
} from '@platejs/floating';
import { KEYS } from 'platejs';
import {
    useComposedRef,
    useEditorId,
    useEventEditorValue,
    usePluginOption,
} from 'platejs/react';
import type { ReactElement } from 'react';
import { TurnIntoMenu } from '@/components/editor/block-menus';
import {
    EditorToolbarGroup,
    EditorToolbarSeparator,
} from '@/components/editor/editor-toolbar';
import { LinkToolbarButton } from '@/components/editor/link-toolbar';
import { MarkButtons } from '@/components/editor/toolbar-buttons';
import { Toolbar } from '@/components/ui/toolbar';

export function FloatingToolbar(): ReactElement | null {
    const editorId = useEditorId();
    const focusedEditorId = useEventEditorValue('focus');
    const isLinkOpen = Boolean(usePluginOption({ key: KEYS.link }, 'mode'));

    const state = useFloatingToolbarState({
        editorId,
        floatingOptions: {
            middleware: [
                offset(12),
                flip({
                    fallbackPlacements: [
                        'top-start',
                        'top-end',
                        'bottom-start',
                        'bottom-end',
                    ],
                    padding: 12,
                }),
            ],
            placement: 'top',
        },
        focusedEditorId,
        hideToolbar: isLinkOpen,
    });

    const {
        clickOutsideRef,
        hidden,
        props,
        ref: floatingRef,
    } = useFloatingToolbar(state);
    const ref = useComposedRef<HTMLDivElement>(floatingRef);

    if (hidden) {
        return null;
    }

    return (
        <div ref={clickOutsideRef}>
            <Toolbar
                {...props}
                aria-label="Форматирование выделения"
                className="absolute z-50 max-w-[80vw] gap-0.5 overflow-x-auto whitespace-nowrap bg-popover shadow-lg/5 print:hidden"
                ref={ref}
            >
                <EditorToolbarGroup>
                    <TurnIntoMenu />
                </EditorToolbarGroup>
                <EditorToolbarSeparator />
                <EditorToolbarGroup>
                    <MarkButtons />
                    <LinkToolbarButton />
                </EditorToolbarGroup>
            </Toolbar>
        </div>
    );
}
