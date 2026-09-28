import { insertCallout } from '@platejs/callout';
import { toggleCodeBlock, unwrapCodeBlock } from '@platejs/code-block';
import { TablePlugin } from '@platejs/table/react';
import type { NodeEntry, Path, TElement } from 'platejs';
import { KEYS, PathApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';

export const LIST_TYPES = [KEYS.ul, KEYS.ol, KEYS.listTodo] as string[];

const TURN_INTO_TYPES: string[] = [
    KEYS.p,
    KEYS.h2,
    KEYS.h3,
    KEYS.h4,
    KEYS.blockquote,
    KEYS.codeBlock,
    ...LIST_TYPES,
];

const CONTAINER_TYPES: string[] = [KEYS.codeBlock, KEYS.table, KEYS.blockquote];

const insertBlockMap: Record<string, (editor: PlateEditor, at: Path) => void> =
    {
        [KEYS.callout]: (editor, at) =>
            insertCallout(editor, { at, select: true }),
        [KEYS.codeBlock]: (editor, at) =>
            editor.tf.insertNodes(
                {
                    children: [
                        { children: [{ text: '' }], type: KEYS.codeLine },
                    ],
                    type: KEYS.codeBlock,
                },
                { at, select: true },
            ),
        [KEYS.table]: (editor, at) =>
            editor
                .getTransforms(TablePlugin)
                .insert.table(
                    { colCount: 3, header: true, rowCount: 3 },
                    { at, select: true },
                ),
    };

export function getBlockType(block: TElement | undefined): string {
    if (!block) {
        return KEYS.p;
    }

    const listStyleType = block[KEYS.listType] as string | undefined;

    if (listStyleType) {
        return listStyleType === KEYS.ol || listStyleType === KEYS.listTodo
            ? listStyleType
            : KEYS.ul;
    }

    return block.type;
}

function isInside(editor: PlateEditor, type: string): boolean {
    return editor.api.some({ match: { type: editor.getType(type) } });
}

export function getCurrentBlockType(editor: PlateEditor): string {
    if (isInside(editor, KEYS.codeBlock)) {
        return KEYS.codeBlock;
    }

    if (isInside(editor, KEYS.blockquote)) {
        return KEYS.blockquote;
    }

    return getBlockType(editor.api.block()?.[0]);
}

export function insertBlock(editor: PlateEditor, type: string): void {
    const top = editor.api.block({ highest: true });

    if (!top) {
        return;
    }

    const [node, path] = top;
    const isContainer = CONTAINER_TYPES.includes(node.type);
    const isEmpty = !isContainer && editor.api.isEmpty(node);
    const lowest = editor.api.block();
    const isEmptyInQuote =
        node.type === KEYS.blockquote &&
        lowest !== undefined &&
        editor.api.isEmpty(lowest[0]);

    if ((isEmpty || isEmptyInQuote) && TURN_INTO_TYPES.includes(type)) {
        setBlockType(editor, type);

        return;
    }

    editor.tf.withoutNormalizing(() => {
        const at = PathApi.next(path);

        if (type in insertBlockMap) {
            insertBlockMap[type](editor, at);
        } else if (LIST_TYPES.includes(type)) {
            editor.tf.insertNodes(
                editor.api.create.block({ indent: 1, listStyleType: type }),
                { at, select: true },
            );
        } else {
            editor.tf.insertNodes(editor.api.create.block({ type }), {
                at,
                select: true,
            });
        }

        if (isEmpty) {
            editor.tf.removeNodes({ at: path });
        }
    });
}

function unsetList(editor: PlateEditor): void {
    for (const [node, path] of editor.api.blocks<TElement>({
        mode: 'lowest',
    })) {
        if (node[KEYS.listType]) {
            editor.tf.unsetNodes([KEYS.listType, 'indent', 'checked'], {
                at: path,
            });
        }
    }
}

function setBlock(
    editor: PlateEditor,
    type: string,
    [node, path]: NodeEntry<TElement>,
): void {
    if (node[KEYS.listType]) {
        editor.tf.unsetNodes([KEYS.listType, 'indent', 'checked'], {
            at: path,
        });
    }

    if (LIST_TYPES.includes(type)) {
        if (node.type !== KEYS.p) {
            editor.tf.setNodes({ type: KEYS.p }, { at: path });
        }

        editor.tf.setNodes(
            editor.api.create.block({ indent: 1, listStyleType: type }),
            { at: path },
        );

        return;
    }

    if (node.type !== type) {
        editor.tf.setNodes({ type }, { at: path });
    }
}

export function setBlockType(editor: PlateEditor, type: string): void {
    const current = getCurrentBlockType(editor);

    if (current === type) {
        return;
    }

    editor.tf.withoutNormalizing(() => {
        if (current === KEYS.codeBlock) {
            unwrapCodeBlock(editor);
        }

        if (current === KEYS.blockquote) {
            editor.tf.toggleBlock(KEYS.blockquote, { wrap: true });
        }

        if (type === KEYS.codeBlock) {
            unsetList(editor);
            toggleCodeBlock(editor);

            return;
        }

        if (type === KEYS.blockquote) {
            unsetList(editor);
            editor.tf.toggleBlock(KEYS.blockquote, { wrap: true });

            return;
        }

        for (const entry of editor.api.blocks<TElement>({ mode: 'lowest' })) {
            setBlock(editor, type, entry);
        }
    });
}
