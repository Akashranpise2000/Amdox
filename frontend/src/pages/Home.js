import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobsAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const [featuredRes, recentRes] = await Promise.all([
          jobsAPI.getFeatured(),
          jobsAPI.getRecent()
        ]);
        setFeaturedJobs(featuredRes.data);
        setRecentJobs(recentRes.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.append('keyword', searchKeyword);
    if (searchLocation) params.append('location', searchLocation);
    navigate(`/jobs?${params.toString()}`);
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

  const JobCard = ({ job }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
            <Link to={`/jobs/${job._id}`}>{job.title}</Link>
          </h3>
          <p className="text-gray-600 mt-1">{job.companyName || job.employerId?.name}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {job.jobType}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              {job.location}
            </span>
            {job.experienceLevel && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {job.experienceLevel}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-3">{formatSalary(job.salaryRange)}</p>
        </div>
        {job.companyLogo && (
          <img src={job.companyLogo} alt="Company" className="w-12 h-12 rounded-lg object-cover ml-4" />
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Dream Job Today
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Discover thousands of job opportunities with top employers
            </p>
            <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  Search Jobs
                </button>
              </div>
            </form>
          </div>
          <div className="flex justify-center gap-8 mt-12 text-center">
            <div>
              <p className="text-3xl font-bold">10,000+</p>
              <p className="text-blue-200">Active Jobs</p>
            </div>
            <div>
              <p className="text-3xl font-bold">5,000+</p>
              <p className="text-blue-200">Companies</p>
            </div>
            <div>
              <p className="text-3xl font-bold">50,000+</p>
              <p className="text-blue-200">Job Seekers</p>
            </div>
          </div>
        </div>
      </section>

      {featuredJobs.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Jobs</h2>
              <Link to="/jobs" className="text-blue-600 hover:text-blue-800 font-medium">
                View All Jobs →
              </Link>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredJobs.map((job) => (
                  <JobCard key={job._id} job={job} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Recent Jobs</h2>
            <Link to="/jobs" className="text-blue-600 hover:text-blue-800 font-medium">
              View All Jobs →
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentJobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">For Job Seekers</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Create your professional profile
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Upload your resume
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Apply to jobs with one click
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Track your applications
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Get real-time notifications
                </li>
              </ul>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-block mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  Create Account
                </Link>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">For Employers</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Post unlimited job listings
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Manage applications easily
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Access candidate profiles
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Schedule interviews
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Analytics dashboard
                </li>
              </ul>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-block mt-6 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-lg font-semibold transition-colors"
                >
                  Post a Job
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals finding their perfect job match
          </p>
          {!isAuthenticated ? (
            <div className="flex justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Sign Up Free
              </Link>
              <Link
                to="/jobs"
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            <Link
              to="/jobs"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
