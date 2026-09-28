import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';

export const hrClassName = 'h-px rounded-full border-none bg-border';

export function HrElementStatic(props: SlateElementProps): ReactElement {
    return (
        <SlateElement {...props}>
            <div className="py-6" contentEditable={false}>
                <hr className={hrClassName} />
            </div>
            {props.children}
        </SlateElement>
    );
}
