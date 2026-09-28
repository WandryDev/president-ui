import type { TImageElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';
import { isAllowedImageUrl } from '@/components/editor/editor-url';

export const imageClassName =
    'block h-auto max-w-full rounded-lg outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10';

export function ImageElementStatic(
    props: SlateElementProps<TImageElement>,
): ReactElement {
    const { url, alt } = props.element as TImageElement & { alt?: string };

    return (
        <SlateElement {...props} className="py-2.5">
            <figure className="m-0" contentEditable={false}>
                {isAllowedImageUrl(url) ? (
                    <img
                        alt={alt ?? ''}
                        className={imageClassName}
                        loading="lazy"
                        src={url}
                    />
                ) : null}
            </figure>
            {props.children}
        </SlateElement>
    );
}
