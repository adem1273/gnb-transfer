/**
 * ConfirmModal Component Tests
 *
 * Tests for the reusable confirmation modal component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal Component', () => {
  let onConfirm;
  let onCancel;

  beforeEach(() => {
    onConfirm = vi.fn();
    onCancel = vi.fn();
  });

  describe('Visibility', () => {
    it('should not render when open is false', () => {
      const { container } = render(
        <ConfirmModal open={false} onConfirm={onConfirm} onCancel={onCancel} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when open is true', () => {
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display custom title', () => {
      render(
        <ConfirmModal
          open={true}
          title="Delete Confirmation"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
    });

    it('should display custom message', () => {
      const message = 'Are you sure you want to delete this item?';
      render(
        <ConfirmModal open={true} message={message} onConfirm={onConfirm} onCancel={onCancel} />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it('should display default title when not provided', () => {
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should display default message when not provided', () => {
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });
  });

  describe('Button Actions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />
      );

      const backdrop = container.querySelector('.fixed.inset-0.bg-black');
      await user.click(backdrop);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should display custom button text', () => {
      render(
        <ConfirmModal
          open={true}
          confirmButtonText="Delete Now"
          cancelButtonText="Go Back"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByRole('button', { name: 'Delete Now' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    });
  });

  describe('Text Confirmation', () => {
    it('should show input field when requireTextConfirm is true', () => {
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="DELETE"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(screen.getByText(/DELETE/)).toBeInTheDocument();
    });

    it('should not show input field when requireTextConfirm is false', () => {
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={false}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('should disable confirm button when text does not match', () => {
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when text matches', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const input = screen.getByRole('textbox');
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      expect(confirmButton).toBeDisabled();

      await user.type(input, 'confirm');

      expect(confirmButton).not.toBeDisabled();
    });

    it('should be case-insensitive when matching text', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="DELETE"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const input = screen.getByRole('textbox');
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      await user.type(input, 'delete'); // Lowercase

      expect(confirmButton).not.toBeDisabled();

      await user.click(confirmButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should not call onConfirm if text does not match', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const input = screen.getByRole('textbox');
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      await user.type(input, 'wrong');

      // Button should still be disabled
      expect(confirmButton).toBeDisabled();
    });

    it('should reset input value when modal reopens', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'test');

      expect(input).toHaveValue('test');

      // Close modal
      rerender(
        <ConfirmModal
          open={false}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      // Reopen modal
      rerender(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const newInput = screen.getByRole('textbox');
      expect(newInput).toHaveValue('');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal when Escape key is pressed', async () => {
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const input = screen.getByRole('textbox');
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      // Tab through elements
      await user.tab();
      // Should cycle through: input -> cancel -> confirm -> back to input
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-modal-description');
    });

    it('should focus cancel button by default', async () => {
      render(<ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toHaveFocus();
      });
    });

    it('should focus input when requireTextConfirm is true', async () => {
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText="confirm"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveFocus();
      });
    });

    it('should have backdrop with aria-hidden', () => {
      const { container } = render(
        <ConfirmModal open={true} onConfirm={onConfirm} onCancel={onCancel} />
      );

      const backdrop = container.querySelector('.fixed.inset-0.bg-black');
      expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing callbacks gracefully', async () => {
      const user = userEvent.setup();
      render(<ConfirmModal open={true} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Should not throw errors
      await user.click(confirmButton);
      await user.click(cancelButton);
    });

    it('should handle empty confirmText', () => {
      render(
        <ConfirmModal
          open={true}
          requireTextConfirm={true}
          confirmText=""
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', '');
    });

    it('should handle React elements as message', () => {
      const message = (
        <div>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      );

      render(<ConfirmModal open={true} message={message} onConfirm={onConfirm} onCancel={onCancel} />);

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should handle multiple modals correctly', () => {
      const onConfirm1 = vi.fn();
      const onCancel1 = vi.fn();
      const onConfirm2 = vi.fn();
      const onCancel2 = vi.fn();

      const { rerender } = render(
        <>
          <ConfirmModal
            open={true}
            title="Modal 1"
            onConfirm={onConfirm1}
            onCancel={onCancel1}
          />
          <ConfirmModal
            open={false}
            title="Modal 2"
            onConfirm={onConfirm2}
            onCancel={onCancel2}
          />
        </>
      );

      expect(screen.getByText('Modal 1')).toBeInTheDocument();
      expect(screen.queryByText('Modal 2')).not.toBeInTheDocument();

      // Switch modals
      rerender(
        <>
          <ConfirmModal
            open={false}
            title="Modal 1"
            onConfirm={onConfirm1}
            onCancel={onCancel1}
          />
          <ConfirmModal
            open={true}
            title="Modal 2"
            onConfirm={onConfirm2}
            onCancel={onCancel2}
          />
        </>
      );

      expect(screen.queryByText('Modal 1')).not.toBeInTheDocument();
      expect(screen.getByText('Modal 2')).toBeInTheDocument();
    });
  });
});
