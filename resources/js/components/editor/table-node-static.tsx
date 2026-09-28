import { BaseTablePlugin } from '@platejs/table';
import type { TTableCellElement, TTableElement } from 'platejs';
import type { SlateElementProps } from 'platejs/static';
import { SlateElement } from 'platejs/static';
import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';

export const tableClassName =
    'w-full table-fixed border-collapse text-sm [&_td]:align-top [&_th]:align-top';

export const tableCellClassName =
    'border border-border px-3 py-2 text-left [&>*]:m-0';

export function TableElementStatic({
    children,
    ...props
}: SlateElementProps<TTableElement>): ReactElement {
    return (
        <SlateElement {...props} className="my-4 overflow-x-auto">
            <table className={tableClassName}>
                <tbody>{children}</tbody>
            </table>
        </SlateElement>
    );
}

export function TableRowElementStatic(props: SlateElementProps): ReactElement {
    return <SlateElement {...props} as="tr" />;
}

function TableCell({
    isHeader,
    ...props
}: SlateElementProps<TTableCellElement> & {
    isHeader?: boolean;
}): ReactElement {
    const { api } = props.editor.getPlugin(BaseTablePlugin);

    return (
        <SlateElement
            {...props}
            as={isHeader ? 'th' : 'td'}
            attributes={{
                ...props.attributes,
                colSpan: api.table.getColSpan(props.element),
                rowSpan: api.table.getRowSpan(props.element),
            }}
            className={cn(
                tableCellClassName,
                isHeader && 'bg-muted/60 font-medium',
            )}
        />
    );
}

export function TableCellElementStatic(
    props: SlateElementProps<TTableCellElement>,
): ReactElement {
    return <TableCell {...props} />;
}

export function TableCellHeaderElementStatic(
    props: SlateElementProps<TTableCellElement>,
): ReactElement {
    return <TableCell {...props} isHeader />;
}
