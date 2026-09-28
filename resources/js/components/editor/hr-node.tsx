import type { PlateElementProps } from 'platejs/react';
import { PlateElement, useFocused, useSelected } from 'platejs/react';
import type { ReactElement } from 'react';
import { hrClassName } from '@/components/editor/hr-node-static';
import { cn } from '@/lib/utils';

export function HrElement(props: PlateElementProps): ReactElement {
    const selected = useSelected();
    const focused = useFocused();

    return (
        <PlateElement {...props}>
            <div className="py-6" contentEditable={false}>
                <hr
                    className={cn(
                        hrClassName,
                        selected && focused && 'ring-2 ring-ring ring-offset-2',
                    )}
                />
            </div>
            {props.children}
        </PlateElement>
    );
}
