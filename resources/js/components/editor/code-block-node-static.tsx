import type { SlateElementProps, SlateLeafProps } from 'platejs/static';
import { SlateElement, SlateLeaf } from 'platejs/static';
import type { ReactElement } from 'react';

export const codeBlockClassName = [
    'my-2 overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-sm leading-6 [tab-size:2]',
    '[&_.hljs-comment,&_.hljs-quote]:text-muted-foreground [&_.hljs-comment,&_.hljs-quote]:italic',
    '[&_.hljs-keyword,&_.hljs-selector-tag,&_.hljs-built_in]:text-violet-600 dark:[&_.hljs-keyword,&_.hljs-selector-tag,&_.hljs-built_in]:text-violet-400',
    '[&_.hljs-string,&_.hljs-regexp,&_.hljs-addition]:text-emerald-700 dark:[&_.hljs-string,&_.hljs-regexp,&_.hljs-addition]:text-emerald-400',
    '[&_.hljs-number,&_.hljs-literal,&_.hljs-variable,&_.hljs-template-variable]:text-amber-700 dark:[&_.hljs-number,&_.hljs-literal,&_.hljs-variable,&_.hljs-template-variable]:text-amber-400',
    '[&_.hljs-title,&_.hljs-section,&_.hljs-name,&_.hljs-attr,&_.hljs-attribute]:text-sky-700 dark:[&_.hljs-title,&_.hljs-section,&_.hljs-name,&_.hljs-attr,&_.hljs-attribute]:text-sky-400',
    '[&_.hljs-deletion]:text-destructive',
].join(' ');

export function CodeBlockElementStatic({
    children,
    ...props
}: SlateElementProps): ReactElement {
    return (
        <SlateElement {...props} className={codeBlockClassName}>
            <pre className="m-0">
                <code>{children}</code>
            </pre>
        </SlateElement>
    );
}

export function CodeLineElementStatic(props: SlateElementProps): ReactElement {
    return <SlateElement {...props} />;
}

export function syntaxClassName(className: unknown): string | undefined {
    if (typeof className !== 'string') {
        return undefined;
    }

    return (
        className
            .split(/\s+/)
            .filter((name) => /^hljs(-[\w-]+)?$/.test(name))
            .join(' ') || undefined
    );
}

export function CodeSyntaxLeafStatic(props: SlateLeafProps): ReactElement {
    return (
        <SlateLeaf
            {...props}
            className={syntaxClassName(props.leaf.className)}
        />
    );
}
