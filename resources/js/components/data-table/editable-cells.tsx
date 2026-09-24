import type { ReactElement, ReactNode } from 'react';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

export type EditableCellAddress = {
    rowId: string;
    columnId: string;
};

export type EditableCellStep = 'next' | 'previous' | 'up' | 'down';

type EditableGrid = {
    editing: EditableCellAddress | null;
    start: (address: EditableCellAddress) => void;
    stop: () => void;
    step: (from: EditableCellAddress, step: EditableCellStep) => void;
};

const EditableCellsContext = createContext<EditableGrid | null>(null);

export function useEditableCells(): EditableGrid {
    const grid = useContext(EditableCellsContext);

    if (!grid) {
        throw new Error(
            'An editable cell has to sit inside an EditableCells provider.',
        );
    }

    return grid;
}

export type EditableCellsProps = {
    rowIds: string[];
    columnIds: string[];
    children: ReactNode;
};

export function EditableCells({
    rowIds,
    columnIds,
    children,
}: EditableCellsProps): ReactElement {
    const [editing, setEditing] = useState<EditableCellAddress | null>(null);

    const step = useCallback(
        (from: EditableCellAddress, direction: EditableCellStep) => {
            const rowIndex = rowIds.indexOf(from.rowId);
            const columnIndex = columnIds.indexOf(from.columnId);

            if (rowIndex === -1 || columnIndex === -1) {
                return;
            }

            if (direction === 'up' || direction === 'down') {
                const nextRow = rowIndex + (direction === 'down' ? 1 : -1);

                setEditing(
                    rowIds[nextRow] === undefined
                        ? null
                        : { columnId: from.columnId, rowId: rowIds[nextRow] },
                );

                return;
            }

            const flat = rowIndex * columnIds.length + columnIndex;
            const nextFlat = flat + (direction === 'next' ? 1 : -1);

            if (nextFlat < 0 || nextFlat >= rowIds.length * columnIds.length) {
                setEditing(null);

                return;
            }

            setEditing({
                columnId: columnIds[nextFlat % columnIds.length],
                rowId: rowIds[Math.floor(nextFlat / columnIds.length)],
            });
        },
        [rowIds, columnIds],
    );

    const grid = useMemo<EditableGrid>(
        () => ({
            editing,
            start: setEditing,
            step,
            stop: () => setEditing(null),
        }),
        [editing, step],
    );

    return (
        <EditableCellsContext.Provider value={grid}>
            {children}
        </EditableCellsContext.Provider>
    );
}
