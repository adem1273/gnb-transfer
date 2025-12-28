import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import API from '../utils/api';
import { LoadingButton } from '../components/ui';
import { useToast } from '../components/ui/ToastProvider';
import { handleError } from '../utils/errorHandler';

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });

      const response = await API.get(`/admin/logs?${params.toString()}`);
      setLogs(response.data.data.logs);
      setPagination((prev) => ({
        ...prev,
        ...response.data.data.pagination,
      }));
      setError('');
      setLoading(false);
    } catch (err) {
      const { userMessage } = handleError(err, 'fetching activity logs');
      setError(userMessage);
      setLoading(false);
      toast.error(userMessage);
    }
  };

  const handleFilterChange = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  /**
   * Export logs with automatic endpoint detection and fallback
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      );

      // Try to detect backend export endpoint
      const exportEndpoints = [
        `/admin/logs/export`,
        `/admin/logs/job`,
        `/admin/audit-logs/export`,
      ];

      let exportSuccessful = false;

      // Try each endpoint
      for (const endpoint of exportEndpoints) {
        try {
          const response = await API.get(`${endpoint}?${params.toString()}`, {
            responseType: 'blob',
          });

          // If we get here, the endpoint worked
          const blob = response.data;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          toast.success('Activity logs exported successfully');
          exportSuccessful = true;
          break;
        } catch (err) {
          // Try next endpoint
          continue;
        }
      }

      // If no backend endpoint worked, export visible rows
      if (!exportSuccessful) {
        if (pagination.total > 5000) {
          // For large datasets, warn user and export in chunks
          console.warn(`Large dataset (${pagination.total} rows). Exporting visible rows only.`);
          toast.warning(`Exporting ${logs.length} visible rows. Full export requires backend support.`, 8000);
        }

        exportLogsAsCSV(logs);
        toast.success('Activity logs exported successfully');
      }
    } catch (err) {
      const { userMessage } = handleError(err, 'exporting activity logs');
      toast.error(userMessage);
    } finally {
      setExporting(false);
    }
  };

  /**
   * Fallback CSV export for visible rows
   */
  const exportLogsAsCSV = (logsData) => {
    const headers = ['Timestamp', 'Action', 'User Name', 'User Email', 'User Role', 'Target Type', 'Target Name', 'IP Address'];
    
    const rows = logsData.map(log => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.user.name,
      log.user.email,
      log.user.role,
      log.target.type,
      log.target.name || '',
      log.ipAddress || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'SETTINGS_CHANGE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Helmet>
        <title>Activity Logs | GNB Transfer Admin</title>
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Activity Logs</h2>
        <LoadingButton
          onClick={handleExport}
          loading={exporting}
          variant="primary"
          className="bg-green-600 hover:bg-green-700"
        >
          Export CSV
        </LoadingButton>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="VIEW">View</option>
              <option value="EXPORT">Export</option>
              <option value="SETTINGS_CHANGE">Settings Change</option>
              <option value="CAMPAIGN_CREATE">Campaign Create</option>
              <option value="CAMPAIGN_UPDATE">Campaign Update</option>
              <option value="CAMPAIGN_DELETE">Campaign Delete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Type</label>
            <select
              value={filters.targetType}
              onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">All Types</option>
              <option value="User">User</option>
              <option value="Booking">Booking</option>
              <option value="Tour">Tour</option>
              <option value="Settings">Settings</option>
              <option value="Campaign">Campaign</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => {
              setFilters({ action: '', targetType: '', startDate: '', endDate: '' });
              setTimeout(() => {
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchLogs();
              }, 0);
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={handleFilterChange}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Timestamp</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Target</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${getActionBadgeColor(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{log.user.name}</div>
                          <div className="text-gray-600 text-xs">{log.user.email}</div>
                          <div className="text-gray-500 text-xs capitalize">{log.user.role}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{log.target.type}</div>
                          {log.target.name && (
                            <div className="text-gray-600 text-xs">{log.target.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{log.ipAddress || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} logs
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-1">
                  Page {pagination.page} of {pagination.pages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 bg-white border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ActivityLogs;
