import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import type { ReactElement } from 'react';
import type { HeadingLevel } from '@/components/editor/heading-node-static';
import { headingVariants } from '@/components/editor/heading-node-static';

function HeadingElement({
    variant,
    ...props
}: PlateElementProps & { variant: HeadingLevel }): ReactElement {
    return (
        <PlateElement
            {...props}
            as={variant}
            className={headingVariants({ variant })}
        />
    );
}

export function H2Element(props: PlateElementProps): ReactElement {
    return <HeadingElement {...props} variant="h2" />;
}

export function H3Element(props: PlateElementProps): ReactElement {
    return <HeadingElement {...props} variant="h3" />;
}

export function H4Element(props: PlateElementProps): ReactElement {
    return <HeadingElement {...props} variant="h4" />;
}
