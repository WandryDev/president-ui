import type { TCodeBlockElement } from 'platejs';
import type { PlateElementProps, PlateLeafProps } from 'platejs/react';
import {
    PlateElement,
    PlateLeaf,
    useEditorRef,
    useReadOnly,
} from 'platejs/react';
import type { ReactElement } from 'react';
import {
    codeBlockClassName,
    syntaxClassName,
} from '@/components/editor/code-block-node-static';
import { cn } from '@/lib/utils';

export const CODE_LANGUAGES = [
    { label: 'Текст', value: 'plaintext' },
    { label: 'Bash', value: 'bash' },
    { label: 'CSS', value: 'css' },
    { label: 'HTML', value: 'xml' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'JSON', value: 'json' },
    { label: 'PHP', value: 'php' },
    { label: 'Python', value: 'python' },
    { label: 'SQL', value: 'sql' },
    { label: 'TypeScript', value: 'typescript' },
];

function CodeLanguageSelect({
    element,
}: {
    element: TCodeBlockElement;
}): ReactElement {
    const editor = useEditorRef();

    return (
        <select
            aria-label="Язык кода"
            className="absolute top-2 right-2 z-10 h-7 rounded-md border border-input bg-background px-2 font-sans text-muted-foreground text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            contentEditable={false}
            onChange={(event) =>
                editor.tf.setNodes<TCodeBlockElement>(
                    { lang: event.target.value },
                    { at: element },
                )
            }
            value={element.lang ?? 'plaintext'}
        >
            {CODE_LANGUAGES.map((language) => (
                <option key={language.value} value={language.value}>
                    {language.label}
                </option>
            ))}
        </select>
    );
}

export function CodeBlockElement({
    children,
    ...props
}: PlateElementProps<TCodeBlockElement>): ReactElement {
    const readOnly = useReadOnly();

    return (
        <PlateElement {...props} className={cn('relative', codeBlockClassName)}>
            {readOnly ? null : <CodeLanguageSelect element={props.element} />}
            <pre className="m-0">
                <code>{children}</code>
            </pre>
        </PlateElement>
    );
}

export function CodeLineElement(props: PlateElementProps): ReactElement {
    return <PlateElement {...props} />;
}

export function CodeSyntaxLeaf(props: PlateLeafProps): ReactElement {
    return (
        <PlateLeaf
            {...props}
            className={syntaxClassName(props.leaf.className)}
        />
    );
}
