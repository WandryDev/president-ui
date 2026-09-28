import { Trash2 } from 'lucide-react';
import type { TImageElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import {
    PlateElement,
    useEditorRef,
    useFocused,
    useReadOnly,
    useSelected,
} from 'platejs/react';
import type { ReactElement } from 'react';
import { isAllowedImageUrl } from '@/components/editor/editor-url';
import { imageClassName } from '@/components/editor/image-node-static';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ImageNode = TImageElement & { alt?: string };

function ImageToolbar({ element }: { element: ImageNode }): ReactElement {
    const editor = useEditorRef();

    return (
        <div
            className="absolute bottom-2 left-1/2 flex w-[min(24rem,calc(100%-1rem))] -translate-x-1/2 items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg/5"
            contentEditable={false}
        >
            <Input
                aria-label="Описание изображения"
                className="flex-1"
                onChange={(event) =>
                    editor.tf.setNodes<ImageNode>(
                        { alt: event.target.value },
                        { at: element },
                    )
                }
                onKeyDown={(event) => {
                    event.stopPropagation();

                    if (event.key === 'Enter') {
                        event.preventDefault();
                    }
                }}
                placeholder="Описание для поисковиков"
                size="sm"
                value={element.alt ?? ''}
            />
            <Button
                aria-label="Удалить изображение"
                onClick={() => editor.tf.removeNodes({ at: element })}
                size="icon-sm"
                variant="ghost"
            >
                <Trash2 />
            </Button>
        </div>
    );
}

export function ImageElement(
    props: PlateElementProps<TImageElement>,
): ReactElement {
    const element = props.element as ImageNode;
    const selected = useSelected();
    const focused = useFocused();
    const readOnly = useReadOnly();
    const active = selected && focused && !readOnly;

    return (
        <PlateElement {...props} className="py-2.5">
            <figure className="relative m-0" contentEditable={false}>
                {isAllowedImageUrl(element.url) ? (
                    <img
                        alt={element.alt ?? ''}
                        className={cn(
                            imageClassName,
                            active && 'ring-2 ring-ring ring-offset-2',
                        )}
                        draggable={false}
                        src={element.url}
                    />
                ) : null}
                {active ? <ImageToolbar element={element} /> : null}
            </figure>
            {props.children}
        </PlateElement>
    );
}
