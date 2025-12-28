import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { LoadingButton } from '../ui';
import { useToast } from '../ui/ToastProvider';
import { handleError } from '../../utils/errorHandler';

/**
 * AuditLogViewer Component
 *
 * Displays audit logs with filtering and pagination.
 * Supports filtering by action, user, and date range.
 * Includes CSV export functionality with endpoint auto-detection.
 *
 * @component
 */
function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
  });

  // Endpoint availability and caching
  const [endpointAvailable, setEndpointAvailable] = useState(true);
  const [workingEndpoint, setWorkingEndpoint] = useState(null);

  const { toast } = useToast();

  // Fetch logs on mount and when filters/page change
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };

        if (filters.action) params.action = filters.action;
        if (filters.userId) params.userId = filters.userId;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        // Try endpoints in order
        const endpoints = ['/admin/logs', '/admin/audit-logs', '/logs'];

        let response;
        let foundEndpoint = workingEndpoint;

        // If we have a working endpoint cached, try that first
        if (workingEndpoint) {
          try {
            response = await API.get(workingEndpoint, { params });
          } catch (err) {
            // Cached endpoint failed, clear it and try all endpoints
            foundEndpoint = null;
            setWorkingEndpoint(null);
          }
        }

        // If no response yet, try all endpoints
        if (!response) {
          for (const endpoint of endpoints) {
            try {
              response = await API.get(endpoint, { params });
              foundEndpoint = endpoint;
              setWorkingEndpoint(endpoint);
              localStorage.setItem('auditLogEndpoint', endpoint);
              break;
            } catch (err) {
              // Try next endpoint
              continue;
            }
          }
        }

        if (!response) {
          setEndpointAvailable(false);
          console.warn('No audit log endpoint available. Tried:', endpoints);
          setError('Audit log endpoint not available');
          return;
        }

        setEndpointAvailable(true);

        if (response.data && response.data.success) {
          const responseData = response.data.data;

          // Handle different response structures
          if (responseData.logs) {
            setLogs(responseData.logs);
            if (responseData.pagination) {
              setPagination((prev) => ({
                ...prev,
                total: responseData.pagination.total,
                pages: responseData.pagination.pages,
              }));
            }
          } else if (responseData.items) {
            // Alternative structure
            setLogs(responseData.items);
            setPagination((prev) => ({
              ...prev,
              total: responseData.total || 0,
              pages: Math.ceil((responseData.total || 0) / prev.limit),
            }));
          } else {
            setLogs([]);
          }
        }
      } catch (err) {
        const { userMessage } = handleError(err, 'fetching audit logs');
        setError(userMessage);
        toast.error(userMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [pagination.page, pagination.limit, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleExportCSV = async () => {
    if (logs.length === 0) {
      toast.warning('No logs to export');
      return;
    }

    setExporting(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      );

      // Try backend export endpoints
      const exportEndpoints = [
        `${workingEndpoint}/export`,
        '/admin/logs/export',
        '/admin/audit-logs/export',
      ];

      let exportSuccessful = false;

      for (const endpoint of exportEndpoints) {
        try {
          const response = await API.get(`${endpoint}?${params.toString()}`, {
            responseType: 'blob',
          });

          const blob = response.data;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          toast.success('Audit logs exported successfully');
          exportSuccessful = true;
          break;
        } catch (err) {
          // Try next endpoint
          continue;
        }
      }

      // Fallback: export visible rows as CSV
      if (!exportSuccessful) {
        if (pagination.total > 5000) {
          toast.warning(
            `Exporting ${logs.length} visible rows. Full export requires backend support.`,
            8000
          );
        }
        exportLogsAsCSV(logs);
        toast.success('Audit logs exported successfully');
      }
    } catch (err) {
      const { userMessage } = handleError(err, 'exporting audit logs');
      toast.error(userMessage);
    } finally {
      setExporting(false);
    }
  };

  const exportLogsAsCSV = (logsData) => {
    const headers = [
      'Timestamp',
      'Action',
      'User Email',
      'User Name',
      'Target Type',
      'Target Name',
      'IP Address',
      'Method',
      'Endpoint',
    ];
    const rows = logsData.map((log) => [
      log.createdAt ? new Date(log.createdAt).toISOString() : '',
      log.action || '',
      log.user?.email || '',
      log.user?.name || '',
      log.target?.type || '',
      log.target?.name || '',
      log.ipAddress || '',
      log.method || '',
      log.endpoint || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!endpointAvailable) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Logs</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">Audit log endpoint is not available</p>
          <p className="text-sm text-gray-500 mt-2">
            Please ensure the backend audit log API is configured
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Expected endpoints: /api/v1/admin/logs, /api/v1/admin/audit-logs, or /api/v1/logs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Audit Logs</h2>
        <LoadingButton
          onClick={handleExportCSV}
          loading={exporting}
          disabled={logs.length === 0}
          variant="primary"
          className="text-sm"
        >
          📥 Export CSV
        </LoadingButton>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label htmlFor="action" className="block text-xs font-medium text-gray-700 mb-1">
            Action
          </label>
          <select
            id="action"
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="SYSTEM_SETTINGS_UPDATE">System Settings</option>
            <option value="KILL_SWITCH_ACTIVATED">Kill Switch</option>
          </select>
        </div>

        <div>
          <label htmlFor="userId" className="block text-xs font-medium text-gray-700 mb-1">
            User ID
          </label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={filters.userId}
            onChange={handleFilterChange}
            placeholder="User ID"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No audit logs found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Target
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  IP
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Endpoint
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-900 whitespace-nowrap">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {log.action || 'N/A'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900">
                    <div>{log.user?.email || 'N/A'}</div>
                    {log.user?.name && <div className="text-gray-500">{log.user.name}</div>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-900">
                    <div>{log.target?.type || 'N/A'}</div>
                    {log.target?.name && <div className="text-gray-500">{log.target.name}</div>}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {log.ipAddress || 'N/A'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{log.method || ''}</span>
                      <span className="truncate max-w-xs">{log.endpoint || 'N/A'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogViewer;
