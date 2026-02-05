import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsAPI, applicationsAPI, authAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, isSeeker } = useAuth();
  
  const [job, setJob] = useState(null);
  const [employerProfile, setEmployerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    fetchJob();
    if (isAuthenticated && isSeeker) {
      checkApplicationStatus();
      checkSavedStatus();
    }
  }, [id, isAuthenticated]);

  const fetchJob = async () => {
    try {
      const response = await jobsAPI.getJob(id);
      setJob(response.data.job);
      setEmployerProfile(response.data.employerProfile);
    } catch (error) {
      toast.error('Failed to load job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await applicationsAPI.getMyApplications();
      const applied = response.data.applications.some(app => app.jobId?._id === id);
      setHasApplied(applied);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const checkSavedStatus = async () => {
    try {
      const response = await authAPI.getSavedJobs();
      const saved = response.data.some(job => job._id === id);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to apply for this job');
      navigate('/login');
      return;
    }

    if (!isSeeker) {
      toast.error('Only job seekers can apply for jobs');
      return;
    }

    setApplying(true);
    try {
      await applicationsAPI.apply({ jobId: id, coverLetter });
      setHasApplied(true);
      setShowApplyModal(false);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const toggleSave = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to save jobs');
      return;
    }

    try {
      if (isSaved) {
        await authAPI.unsaveJob(id);
        setIsSaved(false);
        toast.success('Job removed from saved');
      } else {
        await authAPI.saveJob(id);
        setIsSaved(true);
        toast.success('Job saved');
      }
    } catch (error) {
      toast.error('Failed to update saved jobs');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Job not found</h1>
        <Link to="/jobs" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Browse all jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  {job.isFeatured && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-600 mt-2">
                  {job.companyName || job.employerId?.name}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {job.jobType}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                    {job.location}
                  </span>
                  {job.experienceLevel && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      {job.experienceLevel}
                    </span>
                  )}
                </div>
              </div>
              {(job.companyLogo || employerProfile?.companyLogo) && (
                <img
                  src={job.companyLogo || employerProfile?.companyLogo}
                  alt="Company"
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
            </div>

            <div className="flex items-center gap-4 mt-6">
              {isSeeker && (
                <>
                  {hasApplied ? (
                    <button
                      disabled
                      className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-semibold cursor-not-allowed"
                    >
                      ✓ Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                    </button>
                  )}
                </>
              )}
              <button
                onClick={toggleSave}
                className={`px-6 py-3 border rounded-lg font-semibold transition-colors ${
                  isSaved
                    ? 'border-red-500 text-red-500 hover:bg-red-50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isSaved ? '♥ Saved' : '♡ Save Job'}
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 border-b">
            <div>
              <p className="text-sm text-gray-500">Salary</p>
              <p className="font-semibold">{formatSalary(job.salaryRange)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Job Type</p>
              <p className="font-semibold capitalize">{job.jobType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Experience</p>
              <p className="font-semibold capitalize">{job.experienceLevel || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Applications</p>
              <p className="font-semibold">{job.applicationCount}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h2>
              <div className="text-gray-700 whitespace-pre-line">{job.description}</div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Responsibilities</h2>
              <div className="text-gray-700 whitespace-pre-line">{job.responsibilities}</div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Qualifications</h2>
              <div className="text-gray-700 whitespace-pre-line">{job.qualifications}</div>
            </section>

            {job.skills && job.skills.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Benefits</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  {job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {employerProfile && (
            <div className="p-6 bg-gray-50 border-t">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Company</h2>
              <div className="flex items-start gap-4">
                {employerProfile.companyLogo && (
                  <img
                    src={employerProfile.companyLogo}
                    alt="Company"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{employerProfile.companyName}</h3>
                  {employerProfile.website && (
                    <a
                      href={employerProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {employerProfile.website}
                    </a>
                  )}
                  {employerProfile.companyDescription && (
                    <p className="text-gray-600 mt-2">{employerProfile.companyDescription}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/jobs" className="text-blue-600 hover:text-blue-800">
            ← Back to Job Search
          </Link>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Apply for {job.title}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                placeholder="Tell the employer why you're a great fit for this role..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
