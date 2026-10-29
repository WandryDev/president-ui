import { X } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';

export type DataTableResetButtonProps = {
    onReset: () => void;
    label?: string;
    className?: string;
};

/** «Сбросить ×» at the end of a filter row. */
export function DataTableResetButton({
    onReset,
    label = 'Сбросить',
    className,
}: DataTableResetButtonProps): ReactElement {
    return (
        <Button
            className={className}
            onClick={onReset}
            size="sm"
            type="button"
            variant="ghost"
        >
            {label}
            <X />
        </Button>
    );
}
