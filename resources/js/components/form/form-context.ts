import { createContext } from 'react';

/**
 * Paths the surrounding form knows about, derived from its default values.
 * `null` when no form provides it, which switches the dev-time name check off.
 */
export const FieldPathsContext = createContext<Set<string> | null>(null);
