import type { Descendant, Value } from 'platejs';

export type EditorValue = Value;

export const EMPTY_EDITOR_VALUE: EditorValue = [
    { type: 'p', children: [{ text: '' }] },
];

function hasContent(node: Descendant): boolean {
    if ('text' in node) {
        return typeof node.text === 'string' && node.text.trim() !== '';
    }

    if (node.type === 'img' || node.type === 'hr' || node.type === 'table') {
        return true;
    }

    return node.children.some((child) => hasContent(child as Descendant));
}

export function isEditorValueEmpty(
    value: EditorValue | null | undefined,
): boolean {
    return !value?.some((node) => hasContent(node));
}
