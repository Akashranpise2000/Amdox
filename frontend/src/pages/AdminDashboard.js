import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { certificatesAPI, uploadAPI } from '../api/axios';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('certificates');
  const [certificates, setCertificates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (activeTab === 'certificates') {
      fetchCertificates();
    } else {
      fetchLogs();
    }
  }, [activeTab, pagination.current, search]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await certificatesAPI.getAll({
        page: pagination.current,
        limit: 20,
        search
      });
      setCertificates(response.data.certificates);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await uploadAPI.getLogs({ page: pagination.current, limit: 10 });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load upload logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAPI.uploadCertificates(file);
      toast.success(`Upload complete! ${response.data.summary.successRows} certificates added, ${response.data.summary.failedRows} failed.`);
      setFile(null);
      document.getElementById('file-input').value = '';
      fetchCertificates();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;

    try {
      await certificatesAPI.delete(id);
      toast.success('Certificate deleted');
      fetchCertificates();
    } catch (error) {
      toast.error('Failed to delete certificate');
    }
  };

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">
            Manage certificates and view upload history
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          <button
            className={`tab ${activeTab === 'certificates' ? 'active' : ''}`}
            onClick={() => setActiveTab('certificates')}
          >
            Certificates
          </button>
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Certificates
          </button>
          <button
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Upload Logs
          </button>
        </div>

        {/* Certificate Tab */}
        {activeTab === 'certificates' && (
          <>
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by ID, name, or domain..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, current: 1 })); }}
                  style={{ maxWidth: '300px' }}
                />
                <button onClick={fetchCertificates} className="btn btn-outline btn-sm">
                  Search
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
              </div>
            ) : certificates.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="empty-state-icon">📜</div>
                <h3 className="empty-state-title">No Certificates Found</h3>
                <p className="empty-state-text">
                  Upload certificates using the Upload tab
                </p>
              </div>
            ) : (
              <div className="card">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Certificate ID</th>
                        <th>Student Name</th>
                        <th>Domain</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert._id}>
                          <td style={{ fontFamily: 'monospace' }}>{cert.certificateId}</td>
                          <td>{cert.studentName}</td>
                          <td>{cert.domain}</td>
                          <td>{new Date(cert.startDate).toLocaleDateString()}</td>
                          <td>{new Date(cert.endDate).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => handleDelete(cert._id)}
                              className="btn btn-danger btn-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setPagination(p => ({ ...p, current: page }))}
                    className={`btn btn-sm ${page === pagination.current ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="card" style={{ padding: '2rem', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Upload Certificates via Excel
            </h3>

            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem' }}>
                <strong>Required columns:</strong> Certificate ID, Student Name, Domain, Start Date, End Date
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Excel File (.xlsx or .xls)</label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="form-input"
              />
            </div>

            {file && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#059669' }}>
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              className="btn btn-primary"
              disabled={uploading || !file}
            >
              {uploading ? (
                <>
                  <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
                  Processing...
                </>
              ) : (
                'Upload Certificates'
              )}
            </button>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="empty-state-icon">📋</div>
                <h3 className="empty-state-title">No Upload Logs</h3>
                <p className="empty-state-text">
                  Upload history will appear here
                </p>
              </div>
            ) : (
              <div className="card">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Admin</th>
                        <th>Total Rows</th>
                        <th>Success</th>
                        <th>Failed</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>{log.fileName}</td>
                          <td>{log.adminId?.name || 'Unknown'}</td>
                          <td>{log.totalRows}</td>
                          <td style={{ color: '#059669' }}>{log.successRows}</td>
                          <td style={{ color: '#dc2626' }}>{log.failedRows}</td>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
