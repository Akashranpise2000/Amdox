import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/axios';

const Navbar = () => {
  const { user, isAuthenticated, logout, isSeeker, isEmployer, isAdmin, socket } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket) {
      socket.on('notification', () => {
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Amdox</span>
              <span className="text-2xl font-bold text-gray-800">Jobs</span>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-4">
              <Link to="/jobs" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                Find Jobs
              </Link>
              {isEmployer && (
                <Link to="/employer/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                  Dashboard
                </Link>
              )}
              {isSeeker && (
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{user?.name}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        My Profile
                      </Link>
                      {isSeeker && (
                        <>
                          <Link
                            to="/applications"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            My Applications
                          </Link>
                          <Link
                            to="/saved-jobs"
                            onClick={() => setIsProfileOpen(false)}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          >
                            Saved Jobs
                          </Link>
                        </>
                      )}
                      {isEmployer && (
                        <Link
                          to="/my-jobs"
                          onClick={() => setIsProfileOpen(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          My Jobs
                        </Link>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 px-4 py-2 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-blue-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-2">
            <Link
              to="/jobs"
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Find Jobs
            </Link>
            {isAuthenticated ? (
              <>
                {isSeeker && (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/applications"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      My Applications
                    </Link>
                    <Link
                      to="/saved-jobs"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Saved Jobs
                    </Link>
                  </>
                )}
                {isEmployer && (
                  <>
                    <Link
                      to="/employer/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/my-jobs"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      My Jobs
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Profile
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 bg-blue-600 text-white rounded-md text-center"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
