import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/axios';
import { toast } from 'react-toastify';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const response = await authAPI.getSavedJobs();
      setSavedJobs(response.data);
    } catch (error) {
      toast.error('Failed to load saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await authAPI.unsaveJob(jobId);
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
      toast.success('Job removed from saved');
    } catch (error) {
      toast.error('Failed to remove job');
    }
  };

  const formatSalary = (salaryRange) => {
    if (!salaryRange?.min && !salaryRange?.max) return 'Not specified';
    const currency = salaryRange.currency || 'INR';
    if (salaryRange.min && salaryRange.max) {
      return `${currency} ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()}`;
    }
    if (salaryRange.min) return `${currency} ${salaryRange.min.toLocaleString()}+`;
    return `Up to ${currency} ${salaryRange.max.toLocaleString()}`;
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="text-gray-600">Jobs you've bookmarked for later</p>
        </div>

        {savedJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved jobs yet</h2>
            <p className="text-gray-500 mb-4">Save jobs you're interested in to view them later</p>
            <Link
              to="/jobs"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                        <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                      </h2>
                      {!job.isActive && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Closed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{job.companyName || job.employerId?.name}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {job.jobType}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                        {job.location}
                      </span>
                      {job.experienceLevel && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {job.experienceLevel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>{formatSalary(job.salaryRange)}</span>
                      <span>•</span>
                      <span>Posted {formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    {job.companyLogo && (
                      <img src={job.companyLogo} alt="Company" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <button
                      onClick={() => handleUnsave(job._id)}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Link
                    to={`/jobs/${job._id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                  {job.isActive && (
                    <Link
                      to={`/jobs/${job._id}`}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                    >
                      Apply Now
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
