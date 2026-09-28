import type { ReactElement, ReactNode } from 'react';
import { Toggle, toggleVariants } from '@/components/ui/toggle';
import type { ToolbarPrimitive } from '@/components/ui/toolbar';
import {
    ToolbarButton,
    ToolbarGroup,
    ToolbarSeparator,
} from '@/components/ui/toolbar';
import { Tooltip, TooltipPopup, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type EditorToolbarButtonProps = Omit<
    ToolbarPrimitive.Button.Props,
    'children'
> & {
    label: string;
    pressed?: boolean;
    children: ReactNode;
};

export function EditorToolbarButton({
    label,
    pressed,
    className,
    children,
    onMouseDown,
    ...props
}: EditorToolbarButtonProps): ReactElement {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <ToolbarButton
                        aria-label={label}
                        onMouseDown={(event) => {
                            event.preventDefault();
                            onMouseDown?.(event);
                        }}
                        render={
                            pressed === undefined ? (
                                <button
                                    className={cn(
                                        toggleVariants({ size: 'sm' }),
                                        'shrink-0',
                                        className,
                                    )}
                                    type="button"
                                />
                            ) : (
                                <Toggle
                                    className={cn('shrink-0', className)}
                                    pressed={pressed}
                                    size="sm"
                                />
                            )
                        }
                        {...props}
                    />
                }
            >
                {children}
            </TooltipTrigger>
            <TooltipPopup>{label}</TooltipPopup>
        </Tooltip>
    );
}

export function EditorToolbarGroup({
    className,
    ...props
}: ToolbarPrimitive.Group.Props): ReactElement {
    return <ToolbarGroup className={cn('gap-0.5', className)} {...props} />;
}

export function EditorToolbarSeparator(): ReactElement {
    return <ToolbarSeparator className="mx-1" orientation="vertical" />;
}
