import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropzone } from './dropzone';

const plan = new File(['png'], 'plan.png', { type: 'image/png' });

function zone(): HTMLElement {
    return screen
        .getByLabelText('Выберите файлы')
        .closest('[data-slot="dropzone"]') as HTMLElement;
}

describe('Dropzone', () => {
    it('hands picked files to onFiles', async () => {
        const onFiles = vi.fn();
        const user = userEvent.setup();

        render(<Dropzone onFiles={onFiles} />);

        await user.upload(screen.getByLabelText('Выберите файлы'), plan);

        expect(onFiles).toHaveBeenCalledWith([plan]);
    });

    it('hands dropped files to onFiles', () => {
        const onFiles = vi.fn();

        render(<Dropzone onFiles={onFiles} />);

        fireEvent.dragOver(zone());

        expect(zone()).toHaveAttribute('data-dragging');
        expect(screen.getByText('Отпустите, чтобы добавить')).toBeVisible();

        fireEvent.drop(zone(), { dataTransfer: { files: [plan] } });

        expect(onFiles).toHaveBeenCalledWith([plan]);
        expect(zone()).not.toHaveAttribute('data-dragging');
    });

    it('ignores drops while disabled', () => {
        const onFiles = vi.fn();

        render(<Dropzone disabled onFiles={onFiles} />);

        fireEvent.drop(zone(), { dataTransfer: { files: [plan] } });

        expect(onFiles).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Выберите файлы')).toBeDisabled();
    });

    it('keeps one dropped file when multiple is off', () => {
        const onFiles = vi.fn();
        const other = new File(['jpg'], 'other.jpg', { type: 'image/jpeg' });

        render(<Dropzone multiple={false} onFiles={onFiles} />);

        fireEvent.drop(zone(), { dataTransfer: { files: [plan, other] } });

        expect(onFiles).toHaveBeenCalledWith([plan]);
    });
});
