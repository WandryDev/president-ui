import { someList, toggleList } from '@platejs/list';
import {
    Bold,
    Code,
    Italic,
    List,
    ListOrdered,
    ListTodo,
    Redo2,
    Strikethrough,
    Underline,
    Undo2,
} from 'lucide-react';
import { KEYS } from 'platejs';
import {
    useEditorRef,
    useEditorSelector,
    useMarkToolbarButton,
    useMarkToolbarButtonState,
} from 'platejs/react';
import type { ReactElement, ReactNode } from 'react';
import { EditorToolbarButton } from '@/components/editor/editor-toolbar';

function MarkButton({
    nodeType,
    label,
    children,
}: {
    nodeType: string;
    label: string;
    children: ReactNode;
}): ReactElement {
    const state = useMarkToolbarButtonState({ nodeType });
    const { props } = useMarkToolbarButton(state);

    return (
        <EditorToolbarButton
            label={label}
            onClick={props.onClick}
            pressed={props.pressed}
        >
            {children}
        </EditorToolbarButton>
    );
}

export function MarkButtons(): ReactElement {
    return (
        <>
            <MarkButton label="Полужирный" nodeType={KEYS.bold}>
                <Bold />
            </MarkButton>
            <MarkButton label="Курсив" nodeType={KEYS.italic}>
                <Italic />
            </MarkButton>
            <MarkButton label="Подчёркнутый" nodeType={KEYS.underline}>
                <Underline />
            </MarkButton>
            <MarkButton label="Зачёркнутый" nodeType={KEYS.strikethrough}>
                <Strikethrough />
            </MarkButton>
            <MarkButton label="Код" nodeType={KEYS.code}>
                <Code />
            </MarkButton>
        </>
    );
}

function ListButton({
    listStyleType,
    label,
    children,
}: {
    listStyleType: string;
    label: string;
    children: ReactNode;
}): ReactElement {
    const editor = useEditorRef();
    const pressed = useEditorSelector(
        (current) => someList(current, listStyleType),
        [listStyleType],
    );

    return (
        <EditorToolbarButton
            label={label}
            onClick={() => {
                toggleList(editor, { listStyleType });
                editor.tf.focus();
            }}
            pressed={pressed}
        >
            {children}
        </EditorToolbarButton>
    );
}

export function ListButtons(): ReactElement {
    return (
        <>
            <ListButton label="Маркированный список" listStyleType={KEYS.ul}>
                <List />
            </ListButton>
            <ListButton label="Нумерованный список" listStyleType={KEYS.ol}>
                <ListOrdered />
            </ListButton>
            <ListButton label="Список задач" listStyleType={KEYS.listTodo}>
                <ListTodo />
            </ListButton>
        </>
    );
}

export function HistoryButtons(): ReactElement {
    const editor = useEditorRef();
    const cannotUndo = useEditorSelector(
        (current) => current.history.undos.length === 0,
        [],
    );
    const cannotRedo = useEditorSelector(
        (current) => current.history.redos.length === 0,
        [],
    );

    return (
        <>
            <EditorToolbarButton
                disabled={cannotUndo}
                label="Отменить"
                onClick={() => editor.undo()}
            >
                <Undo2 />
            </EditorToolbarButton>
            <EditorToolbarButton
                disabled={cannotRedo}
                label="Повторить"
                onClick={() => editor.redo()}
            >
                <Redo2 />
            </EditorToolbarButton>
        </>
    );
}
