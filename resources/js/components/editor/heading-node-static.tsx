import { cva } from 'class-variance-authority';
import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';

export type HeadingLevel = 'h2' | 'h3' | 'h4';

export const headingVariants = cva(
    'relative mb-1 font-heading font-semibold text-foreground tracking-tight',
    {
        variants: {
            variant: {
                h2: 'mt-[1.4em] pb-px text-2xl',
                h3: 'mt-[1.2em] pb-px text-xl',
                h4: 'mt-[1em] text-lg',
            },
        },
    },
);

function HeadingElementStatic({
    variant,
    ...props
}: SlateElementProps & { variant: HeadingLevel }): ReactElement {
    return (
        <SlateElement
            {...props}
            as={variant}
            className={headingVariants({ variant })}
        />
    );
}

export function H2ElementStatic(props: SlateElementProps): ReactElement {
    return <HeadingElementStatic {...props} variant="h2" />;
}

export function H3ElementStatic(props: SlateElementProps): ReactElement {
    return <HeadingElementStatic {...props} variant="h3" />;
}

export function H4ElementStatic(props: SlateElementProps): ReactElement {
    return <HeadingElementStatic {...props} variant="h4" />;
}
