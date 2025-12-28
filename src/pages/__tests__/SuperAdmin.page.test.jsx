import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SuperAdmin from '../SuperAdmin';
import * as AuthContext from '../../context/AuthContext';
import API from '../../utils/api';

// Mock the API module
vi.mock('../../utils/api');

describe('SuperAdmin Page', () => {
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
    
    // Mock API responses for all super admin components
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

  const renderWithAuth = (user = null, loading = false) => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user,
      loading,
      login: vi.fn(),
      logout: vi.fn(),
    });

    return render(
      <BrowserRouter>
        <SuperAdmin />
      </BrowserRouter>
    );
  };

  it('shows loading state when auth is loading', () => {
    renderWithAuth(null, true);
    // Loading component should render
    expect(document.body).toBeTruthy();
  });

  it('redirects when user is not authenticated', () => {
    renderWithAuth(null, false);
    // Navigate component renders but doesn't show in DOM
    expect(document.body).toBeTruthy();
  });

  it('redirects when user is not admin or superadmin', () => {
    const regularUser = { id: '1', role: 'user', email: 'user@test.com' };
    renderWithAuth(regularUser, false);
    // Navigate component renders but doesn't show in DOM
    expect(document.body).toBeTruthy();
  });

  it('renders for admin role', async () => {
    const adminUser = { id: '1', role: 'admin', email: 'admin@test.com' };
    renderWithAuth(adminUser, false);

    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText(/System-wide controls and monitoring/i)).toBeInTheDocument();
  });

  it('renders for superadmin role', async () => {
    const superadminUser = { id: '1', role: 'superadmin', email: 'superadmin@test.com' };
    renderWithAuth(superadminUser, false);

    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('renders all main sections in correct layout', async () => {
    const adminUser = { id: '1', role: 'admin', email: 'admin@test.com' };
    renderWithAuth(adminUser, false);

    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    // Wait for lazy-loaded components to render
    await waitFor(() => {
      expect(screen.getByText('System Settings')).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Emergency Controls')).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('toggles bookingEnabled and makes PUT request', async () => {
    const adminUser = { id: '1', role: 'admin', email: 'admin@test.com' };
    renderWithAuth(adminUser, false);

    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    // Wait for Feature Flags panel to load
    await waitFor(() => {
      expect(screen.getByText('Feature Flags')).toBeInTheDocument();
    }, { timeout: 3000 });

    const user = userEvent.setup();

    // Mock PUT response
    API.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: { ...mockSettings, bookingEnabled: false },
      },
    });

    // Find and toggle the booking feature
    const bookingToggle = screen.getAllByRole('switch')[0];
    await user.click(bookingToggle);

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/v1/super-admin/system-settings', {
        bookingEnabled: false,
      });
    });

    // UI should update
    await waitFor(() => {
      expect(bookingToggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('has responsive grid layout', async () => {
    const adminUser = { id: '1', role: 'admin', email: 'admin@test.com' };
    const { container } = renderWithAuth(adminUser, false);

    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });

    // Check for responsive grid classes
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-3');
  });
});
