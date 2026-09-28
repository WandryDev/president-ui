import { useDraggable, useDropLine } from '@platejs/dnd';
import { GripVertical } from 'lucide-react';
import { KEYS } from 'platejs';
import type { PlateElementProps, RenderNodeWrapper } from 'platejs/react';
import { MemoizedChildren } from 'platejs/react';
import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

const UNDRAGGABLE: string[] = [KEYS.tr, KEYS.td, KEYS.th, KEYS.codeLine];

function DropLine(): ReactElement | null {
    const { dropLine } = useDropLine();

    if (!dropLine) {
        return null;
    }

    return (
        <div
            className={cn(
                'absolute inset-x-0 h-0.5 bg-ring',
                dropLine === 'top' ? '-top-px' : '-bottom-px',
            )}
            contentEditable={false}
        />
    );
}

function Draggable({ children, element }: PlateElementProps): ReactElement {
    const { isDragging, nodeRef, handleRef } = useDraggable({ element });

    return (
        <div className={cn('group relative', isDragging && 'opacity-50')}>
            <div
                className="absolute top-0 -left-8 hidden h-full select-none opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
                contentEditable={false}
            >
                <button
                    aria-label="Перетащить блок"
                    className="mt-1 flex h-6 w-5 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
                    data-plate-prevent-deselect
                    ref={handleRef}
                    type="button"
                >
                    <GripVertical className="size-4" />
                </button>
            </div>
            <div className="flow-root" ref={nodeRef}>
                <MemoizedChildren>{children}</MemoizedChildren>
                <DropLine />
            </div>
        </div>
    );
}

export const BlockDraggable: RenderNodeWrapper = ({
    editor,
    element,
    path,
}) => {
    if (
        editor.dom.readOnly ||
        path.length !== 1 ||
        UNDRAGGABLE.includes(element.type)
    ) {
        return;
    }

    return (props) => <Draggable {...props} />;
};
