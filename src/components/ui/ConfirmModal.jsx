import React, { useEffect, useRef, useState } from 'react';

/**
 * ConfirmModal Component
 *
 * A reusable confirmation modal with accessibility features.
 * Supports optional text confirmation requirement.
 *
 * @param {boolean} open - Controls modal visibility
 * @param {string} title - Modal title
 * @param {string} message - Modal message/description
 * @param {boolean} requireTextConfirm - If true, user must type confirmation text
 * @param {string} confirmText - Text to match for confirmation (default: "confirm")
 * @param {string} confirmButtonText - Custom confirm button text (default: "Confirm")
 * @param {string} cancelButtonText - Custom cancel button text (default: "Cancel")
 * @param {function} onConfirm - Callback when confirmed
 * @param {function} onCancel - Callback when canceled
 */
function ConfirmModal({
  open = false,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  requireTextConfirm = false,
  confirmText = 'confirm',
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const [inputValue, setInputValue] = useState('');
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Focus trap elements
  const firstFocusableElement = useRef(null);
  const lastFocusableElement = useRef(null);

  useEffect(() => {
    if (open) {
      // Reset input value when modal opens
      setInputValue('');

      // Set initial focus
      if (requireTextConfirm) {
        // Focus the input if text confirmation is required
        setTimeout(() => {
          const input = modalRef.current?.querySelector('input[type="text"]');
          input?.focus();
        }, 0);
      } else {
        // Focus the cancel button by default (safer)
        setTimeout(() => {
          cancelButtonRef.current?.focus();
        }, 0);
      }

      // Set up focus trap
      const modal = modalRef.current;
      if (modal) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusableElement.current = focusableElements[0];
        lastFocusableElement.current = focusableElements[focusableElements.length - 1];
      }
    }
  }, [open, requireTextConfirm]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }

      // Focus trap: Tab key handling
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableElement.current) {
            e.preventDefault();
            lastFocusableElement.current?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableElement.current) {
            e.preventDefault();
            firstFocusableElement.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleConfirm = () => {
    if (requireTextConfirm && inputValue.toLowerCase() !== confirmText.toLowerCase()) {
      return; // Don't confirm if text doesn't match
    }
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const isConfirmDisabled =
    requireTextConfirm && inputValue.toLowerCase() !== confirmText.toLowerCase();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Title */}
          <h2 id="confirm-modal-title" className="text-xl font-bold text-gray-900 mb-4">
            {title}
          </h2>

          {/* Message */}
          <p id="confirm-modal-description" className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Text Confirmation Input */}
          {requireTextConfirm && (
            <div className="mb-6">
              <label
                htmlFor="confirm-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type <span className="font-mono font-bold">{confirmText}</span> to confirm:
              </label>
              <input
                id="confirm-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={confirmText}
                autoComplete="off"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              {cancelButtonText}
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className={`px-4 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 ${
                isConfirmDisabled ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmModal;
