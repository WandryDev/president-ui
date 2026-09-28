import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorStatic } from '@/components/editor/editor-static';
import type { EditorValue } from '@/components/editor/editor-value';

const document: EditorValue = [
    { type: 'h2', children: [{ text: 'Как выбрать квартиру' }] },
    { type: 'h3', children: [{ text: 'Район' }] },
    { type: 'h4', children: [{ text: 'Транспорт' }] },
    {
        type: 'p',
        children: [
            { text: 'Обычный, ' },
            { text: 'жирный', bold: true },
            { text: ', ' },
            { text: 'курсив', italic: true },
            { text: ', ' },
            { text: 'подчёркнутый', underline: true },
            { text: ', ' },
            { text: 'зачёркнутый', strikethrough: true },
            { text: ' и ' },
            { text: 'код', code: true },
            { text: '. ' },
            {
                type: 'a',
                url: 'https://president.ua/blog',
                children: [{ text: 'Блог' }],
            },
            { text: '' },
        ],
    },
    {
        type: 'p',
        indent: 1,
        listStyleType: 'disc',
        children: [{ text: 'Маркированный пункт' }],
    },
    {
        type: 'p',
        indent: 1,
        listStyleType: 'decimal',
        listStart: 1,
        children: [{ text: 'Нумерованный пункт' }],
    },
    {
        type: 'p',
        indent: 1,
        listStyleType: 'todo',
        checked: true,
        children: [{ text: 'Сделанная задача' }],
    },
    { type: 'blockquote', children: [{ text: 'Цитата' }] },
    { type: 'callout', children: [{ text: 'Выноска' }] },
    {
        type: 'code_block',
        lang: 'javascript',
        children: [{ type: 'code_line', children: [{ text: 'const a = 1;' }] }],
    },
    { type: 'hr', children: [{ text: '' }] },
    {
        type: 'table',
        children: [
            {
                type: 'tr',
                children: [
                    {
                        type: 'th',
                        children: [
                            { type: 'p', children: [{ text: 'Комнаты' }] },
                        ],
                    },
                    {
                        type: 'th',
                        children: [{ type: 'p', children: [{ text: 'Цена' }] }],
                    },
                ],
            },
            {
                type: 'tr',
                children: [
                    {
                        type: 'td',
                        children: [{ type: 'p', children: [{ text: '2' }] }],
                    },
                    {
                        type: 'td',
                        children: [
                            { type: 'p', children: [{ text: '85 000' }] },
                        ],
                    },
                ],
            },
        ],
    },
    {
        type: 'img',
        url: 'https://cdn.example.com/plan.webp',
        alt: 'План',
        children: [{ text: '' }],
    },
];

describe('EditorStatic', () => {
    it('renders every supported node', () => {
        const { container } = render(<EditorStatic value={document} />);

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'Как выбрать квартиру',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { level: 3, name: 'Район' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { level: 4, name: 'Транспорт' }),
        ).toBeInTheDocument();

        expect(screen.getByText('жирный').closest('strong')).not.toBeNull();
        expect(screen.getByText('курсив').closest('em')).not.toBeNull();
        expect(screen.getByText('подчёркнутый').closest('u')).not.toBeNull();
        expect(screen.getByText('зачёркнутый').closest('s')).not.toBeNull();
        expect(screen.getByText('код').closest('code')).not.toBeNull();

        expect(screen.getByRole('link', { name: 'Блог' })).toHaveAttribute(
            'href',
            'https://president.ua/blog',
        );

        expect(
            screen
                .getByText('Маркированный пункт')
                .closest('[style*="list-item"]'),
        ).not.toBeNull();
        expect(
            screen.getByText('Нумерованный пункт').closest('ol'),
        ).not.toBeNull();
        expect(screen.getByText('Сделанная задача').closest('li')).toHaveClass(
            'line-through',
        );

        expect(screen.getByText('Цитата').closest('blockquote')).not.toBeNull();
        expect(screen.getByText('Выноска')).toBeInTheDocument();
        expect(container.querySelector('pre code')).toHaveTextContent(
            'const a = 1;',
        );
        expect(container.querySelector('hr')).not.toBeNull();

        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Комнаты' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('cell', { name: '85 000' }),
        ).toBeInTheDocument();

        expect(screen.getByRole('img', { name: 'План' })).toHaveAttribute(
            'src',
            'https://cdn.example.com/plan.webp',
        );
    });

    it('renders no editing controls', () => {
        const { container } = render(<EditorStatic value={document} />);

        expect(container.querySelector('[contenteditable="true"]')).toBeNull();
        expect(screen.queryByRole('toolbar')).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('drops unsafe urls', () => {
        render(
            <EditorStatic
                value={[
                    {
                        type: 'p',
                        children: [
                            {
                                type: 'a',
                                url: 'javascript:alert(1)',
                                children: [{ text: 'Опасно' }],
                            },
                            { text: ' ' },
                            {
                                type: 'a',
                                url: '//evil.example/x',
                                children: [{ text: 'Протокол' }],
                            },
                            { text: ' ' },
                            {
                                type: 'a',
                                url: 42,
                                children: [{ text: 'Число' }],
                            },
                        ],
                    },
                    {
                        type: 'img',
                        url: 'data:image/png;base64,AAAA',
                        children: [{ text: '' }],
                    },
                ]}
            />,
        );

        for (const name of ['Опасно', 'Протокол', 'Число']) {
            expect(screen.getByText(name).closest('a')).not.toHaveAttribute(
                'href',
            );
        }
        expect(screen.queryByRole('img')).toBeNull();
    });
});
