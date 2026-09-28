import {
    ChevronDown,
    Code2,
    Heading2,
    Heading3,
    Heading4,
    Info,
    List,
    ListOrdered,
    ListTodo,
    Minus,
    Pilcrow,
    Plus,
    Quote,
    Table,
} from 'lucide-react';
import { KEYS } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import type { ReactElement, ReactNode } from 'react';
import {
    getCurrentBlockType,
    insertBlock,
    setBlockType,
} from '@/components/editor/editor-transforms';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu';
import { toggleVariants } from '@/components/ui/toggle';
import { ToolbarButton } from '@/components/ui/toolbar';
import { cn } from '@/lib/utils';

export type BlockOption = {
    value: string;
    label: string;
    icon: ReactNode;
    keywords?: string[];
};

export const TURN_INTO_OPTIONS: BlockOption[] = [
    {
        icon: <Pilcrow />,
        keywords: ['paragraph', 'text', 'текст'],
        label: 'Текст',
        value: KEYS.p,
    },
    {
        icon: <Heading2 />,
        keywords: ['h2', 'heading', 'заголовок'],
        label: 'Заголовок 2',
        value: KEYS.h2,
    },
    {
        icon: <Heading3 />,
        keywords: ['h3', 'heading', 'заголовок'],
        label: 'Заголовок 3',
        value: KEYS.h3,
    },
    {
        icon: <Heading4 />,
        keywords: ['h4', 'heading', 'заголовок'],
        label: 'Заголовок 4',
        value: KEYS.h4,
    },
    {
        icon: <List />,
        keywords: ['ul', 'bullet', 'список'],
        label: 'Маркированный список',
        value: KEYS.ul,
    },
    {
        icon: <ListOrdered />,
        keywords: ['ol', 'numbered', 'список'],
        label: 'Нумерованный список',
        value: KEYS.ol,
    },
    {
        icon: <ListTodo />,
        keywords: ['todo', 'task', 'задача'],
        label: 'Список задач',
        value: KEYS.listTodo,
    },
    {
        icon: <Quote />,
        keywords: ['quote', 'blockquote', 'цитата'],
        label: 'Цитата',
        value: KEYS.blockquote,
    },
    {
        icon: <Code2 />,
        keywords: ['code', 'код'],
        label: 'Блок кода',
        value: KEYS.codeBlock,
    },
];

export const INSERT_OPTIONS: BlockOption[] = [
    {
        icon: <Table />,
        keywords: ['table', 'таблица'],
        label: 'Таблица',
        value: KEYS.table,
    },
    {
        icon: <Info />,
        keywords: ['callout', 'note', 'выноска'],
        label: 'Выноска',
        value: KEYS.callout,
    },
    {
        icon: <Code2 />,
        keywords: ['code', 'код'],
        label: 'Блок кода',
        value: KEYS.codeBlock,
    },
    {
        icon: <Quote />,
        keywords: ['quote', 'цитата'],
        label: 'Цитата',
        value: KEYS.blockquote,
    },
    {
        icon: <Minus />,
        keywords: ['hr', 'divider', 'разделитель'],
        label: 'Разделитель',
        value: KEYS.hr,
    },
];

function MenuButton({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}): ReactElement {
    return (
        <MenuTrigger
            render={
                <ToolbarButton
                    aria-label={label}
                    onMouseDown={(event) => event.preventDefault()}
                    render={
                        <button
                            className={cn(
                                toggleVariants({ size: 'sm' }),
                                'shrink-0',
                            )}
                            type="button"
                        />
                    }
                />
            }
        >
            {children}
        </MenuTrigger>
    );
}

export function TurnIntoMenu(): ReactElement {
    const editor = useEditorRef();
    const current = useEditorSelector(
        (state) => getCurrentBlockType(state as PlateEditor),
        [],
    );
    const active =
        TURN_INTO_OPTIONS.find((option) => option.value === current) ??
        TURN_INTO_OPTIONS[0];

    return (
        <Menu modal={false}>
            <MenuButton label="Тип блока">
                <span className="min-w-[7.5rem] text-left">{active.label}</span>
                <ChevronDown className="opacity-60" />
            </MenuButton>
            <MenuPopup align="start" finalFocus={false}>
                {TURN_INTO_OPTIONS.map((option) => (
                    <MenuItem
                        key={option.value}
                        onClick={() => {
                            setBlockType(editor, option.value);
                            editor.tf.focus();
                        }}
                    >
                        {option.icon}
                        {option.label}
                    </MenuItem>
                ))}
            </MenuPopup>
        </Menu>
    );
}

export function InsertMenu(): ReactElement {
    const editor = useEditorRef();

    return (
        <Menu modal={false}>
            <MenuButton label="Вставить блок">
                <Plus />
            </MenuButton>
            <MenuPopup align="start" finalFocus={false}>
                {INSERT_OPTIONS.map((option) => (
                    <MenuItem
                        key={option.value}
                        onClick={() => {
                            insertBlock(editor, option.value);
                            editor.tf.focus();
                        }}
                    >
                        {option.icon}
                        {option.label}
                    </MenuItem>
                ))}
            </MenuPopup>
        </Menu>
    );
}
