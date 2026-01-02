import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminJobQueue = () => {
  const { t } = useTranslation();
  const [queueStats, setQueueStats] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState('export');
  const [selectedState, setSelectedState] = useState('waiting');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const queueNames = ['export', 'email', 'ai', 'scheduled'];
  const jobStates = ['waiting', 'active', 'completed', 'failed', 'delayed'];

  // Fetch queue statistics
  const fetchQueueStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/v1/admin/jobs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setQueueStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch queue stats:', err);
      setError('Failed to load queue statistics');
    }
  };

  // Fetch jobs for selected queue and state
  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/v1/admin/jobs/${selectedQueue}/jobs`,
        {
          params: { state: selectedState, start: 0, end: 50 },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setJobs(response.data.data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load jobs');
    }
  };

  // Fetch job details
  const fetchJobDetails = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/v1/admin/jobs/${selectedQueue}/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSelectedJob(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch job details:', err);
      setError('Failed to load job details');
    }
  };

  // Retry a failed job
  const retryJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/v1/admin/jobs/${selectedQueue}/${jobId}/retry`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Job retried successfully');
      fetchJobs();
      setSelectedJob(null);
    } catch (err) {
      console.error('Failed to retry job:', err);
      alert('Failed to retry job');
    }
  };

  // Remove/cancel a job
  const removeJob = async (jobId) => {
    if (!confirm('Are you sure you want to remove this job?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/v1/admin/jobs/${selectedQueue}/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Job removed successfully');
      fetchJobs();
      setSelectedJob(null);
    } catch (err) {
      console.error('Failed to remove job:', err);
      alert('Failed to remove job');
    }
  };

  // Pause/Resume queue
  const toggleQueuePause = async (queueName, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/v1/admin/jobs/${queueName}/${action}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Queue ${action}d successfully`);
      fetchQueueStats();
    } catch (err) {
      console.error(`Failed to ${action} queue:`, err);
      alert(`Failed to ${action} queue`);
    }
  };

  // Clean completed jobs
  const cleanQueue = async (queueName) => {
    if (!confirm('Clean completed jobs older than 24 hours?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/v1/admin/jobs/${queueName}/clean`,
        { grace: 24 * 3600 * 1000 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Cleaned ${response.data.data.count} jobs`);
      fetchQueueStats();
    } catch (err) {
      console.error('Failed to clean queue:', err);
      alert('Failed to clean queue');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchQueueStats();
      await fetchJobs();
      setLoading(false);
    };

    loadData();
  }, [selectedQueue, selectedState]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchQueueStats();
      fetchJobs();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedQueue, selectedState]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getStateColor = (state) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      delayed: 'bg-gray-100 text-gray-800',
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Queue Management</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="form-checkbox"
            />
            <span>Auto Refresh</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {queueStats.map((queue) => (
          <div
            key={queue.name}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedQueue(queue.name)}
          >
            <h3 className="text-xl font-semibold mb-4 capitalize">{queue.name} Queue</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Waiting:</span>
                <span className="font-medium text-yellow-600">{queue.waiting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active:</span>
                <span className="font-medium text-blue-600">{queue.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{queue.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Failed:</span>
                <span className="font-medium text-red-600">{queue.failed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delayed:</span>
                <span className="font-medium text-gray-600">{queue.delayed}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleQueuePause(queue.name, 'pause');
                }}
                className="text-sm px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Pause
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleQueuePause(queue.name, 'resume');
                }}
                className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Resume
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cleanQueue(queue.name);
                }}
                className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clean
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Job List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">
            Jobs in {selectedQueue} Queue
          </h2>
          <div className="flex gap-4">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-4 py-2 border rounded"
            >
              {jobStates.map((state) => (
                <option key={state} value={state}>
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No jobs in {selectedState} state
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {job.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {job.data?.type || job.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {job.progress || 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {job.attemptsMade || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDate(job.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStateColor(
                          job.state
                        )}`}
                      >
                        {job.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => fetchJobDetails(job.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Details
                      </button>
                      {job.state === 'failed' && (
                        <button
                          onClick={() => retryJob(job.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Retry
                        </button>
                      )}
                      <button
                        onClick={() => removeJob(job.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Job Details</h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Job ID:</span>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
                  {selectedJob.id}
                </pre>
              </div>
              <div>
                <span className="font-medium">State:</span>
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getStateColor(
                    selectedJob.state
                  )}`}
                >
                  {selectedJob.state}
                </span>
              </div>
              <div>
                <span className="font-medium">Progress:</span>
                <span className="ml-2">{selectedJob.progress || 0}%</span>
              </div>
              <div>
                <span className="font-medium">Attempts:</span>
                <span className="ml-2">{selectedJob.attemptsMade || 0}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2">{formatDate(selectedJob.timestamp)}</span>
              </div>
              {selectedJob.processedOn && (
                <div>
                  <span className="font-medium">Processed:</span>
                  <span className="ml-2">{formatDate(selectedJob.processedOn)}</span>
                </div>
              )}
              {selectedJob.finishedOn && (
                <div>
                  <span className="font-medium">Finished:</span>
                  <span className="ml-2">{formatDate(selectedJob.finishedOn)}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Data:</span>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-x-auto">
                  {JSON.stringify(selectedJob.data, null, 2)}
                </pre>
              </div>
              {selectedJob.failedReason && (
                <div>
                  <span className="font-medium text-red-600">Error:</span>
                  <pre className="bg-red-50 p-2 rounded mt-1 text-sm">
                    {selectedJob.failedReason}
                  </pre>
                </div>
              )}
              {selectedJob.stacktrace && (
                <div>
                  <span className="font-medium">Stack Trace:</span>
                  <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                    {JSON.stringify(selectedJob.stacktrace, null, 2)}
                  </pre>
                </div>
              )}
              {selectedJob.returnvalue && (
                <div>
                  <span className="font-medium">Result:</span>
                  <pre className="bg-green-50 p-2 rounded mt-1 text-sm overflow-x-auto">
                    {JSON.stringify(selectedJob.returnvalue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              {selectedJob.state === 'failed' && (
                <button
                  onClick={() => retryJob(selectedJob.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Retry Job
                </button>
              )}
              <button
                onClick={() => removeJob(selectedJob.id)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Remove Job
              </button>
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobQueue;
