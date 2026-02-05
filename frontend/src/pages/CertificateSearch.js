import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { certificatesAPI } from '../api/axios';

const CertificateSearch = () => {
  const [certificateId, setCertificateId] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!certificateId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    try {
      const response = await certificatesAPI.search(certificateId.trim());
      navigate(`/certificates/preview/${response.data.certificate._id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Certificate not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'white' }}>A</span>
            <span style={{ fontSize: '2rem', fontWeight: '600', color: 'white' }}>Amdox</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '0.5rem' }}>
            Certificate Verification Portal
          </p>
        </div>

        {/* Search Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>
            Find Your Certificate
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Enter your certificate ID to view and download
          </p>

          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label className="form-label">Certificate ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter certificate ID (e.g., CERT-001)"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1rem', padding: '1rem' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full btn-lg"
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '1.25rem', height: '1.25rem' }}></span>
                  Searching...
                </>
              ) : (
                '🔍 Search Certificate'
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#166534' }}>
              <strong>💡 Tip:</strong> Your certificate ID can be found in your internship completion email or contact your administrator.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Back to Home
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0.5rem' }}>|</span>
          <Link to="/jobs" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.875rem' }}>
            Find Jobs →
          </Link>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '2rem' }}>
          © 2026 Amdox. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default CertificateSearch;
