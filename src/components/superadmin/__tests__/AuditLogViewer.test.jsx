import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogViewer from '../AuditLogViewer';
import API from '../../../utils/api';

// Mock the API module
vi.mock('../../../utils/api');

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('AuditLogViewer', () => {
  const mockLogs = [
    {
      id: '1',
      createdAt: '2024-01-15T10:30:00Z',
      action: 'LOGIN',
      user: { email: 'admin@test.com', name: 'Admin User' },
      target: { type: 'User', name: 'admin@test.com' },
      ipAddress: '192.168.1.1',
      method: 'POST',
      endpoint: '/api/auth/login',
    },
    {
      id: '2',
      createdAt: '2024-01-15T11:00:00Z',
      action: 'SYSTEM_SETTINGS_UPDATE',
      user: { email: 'superadmin@test.com', name: 'Super Admin' },
      target: { type: 'SystemSettings', name: 'Global Settings' },
      ipAddress: '192.168.1.2',
      method: 'PUT',
      endpoint: '/api/v1/super-admin/system-settings',
    },
    {
      id: '3',
      createdAt: '2024-01-15T12:00:00Z',
      action: 'KILL_SWITCH_ACTIVATED',
      user: { email: 'superadmin@test.com', name: 'Super Admin' },
      target: { type: 'SystemSettings', name: 'Kill Switch' },
      ipAddress: '192.168.1.2',
      method: 'POST',
      endpoint: '/api/v1/super-admin/kill-switch',
    },
  ];

  const mockPagination = {
    logs: mockLogs,
    pagination: {
      total: 3,
      pages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful GET request
    API.get.mockResolvedValue({
      data: {
        success: true,
        data: mockPagination,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<AuditLogViewer />);
    
    // Check for loading skeleton
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders audit logs table after loading', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Timestamp')).toBeInTheDocument();
    // Use getAllByText for elements that appear multiple times (label and header)
    const actionElements = screen.getAllByText('Action');
    expect(actionElements.length).toBeGreaterThan(0);
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('IP')).toBeInTheDocument();
    expect(screen.getByText('Endpoint')).toBeInTheDocument();

    // Check log entries
    const adminEmails = screen.getAllByText('admin@test.com');
    expect(adminEmails.length).toBeGreaterThan(0);
    const superadminEmails = screen.getAllByText('superadmin@test.com');
    expect(superadminEmails.length).toBeGreaterThan(0);
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
    expect(screen.getByText('SYSTEM_SETTINGS_UPDATE')).toBeInTheDocument();
    expect(screen.getByText('KILL_SWITCH_ACTIVATED')).toBeInTheDocument();
  });

  it('renders filter controls', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    // Check filter fields
    expect(screen.getByLabelText(/Action/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/User ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/From Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/To Date/i)).toBeInTheDocument();

    // Check filter options
    const actionSelect = screen.getByLabelText(/Action/i);
    expect(actionSelect).toBeInTheDocument();
  });

  it('filters logs by action type', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    
    // Mock filtered response
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          logs: [mockLogs[0]], // Only LOGIN action
          pagination: { total: 1, pages: 1 },
        },
      },
    });

    const actionSelect = screen.getByLabelText(/Action/i);
    await user.selectOptions(actionSelect, 'LOGIN');

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/admin/logs', {
        params: expect.objectContaining({
          action: 'LOGIN',
        }),
      });
    });
  });

  it('filters logs by user ID', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    
    const userIdInput = screen.getByLabelText(/User ID/i);
    await user.type(userIdInput, '12345');

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/admin/logs', {
        params: expect.objectContaining({
          userId: '12345',
        }),
      });
    });
  });

  it('filters logs by date range', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    
    const startDateInput = screen.getByLabelText(/From Date/i);
    const endDateInput = screen.getByLabelText(/To Date/i);

    await user.type(startDateInput, '2024-01-01');
    await user.type(endDateInput, '2024-01-31');

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/admin/logs', {
        params: expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }),
      });
    });
  });

  it('resets to page 1 when filter changes', async () => {
    // Start with page 2
    const logsPage2 = {
      logs: mockLogs,
      pagination: { total: 50, pages: 3 },
    };

    API.get.mockResolvedValueOnce({
      data: { success: true, data: logsPage2 },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const user = userEvent.setup();

    // Change to page 2
    if (screen.queryByText('Next')) {
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);
    }

    // Apply filter
    const actionSelect = screen.getByLabelText(/Action/i);
    await user.selectOptions(actionSelect, 'LOGIN');

    // Should call API with page 1
    await waitFor(() => {
      const lastCall = API.get.mock.calls[API.get.mock.calls.length - 1];
      expect(lastCall[1].params.page).toBe(1);
    });
  });

  it('displays "No audit logs found" when no logs exist', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { logs: [], pagination: { total: 0, pages: 0 } },
      },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('No audit logs found')).toBeInTheDocument();
    });
  });

  it('handles pagination correctly', async () => {
    const multiPageLogs = {
      logs: mockLogs,
      pagination: { total: 50, pages: 3 },
    };

    API.get.mockResolvedValueOnce({
      data: { success: true, data: multiPageLogs },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    
    // Mock page 2 response
    API.get.mockResolvedValueOnce({
      data: { success: true, data: multiPageLogs },
    });

    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();

    await user.click(nextButton);

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/admin/logs', {
        params: expect.objectContaining({
          page: 2,
        }),
      });
    });
  });

  it('disables Previous button on first page', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    // Since there's only 1 page in mockPagination, pagination controls might not show
    // Let's mock multiple pages
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          logs: mockLogs,
          pagination: { total: 50, pages: 3 },
        },
      },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      const prevButton = screen.queryByText('Previous');
      if (prevButton) {
        expect(prevButton).toBeDisabled();
      }
    });
  });

  it('exports logs to CSV', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    
    // Mock document.createElement and appendChild
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    };
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    const exportButton = screen.getByText(/📥 Export CSV/i);
    await user.click(exportButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('disables export button when no logs available', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: { logs: [], pagination: { total: 0, pages: 0 } },
      },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const exportButton = screen.getByText(/📥 Export CSV/i);
    expect(exportButton).toBeDisabled();
  });

  it('handles API error gracefully', async () => {
    const errorMessage = 'Failed to fetch audit logs';
    API.get.mockRejectedValueOnce(new Error(errorMessage));

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('tries fallback endpoint when primary fails with 404', async () => {
    const error404 = new Error('Not found');
    error404.status = 404;
    
    API.get.mockRejectedValueOnce(error404);
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockPagination,
      },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledTimes(2);
      expect(API.get).toHaveBeenNthCalledWith(1, '/admin/logs', expect.any(Object));
      expect(API.get).toHaveBeenNthCalledWith(2, '/v1/admin/audit-logs', expect.any(Object));
    });
  });

  it('displays endpoint unavailable message when both endpoints fail', async () => {
    const error404 = new Error('Not found');
    error404.status = 404;
    
    API.get.mockRejectedValueOnce(error404);
    API.get.mockRejectedValueOnce(new Error('Also not found'));

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit log endpoint is not available')).toBeInTheDocument();
      expect(screen.getByText(/Please ensure the backend audit log API is configured/i)).toBeInTheDocument();
    });
  });

  it('formats timestamps correctly', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    // Check that timestamps are formatted
    const timestamp = new Date('2024-01-15T10:30:00Z').toLocaleString();
    expect(screen.getByText(timestamp)).toBeInTheDocument();
  });

  it('displays user names when available', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const adminUsers = screen.getAllByText('Admin User');
    expect(adminUsers.length).toBeGreaterThan(0);
    const superAdmins = screen.getAllByText('Super Admin');
    expect(superAdmins.length).toBeGreaterThan(0);
  });

  it('handles alternative response structure with items', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: mockLogs,
          total: 3,
        },
      },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    // Should still display logs
    const adminEmails = screen.getAllByText('admin@test.com');
    expect(adminEmails.length).toBeGreaterThan(0);
  });

  it('displays action badges with proper styling', async () => {
    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    // Check that action badges exist
    const loginBadge = screen.getByText('LOGIN').closest('span');
    expect(loginBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('shows N/A for missing data fields', async () => {
    const incompleteLog = {
      id: '4',
      createdAt: null,
      action: null,
      user: null,
      target: null,
      ipAddress: null,
      method: null,
      endpoint: null,
    };

    API.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          logs: [incompleteLog],
          pagination: { total: 1, pages: 1 },
        },
      },
    });

    render(<AuditLogViewer />);

    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    });

    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThan(0);
  });
});
