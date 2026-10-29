const fractionFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
});

/**
 * A file size as people read it: «840 КБ», «1,5 МБ». Anything under a
 * kilobyte still reads as «1 КБ», so a tiny file never shows as empty.
 */
export function formatFileSize(bytes: number): string {
    return bytes >= 1024 * 1024
        ? `${fractionFormatter.format(bytes / 1024 / 1024)} МБ`
        : `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}
