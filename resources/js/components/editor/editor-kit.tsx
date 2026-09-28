import {
    BlockquoteRules,
    BoldRules,
    CodeRules,
    HeadingRules,
    HorizontalRuleRules,
    ItalicRules,
    MarkComboRules,
    StrikethroughRules,
    UnderlineRules,
} from '@platejs/basic-nodes';
import {
    BlockquotePlugin,
    BoldPlugin,
    CodePlugin,
    H2Plugin,
    H3Plugin,
    H4Plugin,
    HorizontalRulePlugin,
    ItalicPlugin,
    StrikethroughPlugin,
    UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import { CalloutPlugin } from '@platejs/callout/react';
import { CodeBlockRules } from '@platejs/code-block';
import {
    CodeBlockPlugin,
    CodeLinePlugin,
    CodeSyntaxPlugin,
} from '@platejs/code-block/react';
import { DndPlugin } from '@platejs/dnd';
import { IndentPlugin } from '@platejs/indent/react';
import { LinkRules } from '@platejs/link';
import { LinkPlugin } from '@platejs/link/react';
import {
    BulletedListRules,
    OrderedListRules,
    TaskListRules,
} from '@platejs/list';
import { ListPlugin } from '@platejs/list/react';
import { MarkdownPlugin } from '@platejs/markdown';
import { ImagePlugin } from '@platejs/media/react';
import { SlashInputPlugin, SlashPlugin } from '@platejs/slash-command/react';
import {
    TableCellHeaderPlugin,
    TableCellPlugin,
    TablePlugin,
    TableRowPlugin,
} from '@platejs/table/react';
import type { SlateEditor } from 'platejs';
import { ExitBreakPlugin, KEYS, TrailingBlockPlugin } from 'platejs';
import { createPlatePlugin, ParagraphPlugin } from 'platejs/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import remarkGfm from 'remark-gfm';
import { INDENT_TARGETS, lowlight } from '@/components/editor/base-editor-kit';
import { BlockDraggable } from '@/components/editor/block-draggable';
import { BlockList } from '@/components/editor/block-list';
import {
    isBulletList,
    LIST_INDENT,
} from '@/components/editor/block-list-static';
import { BlockquoteElement } from '@/components/editor/blockquote-node';
import { CalloutElement } from '@/components/editor/callout-node';
import {
    CodeBlockElement,
    CodeLineElement,
    CodeSyntaxLeaf,
} from '@/components/editor/code-block-node';
import { CodeLeaf } from '@/components/editor/code-node';
import {
    EditorUploadPlugin,
    EditorUrlPolicyPlugin,
    imageFiles,
    insertUploadedImages,
} from '@/components/editor/editor-upload';
import {
    isAllowedImageUrl,
    isAllowedLinkUrl,
    LINK_SCHEMES,
} from '@/components/editor/editor-url';
import { FloatingToolbar } from '@/components/editor/floating-toolbar';
import {
    H2Element,
    H3Element,
    H4Element,
} from '@/components/editor/heading-node';
import { HrElement } from '@/components/editor/hr-node';
import { ImageElement } from '@/components/editor/image-node';
import { LinkElement } from '@/components/editor/link-node';
import { LinkFloatingToolbar } from '@/components/editor/link-toolbar';
import { ParagraphElement } from '@/components/editor/paragraph-node';
import { SlashInputElement } from '@/components/editor/slash-node';
import {
    TableCellElement,
    TableCellHeaderElement,
    TableElement,
    TableRowElement,
} from '@/components/editor/table-node';

const headingConfig = {
    inputRules: [HeadingRules.markdown()],
    rules: { break: { empty: 'reset' as const } },
};

export const EditorKit = [
    ParagraphPlugin.withComponent(ParagraphElement),
    H2Plugin.configure({
        ...headingConfig,
        node: { component: H2Element },
        shortcuts: { toggle: { keys: 'mod+alt+2' } },
    }),
    H3Plugin.configure({
        ...headingConfig,
        node: { component: H3Element },
        shortcuts: { toggle: { keys: 'mod+alt+3' } },
    }),
    H4Plugin.configure({
        ...headingConfig,
        node: { component: H4Element },
        shortcuts: { toggle: { keys: 'mod+alt+4' } },
    }),
    BlockquotePlugin.configure({
        inputRules: [BlockquoteRules.markdown()],
        node: { component: BlockquoteElement },
    }),
    HorizontalRulePlugin.configure({
        inputRules: [HorizontalRuleRules.markdown({ variant: '-' })],
        node: { component: HrElement },
    }),
    BoldPlugin.configure({
        inputRules: [
            BoldRules.markdown({ variant: '*' }),
            BoldRules.markdown({ variant: '_' }),
            MarkComboRules.markdown({ variant: 'boldItalic' }),
        ],
    }),
    ItalicPlugin.configure({
        inputRules: [
            ItalicRules.markdown({ variant: '*' }),
            ItalicRules.markdown({ variant: '_' }),
        ],
    }),
    UnderlinePlugin.configure({ inputRules: [UnderlineRules.markdown()] }),
    StrikethroughPlugin.configure({
        inputRules: [StrikethroughRules.markdown()],
    }),
    CodePlugin.configure({
        inputRules: [CodeRules.markdown()],
        node: { component: CodeLeaf },
    }),
    LinkPlugin.configure({
        inputRules: [
            LinkRules.markdown(),
            LinkRules.autolink({ variant: 'paste' }),
            LinkRules.autolink({ variant: 'space' }),
        ],
        node: { props: () => ({}) },
        options: { allowedSchemes: LINK_SCHEMES, isUrl: isAllowedLinkUrl },
        render: {
            afterEditable: () => <LinkFloatingToolbar />,
            node: LinkElement,
        },
    }),
    IndentPlugin.configure({
        inject: { targetPlugins: INDENT_TARGETS },
        options: { offset: LIST_INDENT },
    }),
    ListPlugin.configure({
        inject: {
            nodeProps: {
                nodeKey: KEYS.listType,
                query: ({ nodeProps }) =>
                    nodeProps.element !== undefined &&
                    isBulletList(nodeProps.element),
                transformProps: ({ props }) => ({
                    ...props,
                    style: { ...props.style, display: 'list-item' },
                }),
            },
            targetPlugins: INDENT_TARGETS,
        },
        inputRules: [
            BulletedListRules.markdown({ variant: '-' }),
            BulletedListRules.markdown({ variant: '*' }),
            OrderedListRules.markdown({ variant: '.' }),
            TaskListRules.markdown({ checked: false }),
            TaskListRules.markdown({ checked: true }),
        ],
        render: { belowNodes: BlockList },
    }),
    CalloutPlugin.withComponent(CalloutElement),
    CodeBlockPlugin.configure({
        inputRules: [CodeBlockRules.markdown({ on: 'match' })],
        node: { component: CodeBlockElement },
        options: { lowlight },
    }),
    CodeLinePlugin.withComponent(CodeLineElement),
    CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
    ImagePlugin.configure({
        node: { component: ImageElement },
        options: { disableUploadInsert: true, isUrl: isAllowedImageUrl },
    }),
    TablePlugin.withComponent(TableElement),
    TableRowPlugin.withComponent(TableRowElement),
    TableCellPlugin.withComponent(TableCellElement),
    TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
    SlashPlugin.configure({
        options: {
            triggerQuery: (editor: SlateEditor) =>
                !editor.api.some({
                    match: { type: editor.getType(KEYS.codeBlock) },
                }),
        },
    }),
    SlashInputPlugin.withComponent(SlashInputElement),
    DndPlugin.configure({
        options: {
            enableScroller: true,
            onDropFiles: ({ dragItem, editor, target }) => {
                const uploadImage = editor.getOption(
                    EditorUploadPlugin,
                    'uploadImage',
                );
                const files = imageFiles(dragItem.files);

                if (uploadImage && files.length > 0) {
                    void insertUploadedImages(
                        editor,
                        files,
                        uploadImage,
                        target,
                    );
                }
            },
        },
        render: {
            aboveNodes: BlockDraggable,
            aboveSlate: ({ children }) => (
                <DndProvider backend={HTML5Backend}>{children}</DndProvider>
            ),
        },
    }),
    MarkdownPlugin.configure({ options: { remarkPlugins: [remarkGfm] } }),
    ExitBreakPlugin.configure({
        shortcuts: {
            insert: { keys: 'mod+enter' },
            insertBefore: { keys: 'mod+shift+enter' },
        },
    }),
    TrailingBlockPlugin.configure({ options: { type: KEYS.p } }),
    EditorUploadPlugin,
    EditorUrlPolicyPlugin,
    createPlatePlugin({
        key: 'floatingToolbar',
        render: { afterEditable: () => <FloatingToolbar /> },
    }),
];
