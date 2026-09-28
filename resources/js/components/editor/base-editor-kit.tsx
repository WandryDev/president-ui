import {
    BaseBlockquotePlugin,
    BaseBoldPlugin,
    BaseCodePlugin,
    BaseH2Plugin,
    BaseH3Plugin,
    BaseH4Plugin,
    BaseHorizontalRulePlugin,
    BaseItalicPlugin,
    BaseStrikethroughPlugin,
    BaseUnderlinePlugin,
} from '@platejs/basic-nodes';
import { BaseCalloutPlugin } from '@platejs/callout';
import {
    BaseCodeBlockPlugin,
    BaseCodeLinePlugin,
    BaseCodeSyntaxPlugin,
} from '@platejs/code-block';
import { BaseIndentPlugin } from '@platejs/indent';
import { BaseLinkPlugin } from '@platejs/link';
import { BaseListPlugin } from '@platejs/list';
import { BaseImagePlugin } from '@platejs/media';
import {
    BaseTableCellHeaderPlugin,
    BaseTableCellPlugin,
    BaseTablePlugin,
    BaseTableRowPlugin,
} from '@platejs/table';
import { common, createLowlight } from 'lowlight';
import { BaseParagraphPlugin, KEYS } from 'platejs';
import {
    BlockListStatic,
    isBulletList,
    LIST_INDENT,
} from '@/components/editor/block-list-static';
import { BlockquoteElementStatic } from '@/components/editor/blockquote-node-static';
import { CalloutElementStatic } from '@/components/editor/callout-node-static';
import {
    CodeBlockElementStatic,
    CodeLineElementStatic,
    CodeSyntaxLeafStatic,
} from '@/components/editor/code-block-node-static';
import { CodeLeafStatic } from '@/components/editor/code-node-static';
import { LINK_SCHEMES } from '@/components/editor/editor-url';
import {
    H2ElementStatic,
    H3ElementStatic,
    H4ElementStatic,
} from '@/components/editor/heading-node-static';
import { HrElementStatic } from '@/components/editor/hr-node-static';
import { ImageElementStatic } from '@/components/editor/image-node-static';
import { LinkElementStatic } from '@/components/editor/link-node-static';
import { ParagraphElementStatic } from '@/components/editor/paragraph-node-static';
import {
    TableCellElementStatic,
    TableCellHeaderElementStatic,
    TableElementStatic,
    TableRowElementStatic,
} from '@/components/editor/table-node-static';

export const lowlight = createLowlight(common);

export const INDENT_TARGETS = [
    KEYS.p,
    KEYS.h2,
    KEYS.h3,
    KEYS.h4,
    KEYS.blockquote,
    KEYS.codeBlock,
];

export const BaseEditorKit = [
    BaseParagraphPlugin.withComponent(ParagraphElementStatic),
    BaseH2Plugin.withComponent(H2ElementStatic),
    BaseH3Plugin.withComponent(H3ElementStatic),
    BaseH4Plugin.withComponent(H4ElementStatic),
    BaseBlockquotePlugin.withComponent(BlockquoteElementStatic),
    BaseHorizontalRulePlugin.withComponent(HrElementStatic),
    BaseBoldPlugin,
    BaseItalicPlugin,
    BaseUnderlinePlugin,
    BaseStrikethroughPlugin,
    BaseCodePlugin.withComponent(CodeLeafStatic),
    BaseLinkPlugin.configure({
        node: { component: LinkElementStatic, props: () => ({}) },
        options: { allowedSchemes: LINK_SCHEMES },
    }),
    BaseIndentPlugin.configure({
        inject: { targetPlugins: INDENT_TARGETS },
        options: { offset: LIST_INDENT },
    }),
    BaseListPlugin.configure({
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
        render: { belowNodes: BlockListStatic },
    }),
    BaseCalloutPlugin.withComponent(CalloutElementStatic),
    BaseCodeBlockPlugin.configure({
        node: { component: CodeBlockElementStatic },
        options: { lowlight },
    }),
    BaseCodeLinePlugin.withComponent(CodeLineElementStatic),
    BaseCodeSyntaxPlugin.withComponent(CodeSyntaxLeafStatic),
    BaseImagePlugin.withComponent(ImageElementStatic),
    BaseTablePlugin.withComponent(TableElementStatic),
    BaseTableRowPlugin.withComponent(TableRowElementStatic),
    BaseTableCellPlugin.withComponent(TableCellElementStatic),
    BaseTableCellHeaderPlugin.withComponent(TableCellHeaderElementStatic),
];
