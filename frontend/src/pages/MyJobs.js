import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI, applicationsAPI } from '../api/axios';
import { toast } from 'react-toastify';

const MyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobsAPI.getMyListings();
      setJobs(response.data);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId) => {
    setLoadingApps(true);
    try {
      const response = await applicationsAPI.getJobApplications(jobId);
      setApplications(response.data.applications);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoadingApps(false);
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    fetchApplications(job._id);
  };

  const handleToggleActive = async (job) => {
    try {
      await jobsAPI.updateJob(job._id, { isActive: !job.isActive });
      setJobs(prev => prev.map(j => 
        j._id === job._id ? { ...j, isActive: !j.isActive } : j
      ));
      toast.success(`Job ${job.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      await jobsAPI.deleteJob(jobId);
      setJobs(prev => prev.filter(j => j._id !== jobId));
      if (selectedJob?._id === jobId) {
        setSelectedJob(null);
        setApplications([]);
      }
      toast.success('Job deleted');
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      await applicationsAPI.updateStatus(appId, { status });
      setApplications(prev => prev.map(app =>
        app._id === appId ? { ...app, status } : app
      ));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Job Postings</h1>
            <p className="text-gray-600">Manage your jobs and view applications</p>
          </div>
          <Link
            to="/employer/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Post New Job
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Jobs ({jobs.length})</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {jobs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No jobs posted yet</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job._id}
                      onClick={() => handleSelectJob(job)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedJob?._id === job._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-500">{job.location}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              job.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.isActive ? 'Active' : 'Closed'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {job.applicationCount} applicants
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedJob.title}</h2>
                      <p className="text-gray-600">{selectedJob.location} • {selectedJob.jobType}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Posted {formatDate(selectedJob.createdAt)} • {selectedJob.viewCount} views
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(selectedJob)}
                        className={`px-4 py-2 rounded-lg ${
                          selectedJob.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {selectedJob.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(selectedJob._id)}
                        className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-semibold mb-4">Applications ({applications.length})</h3>
                  
                  {loadingApps ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No applications yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications.map((app) => (
                        <div key={app._id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{app.seekerId?.name}</h4>
                              <p className="text-sm text-gray-500">{app.seekerId?.email}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Applied {formatDate(app.createdAt)}
                              </p>
                              {app.seekerProfile?.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {app.seekerProfile.skills.slice(0, 5).map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(app.status)}`}>
                                {app.status}
                              </span>
                              {app.seekerProfile?.resumeURL && (
                                <a
                                  href={app.seekerProfile.resumeURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View Resume
                                </a>
                              )}
                            </div>
                          </div>
                          
                          {app.coverLetter && (
                            <div className="mt-3 p-3 bg-gray-50 rounded">
                              <p className="text-sm text-gray-600">{app.coverLetter}</p>
                            </div>
                          )}

                          <div className="mt-4 flex gap-2">
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="reviewed">Reviewed</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interview">Interview</option>
                              <option value="hired">Hired</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a job</h2>
                <p className="text-gray-500">Click on a job from the list to view applications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyJobs;
