import { describe, expect, it } from 'vitest';
import {
    EMPTY_EDITOR_VALUE,
    isEditorValueEmpty,
} from '@/components/editor/editor-value';

describe('isEditorValueEmpty', () => {
    it('treats a blank paragraph as empty', () => {
        expect(isEditorValueEmpty(EMPTY_EDITOR_VALUE)).toBe(true);
        expect(
            isEditorValueEmpty([{ type: 'p', children: [{ text: '   ' }] }]),
        ).toBe(true);
        expect(isEditorValueEmpty(null)).toBe(true);
    });

    it('treats text, images and tables as content', () => {
        expect(
            isEditorValueEmpty([{ type: 'p', children: [{ text: 'Да' }] }]),
        ).toBe(false);
        expect(
            isEditorValueEmpty([
                {
                    type: 'img',
                    url: 'https://a.b/c.png',
                    children: [{ text: '' }],
                },
            ]),
        ).toBe(false);
    });
});
