import { describe, expect, it } from 'vitest';
import { formatFileSize } from './format-file-size';

describe('formatFileSize', () => {
    it('shows kilobytes below a megabyte, never less than one', () => {
        expect(formatFileSize(0)).toBe('1 КБ');
        expect(formatFileSize(840 * 1024)).toBe('840 КБ');
    });

    it('shows megabytes with up to two decimals', () => {
        expect(formatFileSize(8 * 1024 * 1024)).toBe('8 МБ');
        expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1,5 МБ');
        expect(formatFileSize(1.234 * 1024 * 1024)).toBe('1,23 МБ');
    });
});
