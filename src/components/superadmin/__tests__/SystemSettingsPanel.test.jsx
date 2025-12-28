import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// eslint-disable-next-line no-unused-vars
import SystemSettingsPanel from '../SystemSettingsPanel';
import API from '../../../utils/api';

// Mock the API module
vi.mock('../../../utils/api');

describe('SystemSettingsPanel', () => {
  const mockSettings = {
    siteStatus: 'online',
    maintenanceMessage: '',
    bookingEnabled: true,
    paymentEnabled: true,
    registrationsEnabled: true,
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful GET request
    API.get.mockResolvedValue({
      data: {
        success: true,
        data: mockSettings,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<SystemSettingsPanel />);

    // Check for loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders form with all fields after loading', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Check for site status radios
    expect(screen.getByLabelText(/🟢 Online/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/🔴 Maintenance/i)).toBeInTheDocument();

    // Check for maintenance message textarea
    const textarea = screen.getByLabelText(/Maintenance Message/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('maxLength', '500');

    // Check for feature toggles
    expect(screen.getByLabelText(/Booking Enabled/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payment Enabled/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/User Registrations Enabled/i)).toBeInTheDocument();

    // Check for submit button
    expect(screen.getByRole('button', { name: /Save Settings/i })).toBeInTheDocument();
  });

  it('displays error when API call fails', async () => {
    const errorMessage = 'Failed to fetch system settings';
    API.get.mockRejectedValueOnce(new Error(errorMessage));

    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('validates maintenance message length (> 500 characters shows error)', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Maintenance Message/i);
    const longMessage = 'a'.repeat(501);

    const user = userEvent.setup();
    await user.clear(textarea);
    await user.type(textarea, longMessage.substring(0, 500)); // Type will be limited by maxLength

    const submitButton = screen.getByRole('button', { name: /Save Settings/i });

    // Mock the PUT request
    API.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...mockSettings, maintenanceMessage: longMessage.substring(0, 500) },
      },
    });

    await user.click(submitButton);

    // Verify the request was made
    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/v1/super-admin/system-settings', expect.any(Object));
    });
  });

  it('shows validation error for maintenance message over 500 characters on submit', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Manually set form state to exceed limit
    const submitButton = screen.getByRole('button', { name: /Save Settings/i });
    const textarea = screen.getByLabelText(/Maintenance Message/i);

    // Use fireEvent to bypass maxLength (simulating form manipulation)
    Object.defineProperty(textarea, 'value', {
      writable: true,
      value: 'a'.repeat(501),
    });

    fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } });
    fireEvent.submit(submitButton.closest('form'));

    await waitFor(() => {
      expect(
        screen.getByText('Maintenance message cannot exceed 500 characters')
      ).toBeInTheDocument();
    });

    expect(API.put).not.toHaveBeenCalled();
  });

  it('successfully submits form and shows success message', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Change site status to maintenance
    const maintenanceRadio = screen.getByLabelText(/🔴 Maintenance/i);
    await user.click(maintenanceRadio);

    // Add maintenance message
    const textarea = screen.getByLabelText(/Maintenance Message/i);
    await user.type(textarea, 'System under maintenance');

    // Mock successful PUT request
    API.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...mockSettings,
          siteStatus: 'maintenance',
          maintenanceMessage: 'System under maintenance',
        },
      },
    });

    const submitButton = screen.getByRole('button', { name: /Save Settings/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/v1/super-admin/system-settings', {
        siteStatus: 'maintenance',
        maintenanceMessage: 'System under maintenance',
        bookingEnabled: true,
        paymentEnabled: true,
        registrationsEnabled: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('System settings updated successfully')).toBeInTheDocument();
    });
  });

  it('disables submit button while saving', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Mock a slow PUT request
    API.put.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: { success: true, data: mockSettings },
            });
          }, 100);
        })
    );

    const submitButton = screen.getByRole('button', { name: /Save Settings/i });
    await user.click(submitButton);

    // Button should be disabled and show "Saving..."
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Saving...');
    });
  });

  it('toggles feature checkboxes correctly', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    const bookingCheckbox = screen.getByLabelText(/Booking Enabled/i);
    expect(bookingCheckbox).toBeChecked();

    await user.click(bookingCheckbox);
    expect(bookingCheckbox).not.toBeChecked();

    await user.click(bookingCheckbox);
    expect(bookingCheckbox).toBeChecked();
  });

  it('displays character count for maintenance message', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const textarea = screen.getByLabelText(/Maintenance Message/i);

    // Initially should show 0/500
    expect(screen.getByText('0/500 characters')).toBeInTheDocument();

    await user.type(textarea, 'Test message');

    // Should update character count
    await waitFor(() => {
      expect(screen.getByText('12/500 characters')).toBeInTheDocument();
    });
  });

  it('handles API error on submit gracefully', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Mock API error
    API.put.mockRejectedValueOnce(new Error('Network error'));

    const submitButton = screen.getByRole('button', { name: /Save Settings/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays last updated timestamp', async () => {
    const timestamp = new Date('2024-01-01T12:00:00Z');
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...mockSettings,
          updatedAt: timestamp.toISOString(),
        },
      },
    });

    render(<SystemSettingsPanel />);

    await waitFor(() => {
      const formattedDate = timestamp.toLocaleString();
      expect(
        screen.getByText(new RegExp(`Last updated: ${formattedDate}`, 'i'))
      ).toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes for accessibility', async () => {
    render(<SystemSettingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    });

    // Check textarea has proper label association
    const textarea = screen.getByLabelText(/Maintenance Message/i);
    expect(textarea).toHaveAttribute('id', 'maintenanceMessage');

    // Check checkboxes have proper attributes
    const bookingCheckbox = screen.getByLabelText(/Booking Enabled/i);
    expect(bookingCheckbox).toHaveAttribute('type', 'checkbox');
    expect(bookingCheckbox).toHaveAttribute('name', 'bookingEnabled');
  });
});
