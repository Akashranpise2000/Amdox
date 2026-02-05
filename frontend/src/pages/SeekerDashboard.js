import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, applicationsAPI, authAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SeekerDashboard = () => {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.getSeeker();
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { stats, recentApplications, unreadNotifications, profileCompletion } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Here's what's happening with your job search</p>
        </div>

        {profileCompletion < 100 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800">Complete your profile</h3>
                <p className="text-yellow-700 text-sm">Your profile is {profileCompletion}% complete. A complete profile increases your chances of getting hired.</p>
              </div>
              <Link to="/profile" className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                Complete Profile
              </Link>
            </div>
            <div className="mt-3 bg-yellow-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Interviews</p>
            <p className="text-3xl font-bold text-indigo-600">{stats?.interview || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Saved Jobs</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.savedJobs || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Applications</h2>
                <Link to="/applications" className="text-blue-600 hover:text-blue-800 text-sm">
                  View All
                </Link>
              </div>
              <div className="divide-y">
                {recentApplications?.length > 0 ? (
                  recentApplications.map((app) => (
                    <div key={app._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            <Link to={`/jobs/${app.jobId?._id}`} className="hover:text-blue-600">
                              {app.jobId?.title || 'Job Title'}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-500">{app.jobId?.companyName}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No applications yet</p>
                    <Link to="/jobs" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                      Browse Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/jobs" className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <span className="text-2xl mr-3">🔍</span>
                  <span className="font-medium">Search Jobs</span>
                </Link>
                <Link to="/profile" className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span className="text-2xl mr-3">👤</span>
                  <span className="font-medium">Edit Profile</span>
                </Link>
                <Link to="/saved-jobs" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <span className="text-2xl mr-3">❤️</span>
                  <span className="font-medium">Saved Jobs</span>
                </Link>
                <Link to="/notifications" className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                  <span className="text-2xl mr-3">🔔</span>
                  <span className="font-medium">Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Application Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reviewed</span>
                  <span className="font-semibold">{stats?.reviewed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shortlisted</span>
                  <span className="font-semibold">{stats?.shortlisted || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hired</span>
                  <span className="font-semibold text-green-600">{stats?.hired || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rejected</span>
                  <span className="font-semibold text-red-600">{stats?.rejected || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeekerDashboard;
