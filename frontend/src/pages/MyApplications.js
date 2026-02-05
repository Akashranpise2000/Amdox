import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../api/axios';
import { toast } from 'react-toastify';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, limit: 10 };
      if (filter) params.status = filter;
      const response = await applicationsAPI.getMyApplications(params);
      setApplications(response.data.applications);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await applicationsAPI.getMyStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleWithdraw = async (id) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    
    try {
      await applicationsAPI.withdraw(id);
      toast.success('Application withdrawn');
      fetchApplications();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to withdraw application');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      interview: 'bg-indigo-100 text-indigo-800',
      hired: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600">Track and manage your job applications</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.reviewed}</p>
              <p className="text-sm text-gray-500">Reviewed</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.shortlisted}</p>
              <p className="text-sm text-gray-500">Shortlisted</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.interview}</p>
              <p className="text-sm text-gray-500">Interview</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.hired}</p>
              <p className="text-sm text-gray-500">Hired</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Applications</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview">Interview</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>No applications found</p>
              <Link to="/jobs" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {applications.map((app) => (
                <div key={app._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        <Link to={`/jobs/${app.jobId?._id}`} className="hover:text-blue-600">
                          {app.jobId?.title || 'Job Title'}
                        </Link>
                      </h3>
                      <p className="text-gray-600">{app.jobId?.companyName}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{app.jobId?.location}</span>
                        <span>•</span>
                        <span>Applied {formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleWithdraw(app._id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                  {app.interviewDate && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                      <p className="text-indigo-800 font-medium">
                        Interview scheduled: {formatDate(app.interviewDate)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="p-4 border-t flex justify-center gap-2">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPagination(prev => ({ ...prev, current: i + 1 }))}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.current === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'border hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
