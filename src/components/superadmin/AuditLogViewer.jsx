import React, { useState, useEffect } from 'react';
import API from '../../utils/api';

/**
 * AuditLogViewer Component
 *
 * Displays audit logs with filtering and pagination.
 * Supports filtering by action, user, and date range.
 * Includes CSV export functionality.
 *
 * @component
 */
function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Endpoint availability
  const [endpointAvailable, setEndpointAvailable] = useState(true);

  // Fetch logs on mount and when filters/page change
  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

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

      // Try primary endpoint
      let response;
      try {
        response = await API.get('/admin/logs', { params });
      } catch (err) {
        // Try fallback endpoint if primary fails with 404
        if (err.status === 404) {
          try {
            response = await API.get('/v1/admin/audit-logs', { params });
          } catch (fallbackErr) {
            setEndpointAvailable(false);
            throw fallbackErr;
          }
        } else {
          throw err;
        }
      }

      if (response.data && response.data.success) {
        const data = response.data.data;
        
        // Handle different response structures
        if (data.logs) {
          setLogs(data.logs);
          if (data.pagination) {
            setPagination((prev) => ({
              ...prev,
              total: data.pagination.total,
              pages: data.pagination.pages,
            }));
          }
        } else if (data.items) {
          // Alternative structure
          setLogs(data.items);
          setPagination((prev) => ({
            ...prev,
            total: data.total || 0,
            pages: Math.ceil((data.total || 0) / prev.limit),
          }));
        } else {
          setLogs([]);
        }
      }
    } catch (err) {
      if (!endpointAvailable) {
        setError('Audit log endpoint not available');
      } else {
        setError(err.message || 'Failed to fetch audit logs');
      }
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('No logs to export');
      return;
    }

    // Create CSV content
    const headers = ['Timestamp', 'Action', 'User Email', 'User Name', 'Target Type', 'Target Name', 'IP Address', 'Method', 'Endpoint'];
    const rows = logs.map((log) => [
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

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maskSensitiveData = (metadata) => {
    if (!metadata) return '';
    
    try {
      const data = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      
      // Create a truncated preview
      const preview = JSON.stringify(data, null, 2);
      if (preview.length > 100) {
        return preview.substring(0, 100) + '...';
      }
      return preview;
    } catch (err) {
      return '';
    }
  };

  if (!endpointAvailable) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Audit Logs</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">Audit log endpoint is not available</p>
          <p className="text-sm text-gray-500 mt-2">Please ensure the backend audit log API is configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Audit Logs</h2>
        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📥 Export CSV
        </button>
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
        <div className="text-center py-8 text-gray-500">
          No audit logs found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log, index) => (
                <tr key={log._id || index} className="hover:bg-gray-50">
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
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
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
