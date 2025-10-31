import React, { useState, useEffect } from 'react';
import AdminPortalLayout from './AdminPortalLayout';
import { AdminAPI } from '../api';
import { FaFilter, FaCheck, FaTimes, FaClock, FaFileDownload } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './AdminFeedback.css';

function AdminFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await AdminAPI.getAllFeedbackAdmin(statusFilter);
      console.log('Fetched feedback:', data);
      setFeedbackList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      Swal.fire('Error', error.message || 'Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportFeedback = async () => {
    try {
      // Create CSV from current feedback data
      const csvHeader = 'Date,User Name,User Email,Type,Status,Subject,Message,Rating\n';
      const csvRows = feedbackList.map(feedback => {
        const date = new Date(feedback.createdAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const userName = feedback.userId ? `${feedback.userId.firstName} ${feedback.userId.lastName}` : 'Anonymous';
        
        return [
          `${year}-${month}-${day}`,
          `"${userName.replace(/"/g, '""')}"`,
          feedback.userId?.email || 'N/A',
          feedback.type || 'N/A',
          feedback.status || 'pending',
          `"${(feedback.subject || 'N/A').replace(/"/g, '""')}"`,
          `"${(feedback.feedback || '').replace(/"/g, '""')}"`,
          feedback.rating || 'N/A'
        ].join(',');
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: 'Feedback list has been downloaded',
        confirmButtonColor: '#e51d5e'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: error.message || 'Failed to export feedback',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await AdminAPI.updateFeedbackStatusAdmin(id, newStatus);
      Swal.fire('Success', `Feedback marked as ${newStatus}`, 'success');
      fetchFeedback();
      if (showModal) setShowModal(false);
    } catch (error) {
      Swal.fire('Error', error.message || 'Failed to update status', 'error');
    }
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'info';
      case 'responded': return 'success';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'general': return 'purple';
      case 'service': return 'blue';
      case 'suggestion': return 'green';
      default: return 'purple';
    }
  };

  return (
    <AdminPortalLayout>
      <div className="admin-feedback">
        <div className="page-header">
          <h1>User Feedback</h1>
          <button className="btn-export" onClick={handleExportFeedback}>
            <FaFileDownload /> Export CSV
          </button>
        </div>

        {/* Filter */}
        <div className="filter-section">
          <label><FaFilter /> Status Filter:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="responded">Responded</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Feedback Grid */}
        <div className="feedback-grid">
          {loading ? (
            <div className="loading-spinner">Loading feedback...</div>
          ) : feedbackList.length === 0 ? (
            <div className="no-data">No feedback found</div>
          ) : (
            feedbackList.map((feedback) => (
              <div key={feedback._id} className="feedback-card">
                <div className="feedback-header">
                  <span className={`type-badge ${getTypeColor(feedback.type)}`}>
                    {feedback.type}
                  </span>
                  <span className={`status-badge ${getStatusColor(feedback.status)}`}>
                    {feedback.status}
                  </span>
                </div>

                <div className="feedback-subject">
                  <strong>{feedback.subject || 'No Subject'}</strong>
                </div>

                <div className="feedback-message">
                  {feedback.feedback ? feedback.feedback.substring(0, 150) : 'No message'}
                  {feedback.feedback && feedback.feedback.length > 150 && '...'}
                </div>

                <div className="feedback-meta">
                  <div>
                    <small>From: {feedback.userId ? `${feedback.userId.firstName} ${feedback.userId.lastName}` : 'Anonymous'}</small>
                  </div>
                  <div>
                    <small>{new Date(feedback.createdAt).toLocaleDateString()}</small>
                  </div>
                  {feedback.rating && (
                    <div>
                      <small>Rating: {feedback.rating}/5 ⭐</small>
                    </div>
                  )}
                </div>

                <div className="feedback-actions">
                  <button className="btn-view" onClick={() => handleViewDetails(feedback)}>
                    View Details
                  </button>
                  {feedback.status === 'pending' && (
                    <button
                      className="btn-resolve"
                      onClick={() => handleUpdateStatus(feedback._id, 'reviewed')}
                    >
                      <FaCheck /> Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Details Modal */}
        {showModal && selectedFeedback && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Feedback Details</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="feedback-details">
                <div className="detail-badges">
                  <span className={`type-badge ${getTypeColor(selectedFeedback.type)}`}>
                    {selectedFeedback.type}
                  </span>
                  <span className={`status-badge ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status}
                  </span>
                </div>

                <div className="detail-row">
                  <strong>Subject:</strong>
                  <p>{selectedFeedback.subject || 'No Subject'}</p>
                </div>

                <div className="detail-row">
                  <strong>Feedback:</strong>
                  <p>{selectedFeedback.feedback}</p>
                </div>

                {selectedFeedback.rating && (
                  <div className="detail-row">
                    <strong>Rating:</strong>
                    <p>{selectedFeedback.rating}/5 ⭐</p>
                  </div>
                )}

                {selectedFeedback.serviceDate && (
                  <div className="detail-row">
                    <strong>Service Date:</strong>
                    <p>{new Date(selectedFeedback.serviceDate).toLocaleDateString()}</p>
                  </div>
                )}

                <div className="detail-row">
                  <strong>From:</strong>
                  <p>
                    {selectedFeedback.userId ? `${selectedFeedback.userId.firstName} ${selectedFeedback.userId.lastName}` : 'Anonymous'} 
                    {selectedFeedback.userId?.email && ` (${selectedFeedback.userId.email})`}
                  </p>
                </div>

                <div className="detail-row">
                  <strong>Submitted:</strong>
                  <p>{new Date(selectedFeedback.createdAt).toLocaleString()}</p>
                </div>

                {selectedFeedback.response && (
                  <div className="detail-row admin-response">
                    <strong>Clinic Response:</strong>
                    <p>{selectedFeedback.response}</p>
                    {selectedFeedback.respondedAt && (
                      <small>Responded on {new Date(selectedFeedback.respondedAt).toLocaleString()}</small>
                    )}
                  </div>
                )}

                <div className="modal-actions">
                  {selectedFeedback.status === 'pending' && (
                    <button
                      className="btn-resolve"
                      onClick={() => handleUpdateStatus(selectedFeedback._id, 'reviewed')}
                    >
                      <FaCheck /> Mark as Reviewed
                    </button>
                  )}
                  {selectedFeedback.status === 'reviewed' && (
                    <button
                      className="btn-resolve"
                      onClick={() => handleUpdateStatus(selectedFeedback._id, 'resolved')}
                    >
                      <FaCheck /> Mark as Resolved
                    </button>
                  )}
                  {(selectedFeedback.status === 'resolved' || selectedFeedback.status === 'responded') && (
                    <button
                      className="btn-secondary"
                      onClick={() => handleUpdateStatus(selectedFeedback._id, 'pending')}
                    >
                      <FaClock /> Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPortalLayout>
  );
}

export default AdminFeedback;
