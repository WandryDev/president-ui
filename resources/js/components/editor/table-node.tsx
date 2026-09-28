import { TablePlugin } from '@platejs/table/react';
import {
    ArrowDownToLine,
    ArrowLeftToLine,
    ArrowRightToLine,
    ArrowUpToLine,
    Columns2,
    Rows2,
    Trash2,
} from 'lucide-react';
import type { TTableCellElement, TTableElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import {
    PlateElement,
    useEditorPlugin,
    useFocused,
    useReadOnly,
    useSelected,
} from 'platejs/react';
import type { ReactElement, ReactNode } from 'react';
import {
    tableCellClassName,
    tableClassName,
} from '@/components/editor/table-node-static';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function TableAction({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: ReactNode;
}): ReactElement {
    return (
        <Button
            aria-label={label}
            onClick={onClick}
            onMouseDown={(event) => event.preventDefault()}
            size="icon-sm"
            title={label}
            variant="ghost"
        >
            {children}
        </Button>
    );
}

function TableToolbar(): ReactElement {
    const { tf } = useEditorPlugin(TablePlugin);

    return (
        <div
            className="absolute -top-11 right-0 z-20 flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg/5"
            contentEditable={false}
            role="toolbar"
            aria-label="Таблица"
        >
            <TableAction
                label="Строка выше"
                onClick={() => tf.insert.tableRow({ before: true })}
            >
                <ArrowUpToLine />
            </TableAction>
            <TableAction
                label="Строка ниже"
                onClick={() => tf.insert.tableRow()}
            >
                <ArrowDownToLine />
            </TableAction>
            <TableAction
                label="Столбец слева"
                onClick={() => tf.insert.tableColumn({ before: true })}
            >
                <ArrowLeftToLine />
            </TableAction>
            <TableAction
                label="Столбец справа"
                onClick={() => tf.insert.tableColumn()}
            >
                <ArrowRightToLine />
            </TableAction>
            <Separator className="mx-0.5 h-5" orientation="vertical" />
            <TableAction
                label="Удалить строку"
                onClick={() => tf.remove.tableRow()}
            >
                <Rows2 />
            </TableAction>
            <TableAction
                label="Удалить столбец"
                onClick={() => tf.remove.tableColumn()}
            >
                <Columns2 />
            </TableAction>
            <TableAction
                label="Удалить таблицу"
                onClick={() => tf.remove.table()}
            >
                <Trash2 />
            </TableAction>
        </div>
    );
}

export function TableElement({
    children,
    ...props
}: PlateElementProps<TTableElement>): ReactElement {
    const selected = useSelected();
    const focused = useFocused();
    const readOnly = useReadOnly();

    return (
        <PlateElement {...props} className="relative my-4">
            {selected && focused && !readOnly ? <TableToolbar /> : null}
            <div className="overflow-x-auto">
                <table className={tableClassName}>
                    <tbody>{children}</tbody>
                </table>
            </div>
        </PlateElement>
    );
}

export function TableRowElement(props: PlateElementProps): ReactElement {
    return <PlateElement {...props} as="tr" />;
}

function TableCell({
    isHeader,
    ...props
}: PlateElementProps<TTableCellElement> & {
    isHeader?: boolean;
}): ReactElement {
    const { api } = useEditorPlugin(TablePlugin);

    return (
        <PlateElement
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

export function TableCellElement(
    props: PlateElementProps<TTableCellElement>,
): ReactElement {
    return <TableCell {...props} />;
}

export function TableCellHeaderElement(
    props: PlateElementProps<TTableCellElement>,
): ReactElement {
    return <TableCell {...props} isHeader />;
}
