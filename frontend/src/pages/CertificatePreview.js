import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { certificatesAPI } from '../api/axios';

const CertificatePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      const response = await certificatesAPI.search(id);
      setCertificate(response.data.certificate);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Certificate not found');
      navigate('/certificates/search');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    certificatesAPI.getPDF(certificate._id);
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  const startDate = new Date(certificate.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const endDate = new Date(certificate.endDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8fafc',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <Link 
          to="/certificates/search" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#2563eb',
            textDecoration: 'none'
          }}
        >
          ← Search Another
        </Link>
        <button onClick={handleDownload} className="btn btn-primary">
          📥 Download PDF
        </button>
      </div>

      {/* Certificate Preview */}
      <div style={{ 
        maxWidth: '900px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Certificate Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
          padding: '2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            CERTIFICATE
          </h1>
          <p style={{ fontSize: '1rem', opacity: 0.9 }}>
            OF INTERNSHIP COMPLETION
          </p>
        </div>

        {/* Certificate Body */}
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '1rem' }}>
            This is to certify that
          </p>

          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#1e40af',
            marginBottom: '1.5rem',
            fontFamily: 'Georgia, serif'
          }}>
            {certificate.studentName}
          </h2>

          <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '1rem' }}>
            has successfully completed an internship in
          </p>

          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            color: '#1e40af',
            marginBottom: '2rem',
            textTransform: 'uppercase'
          }}>
            {certificate.domain}
          </h3>

          {/* Duration */}
          <div style={{ 
            background: '#f8fafc',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            display: 'inline-block',
            marginBottom: '2rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Internship Period
            </p>
            <p style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              {startDate} - {endDate}
            </p>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                Date of Issue
              </p>
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '80px', 
                height: '40px', 
                border: '2px solid #1e40af',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem'
              }}></div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Authorized Signature
              </p>
            </div>
          </div>

          {/* Certificate ID */}
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af', 
            marginTop: '2rem',
            fontFamily: 'monospace'
          }}>
            Certificate ID: {certificate.certificateId}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ 
        maxWidth: '900px', 
        margin: '2rem auto',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        <button onClick={handleDownload} className="btn btn-primary btn-lg">
          📥 Download PDF
        </button>
        <button 
          onClick={() => window.print()} 
          className="btn btn-outline btn-lg"
        >
          🖨️ Print
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Powered by <strong style={{ color: '#2563eb' }}>Amdox</strong>
        </p>
      </div>
    </div>
  );
};

export default CertificatePreview;
