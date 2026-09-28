import type { ReactElement } from 'react';
import { InsertMenu, TurnIntoMenu } from '@/components/editor/block-menus';
import {
    EditorToolbarGroup,
    EditorToolbarSeparator,
} from '@/components/editor/editor-toolbar';
import { ImageToolbarButton } from '@/components/editor/image-button';
import { LinkToolbarButton } from '@/components/editor/link-toolbar';
import {
    HistoryButtons,
    ListButtons,
    MarkButtons,
} from '@/components/editor/toolbar-buttons';
import { Toolbar } from '@/components/ui/toolbar';

export function FixedToolbar(): ReactElement {
    return (
        <Toolbar
            aria-label="Панель редактора"
            className="sticky top-0 z-10 flex-wrap gap-0.5 rounded-none rounded-t-[calc(var(--radius-lg)-1px)] border-0 border-b bg-background/95 backdrop-blur-sm"
        >
            <EditorToolbarGroup>
                <HistoryButtons />
            </EditorToolbarGroup>
            <EditorToolbarSeparator />
            <EditorToolbarGroup>
                <InsertMenu />
                <TurnIntoMenu />
            </EditorToolbarGroup>
            <EditorToolbarSeparator />
            <EditorToolbarGroup>
                <MarkButtons />
            </EditorToolbarGroup>
            <EditorToolbarSeparator />
            <EditorToolbarGroup>
                <ListButtons />
            </EditorToolbarGroup>
            <EditorToolbarSeparator />
            <EditorToolbarGroup>
                <LinkToolbarButton />
                <ImageToolbarButton />
            </EditorToolbarGroup>
        </Toolbar>
    );
}
