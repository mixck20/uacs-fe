import React, { useState, useEffect } from 'react';
import ClinicNavbar from './ClinicNavbar';
import './CertificateManagement.css';
import { CertificateAPI } from '../api';
import {
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaDownload,
  FaSearch,
  FaFilter,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
  FaCalendar
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const CertificateManagement = ({ setActivePage, activePage, onLogout, user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    diagnosis: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    recommendations: ''
  });

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await CertificateAPI.getAllCertificates();
      setCertificates(data);
    } catch (error) {
      console.error('Error loading certificates:', error);
      Swal.fire('Error', 'Failed to load certificates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!issueForm.diagnosis || !issueForm.validUntil) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }

    try {
      await CertificateAPI.issueCertificate(selectedCertificate._id, issueForm);
      Swal.fire('Success', 'Certificate issued successfully', 'success');
      setShowIssueModal(false);
      setSelectedCertificate(null);
      setIssueForm({
        diagnosis: '',
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        recommendations: ''
      });
      loadCertificates();
    } catch (error) {
      Swal.fire('Error', 'Failed to issue certificate', 'error');
    }
  };

  const handleRejectCertificate = async (cert) => {
    const { value: reason } = await Swal.fire({
      title: 'Reject Certificate Request',
      input: 'textarea',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'Enter reason...',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
      }
    });

    if (reason) {
      try {
        await CertificateAPI.rejectCertificate(cert._id, reason);
        Swal.fire('Success', 'Certificate request rejected', 'success');
        loadCertificates();
      } catch (error) {
        Swal.fire('Error', 'Failed to reject certificate', 'error');
      }
    }
  };

  const handleDownloadPDF = async (certId) => {
    try {
      await CertificateAPI.downloadCertificate(certId);
    } catch (error) {
      Swal.fire('Error', 'Failed to download certificate', 'error');
    }
  };

  const filteredCertificates = certificates
    .filter(cert => filter === 'all' || cert.status === filter)
    .filter(cert =>
      cert.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const stats = {
    total: certificates.length,
    pending: certificates.filter(c => c.status === 'pending').length,
    issued: certificates.filter(c => c.status === 'issued').length,
    rejected: certificates.filter(c => c.status === 'rejected').length
  };

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={user} />
      <div className="clinic-content">
        {/* Header */}
        <div className="certificate-header">
          <div className="header-content">
            <h1 className="certificate-title">Medical Certificates</h1>
            <p className="certificate-subtitle">Manage and issue medical certificate requests</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="certificate-stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <FaFileAlt />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Requests</div>
            </div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card stat-issued">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.issued}</div>
              <div className="stat-label">Issued</div>
            </div>
          </div>
          <div className="stat-card stat-rejected">
            <div className="stat-icon">
              <FaTimesCircle />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="certificates-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by patient name or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <FaFilter /> All
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              <FaClock /> Pending
            </button>
            <button
              className={`filter-btn ${filter === 'issued' ? 'active' : ''}`}
              onClick={() => setFilter('issued')}
            >
              <FaCheck /> Issued
            </button>
            <button
              className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              <FaTimes /> Rejected
            </button>
          </div>
        </div>

        {/* Certificates List */}
        <div className="certificates-list">
          {loading ? (
            <div className="loading-state">Loading certificates...</div>
          ) : filteredCertificates.length === 0 ? (
            <div className="empty-state">
              <FaFileAlt />
              <p>No certificates found</p>
            </div>
          ) : (
            filteredCertificates.map((cert) => (
              <div key={cert._id} className={`certificate-card status-${cert.status}`}>
                <div className="certificate-card-header">
                  <div className="patient-info">
                    <FaUser />
                    <div>
                      <h3>{cert.patientId?.fullName || cert.userId?.name || 'Unknown Patient'}</h3>
                      {cert.patientId?.studentId && (
                        <p className="student-id">{cert.patientId.studentId}</p>
                      )}
                    </div>
                  </div>
                  <span className={`status-badge status-${cert.status}`}>
                    {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                  </span>
                </div>

                <div className="certificate-card-body">
                  <div className="cert-info-row">
                    <span className="label">Purpose:</span>
                    <span className="value">{cert.purpose}</span>
                  </div>
                  {cert.requestNotes && (
                    <div className="cert-info-row">
                      <span className="label">Notes:</span>
                      <span className="value">{cert.requestNotes}</span>
                    </div>
                  )}
                  <div className="cert-info-row">
                    <span className="label">
                      <FaCalendar /> Requested:
                    </span>
                    <span className="value">
                      {new Date(cert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {cert.status === 'issued' && (
                    <>
                      <div className="cert-info-row">
                        <span className="label">Diagnosis:</span>
                        <span className="value">{cert.diagnosis}</span>
                      </div>
                      <div className="cert-info-row">
                        <span className="label">Valid Period:</span>
                        <span className="value">
                          {new Date(cert.validFrom).toLocaleDateString()} -{' '}
                          {new Date(cert.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                  {cert.status === 'rejected' && cert.rejectionReason && (
                    <div className="cert-info-row">
                      <span className="label">Rejection Reason:</span>
                      <span className="value rejection">{cert.rejectionReason}</span>
                    </div>
                  )}
                </div>

                <div className="certificate-card-actions">
                  {cert.status === 'pending' && (
                    <>
                      <button
                        className="action-btn approve-btn"
                        onClick={() => {
                          setSelectedCertificate(cert);
                          setShowIssueModal(true);
                        }}
                      >
                        <FaCheck /> Issue Certificate
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() => handleRejectCertificate(cert)}
                      >
                        <FaTimes /> Reject
                      </button>
                    </>
                  )}
                  {cert.status === 'issued' && (
                    <button
                      className="action-btn download-btn"
                      onClick={() => handleDownloadPDF(cert._id)}
                    >
                      <FaDownload /> Download PDF
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Issue Certificate Modal */}
        {showIssueModal && selectedCertificate && (
          <div className="certificate-modal">
            <div className="certificate-modal-content">
              <div className="modal-header">
                <h2>Issue Medical Certificate</h2>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowIssueModal(false);
                    setSelectedCertificate(null);
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="patient-summary">
                  <h3>Patient Information</h3>
                  <p><strong>Name:</strong> {selectedCertificate.patientId?.fullName || 'N/A'}</p>
                  <p><strong>Student ID:</strong> {selectedCertificate.patientId?.studentId || 'N/A'}</p>
                  <p><strong>Purpose:</strong> {selectedCertificate.purpose}</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleIssueCertificate(); }}>
                  <div className="form-group">
                    <label>Diagnosis *</label>
                    <input
                      type="text"
                      value={issueForm.diagnosis}
                      onChange={(e) => setIssueForm({ ...issueForm, diagnosis: e.target.value })}
                      placeholder="Enter diagnosis"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Valid From *</label>
                      <input
                        type="date"
                        value={issueForm.validFrom}
                        onChange={(e) => setIssueForm({ ...issueForm, validFrom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Valid Until *</label>
                      <input
                        type="date"
                        value={issueForm.validUntil}
                        onChange={(e) => setIssueForm({ ...issueForm, validUntil: e.target.value })}
                        min={issueForm.validFrom}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Recommendations</label>
                    <textarea
                      value={issueForm.recommendations}
                      onChange={(e) => setIssueForm({ ...issueForm, recommendations: e.target.value })}
                      placeholder="Enter medical recommendations (optional)"
                      rows="4"
                    />
                  </div>

                  <div className="modal-actions">
                    <button type="submit" className="action-btn approve-btn">
                      <FaCheck /> Issue Certificate
                    </button>
                    <button
                      type="button"
                      className="action-btn cancel-btn"
                      onClick={() => {
                        setShowIssueModal(false);
                        setSelectedCertificate(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateManagement;
