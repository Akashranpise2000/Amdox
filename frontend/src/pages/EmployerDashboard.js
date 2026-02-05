import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardAPI, jobsAPI, applicationsAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    qualifications: '',
    responsibilities: '',
    location: '',
    jobType: 'full-time',
    experienceLevel: 'entry',
    salaryRange: { min: '', max: '', currency: 'INR' },
    skills: '',
    benefits: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.getEmployer();
      setDashboardData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('salary')) {
      const field = name.split('.')[1];
      setJobForm(prev => ({
        ...prev,
        salaryRange: { ...prev.salaryRange, [field]: value }
      }));
    } else {
      setJobForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const jobData = {
        ...jobForm,
        salaryRange: {
          min: jobForm.salaryRange.min ? parseInt(jobForm.salaryRange.min) : undefined,
          max: jobForm.salaryRange.max ? parseInt(jobForm.salaryRange.max) : undefined,
          currency: jobForm.salaryRange.currency
        },
        skills: jobForm.skills ? jobForm.skills.split(',').map(s => s.trim()) : [],
        benefits: jobForm.benefits ? jobForm.benefits.split(',').map(b => b.trim()) : []
      };

      await jobsAPI.createJob(jobData);
      toast.success('Job posted successfully!');
      setShowJobModal(false);
      setJobForm({
        title: '',
        description: '',
        qualifications: '',
        responsibilities: '',
        location: '',
        jobType: 'full-time',
        experienceLevel: 'entry',
        salaryRange: { min: '', max: '', currency: 'INR' },
        skills: '',
        benefits: ''
      });
      fetchDashboard();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create job');
    } finally {
      setSubmitting(false);
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

  const { stats, recentJobs, recentApplications, unreadNotifications, profileCompletion } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-gray-600">Manage your job postings and applications</p>
          </div>
          <button
            onClick={() => setShowJobModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Post New Job
          </button>
        </div>

        {profileCompletion < 100 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800">Complete your company profile</h3>
                <p className="text-yellow-700 text-sm">A complete profile helps attract better candidates.</p>
              </div>
              <Link to="/profile" className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                Complete Profile
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Jobs</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalJobs || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Active Jobs</p>
            <p className="text-3xl font-bold text-green-600">{stats?.activeJobs || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Applications</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalApplications || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="text-3xl font-bold text-purple-600">{stats?.totalViews || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Job Postings</h2>
                <Link to="/my-jobs" className="text-blue-600 hover:text-blue-800 text-sm">
                  View All
                </Link>
              </div>
              <div className="divide-y">
                {recentJobs?.length > 0 ? (
                  recentJobs.map((job) => (
                    <div key={job._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-500">
                            {job.applicationCount} applications • {job.viewCount} views
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.isActive ? 'Active' : 'Closed'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>No jobs posted yet</p>
                    <button
                      onClick={() => setShowJobModal(true)}
                      className="text-blue-600 hover:text-blue-800 mt-2"
                    >
                      Post your first job
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Recent Applications</h2>
              </div>
              <div className="divide-y">
                {recentApplications?.length > 0 ? (
                  recentApplications.map((app) => (
                    <div key={app._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{app.seekerId?.name}</h3>
                          <p className="text-sm text-gray-500">Applied for {app.jobId?.title}</p>
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
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowJobModal(true)}
                  className="w-full flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-2xl mr-3">📝</span>
                  <span className="font-medium">Post New Job</span>
                </button>
                <Link to="/my-jobs" className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span className="text-2xl mr-3">📋</span>
                  <span className="font-medium">Manage Jobs</span>
                </Link>
                <Link to="/profile" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <span className="text-2xl mr-3">🏢</span>
                  <span className="font-medium">Company Profile</span>
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
                {Object.entries(stats?.applicationsByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showJobModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-semibold mb-4">Post New Job</h2>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={jobForm.title}
                  onChange={handleJobFormChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                  <select
                    name="jobType"
                    value={jobForm.jobType}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    name="experienceLevel"
                    value={jobForm.experienceLevel}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={jobForm.location}
                  onChange={handleJobFormChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mumbai, India"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                  <input
                    type="number"
                    name="salary.min"
                    value={jobForm.salaryRange.min}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Min"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                  <input
                    type="number"
                    name="salary.max"
                    value={jobForm.salaryRange.max}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    name="salary.currency"
                    value={jobForm.salaryRange.currency}
                    onChange={handleJobFormChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={jobForm.description}
                  onChange={handleJobFormChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the role..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities *</label>
                <textarea
                  name="responsibilities"
                  value={jobForm.responsibilities}
                  onChange={handleJobFormChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="List key responsibilities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications *</label>
                <textarea
                  name="qualifications"
                  value={jobForm.qualifications}
                  onChange={handleJobFormChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Required qualifications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={jobForm.skills}
                  onChange={handleJobFormChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. JavaScript, React, Node.js"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post Job'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
