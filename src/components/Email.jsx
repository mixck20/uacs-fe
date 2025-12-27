import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Email.css";
import { FaEnvelope, FaPaperPlane, FaFileAlt, FaTimes, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { EmailAPI } from "../api";
import Swal from "sweetalert2";

function Email({ patients, setActivePage, onLogout, user }) {
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({
    totalEmails: 0,
    studentsWithEmail: 0,
    employeesWithEmail: 0,
    openRate: 0
  });
  const [smtpConfig, setSMTPConfig] = useState({ configured: false, verified: false });
  const [loading, setLoading] = useState(false);

  const [composeForm, setComposeForm] = useState({
    recipientType: "all",
    recipientGroup: "students",
    individualEmail: "",
    customEmails: "",
    subject: "",
    body: "",
    templateId: "",
    scheduledDate: "",
    scheduledTime: ""
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    subject: "",
    body: "",
    type: "general",
    category: "notification"
  });

  useEffect(() => {
    loadEmailHistory();
    loadTemplates();
    loadStats();
    checkSMTPConfig();
  }, []);

  const loadEmailHistory = async () => {
    try {
      const response = await EmailAPI.getEmailHistory();
      setEmailHistory(response.emails || []);
    } catch (error) {
      console.error('Error loading email history:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await EmailAPI.getTemplates();
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await EmailAPI.getEmailStats();
      setStats(response);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkSMTPConfig = async () => {
    try {
      const response = await EmailAPI.checkSMTPConfig();
      setSMTPConfig(response);
    } catch (error) {
      console.error('Error checking SMTP config:', error);
    }
  };

  function handleComposeFormChange(e) {
    setComposeForm({ ...composeForm, [e.target.name]: e.target.value });
  }

  function handleTemplateFormChange(e) {
    setTemplateForm({ ...templateForm, [e.target.name]: e.target.value });
  }

  function handleTemplateSelect(templateId) {
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setComposeForm({
        ...composeForm,
        subject: template.subject,
        body: template.body,
        templateId: template._id
      });
    }
  }

  async function sendEmail(e) {
    e.preventDefault();
    
    if (!composeForm.subject || !composeForm.body) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in subject and body'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await EmailAPI.sendEmail(composeForm);
      
      await Swal.fire({
        icon: 'success',
        title: 'Email Sent!',
        text: response.message,
        confirmButtonColor: '#e51d5e'
      });

      setComposeForm({
        recipientType: "all",
        recipientGroup: "students",
        individualEmail: "",
        customEmails: "",
        subject: "",
        body: "",
        templateId: "",
        scheduledDate: "",
        scheduledTime: ""
      });
      setShowComposeForm(false);
      loadEmailHistory();
      loadStats();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Send Failed',
        text: error.message || 'Failed to send email'
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate(e) {
    e.preventDefault();
    
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all required fields'
      });
      return;
    }

    setLoading(true);
    try {
      await EmailAPI.createTemplate(templateForm);
      
      await Swal.fire({
        icon: 'success',
        title: 'Template Saved!',
        text: 'Email template created successfully',
        confirmButtonColor: '#e51d5e'
      });

      setTemplateForm({
        name: "",
        subject: "",
        body: "",
        type: "general",
        category: "notification"
      });
      setShowTemplateForm(false);
      loadTemplates();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: error.message || 'Failed to save template'
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteTemplate(templateId) {
    const result = await Swal.fire({
      title: 'Delete Template?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e51d5e',
      cancelButtonColor: '#718096',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await EmailAPI.deleteTemplate(templateId);
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Template deleted successfully',
          confirmButtonColor: '#e51d5e'
        });
        loadTemplates();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: error.message || 'Failed to delete template'
        });
      }
    }
  }

  async function deleteEmail(emailId) {
    const result = await Swal.fire({
      title: 'Delete Email Record?',
      text: 'This will only remove the record, not recall sent emails',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e51d5e',
      cancelButtonColor: '#718096',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await EmailAPI.deleteEmail(emailId);
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Email record deleted successfully',
          confirmButtonColor: '#e51d5e'
        });
        loadEmailHistory();
        loadStats();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: error.message || 'Failed to delete email record'
        });
      }
    }
  }

  const getRecipientCount = () => {
    if (composeForm.recipientType === "all") {
      if (composeForm.recipientGroup === "students") {
        return patients.filter(p => p.role === "Student" && p.emailUpdates).length;
      } else if (composeForm.recipientGroup === "employees") {
        return patients.filter(p => p.role === "Employee" && p.emailUpdates).length;
      } else {
        return patients.filter(p => p.emailUpdates).length;
      }
    } else if (composeForm.recipientType === "individual") {
      return 1;
    } else if (composeForm.recipientType === "custom" && composeForm.customEmails) {
      return composeForm.customEmails.split(',').filter(e => e.trim()).length;
    }
    return 0;
  };

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage="email" setActivePage={setActivePage} onLogout={onLogout} user={user} />
      <main className="email-container">
        <div className="email-header">
          <div>
            <h1 className="email-title">Email Notifications</h1>
            {!smtpConfig.configured && (
              <div className="smtp-warning">
                <FaExclamationTriangle /> SMTP not configured - emails will be saved but not sent
              </div>
            )}
          </div>
          <div className="email-actions">
            <button className="email-btn primary" onClick={() => setShowComposeForm(true)}>
              <FaEnvelope /> Compose
            </button>
            <button className="email-btn secondary" onClick={() => setShowTemplateForm(true)}>
              <FaFileAlt /> Template
            </button>
          </div>
        </div>

        <div className="email-stats">
          <div className="stat-card">
            <div className="stat-icon purple">
              <FaEnvelope />
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.totalEmails || 0}</div>
              <div className="stat-label">Emails Sent</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">
              <FaFileAlt />
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.studentsWithEmail || 0}</div>
              <div className="stat-label">Students</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pink">
              <FaPaperPlane />
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.facultyWithEmail || 0}</div>
              <div className="stat-label">Faculty</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <FaCheckCircle />
            </div>
            <div className="stat-info">
              <div className="stat-number">{stats.openRate || 0}%</div>
              <div className="stat-label">Open Rate</div>
            </div>
          </div>
        </div>

        <div className="email-section">
          <h2>Templates ({templates.length})</h2>
          {templates.length === 0 ? (
            <div className="no-data-card">
              <FaFileAlt />
              <p>No templates yet</p>
            </div>
          ) : (
            <div className="templates-grid">
              {templates.map(template => (
                <div key={template._id} className="template-card">
                  <div className="template-header">
                    <h3>{template.name}</h3>
                    <div className="template-actions">
                      <button 
                        className="template-btn use"
                        onClick={() => {
                          handleTemplateSelect(template._id);
                          setShowComposeForm(true);
                        }}
                      >
                        Use
                      </button>
                      <button 
                        className="template-btn delete"
                        onClick={() => deleteTemplate(template._id)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                  <div className="template-content">
                    <div className="template-subject">
                      <strong>Subject:</strong> {template.subject}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="email-section">
          <h2>History ({emailHistory.length})</h2>
          {emailHistory.length === 0 ? (
            <div className="no-data-card">
              <FaEnvelope />
              <p>No emails sent yet</p>
            </div>
          ) : (
            <div className="email-table-wrapper">
              <table className="email-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Sent At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailHistory.map(email => (
                    <tr key={email._id}>
                      <td>
                        {email.recipientType === 'all' 
                          ? `All ${email.recipientGroup}` 
                          : email.recipients[0]?.email}
                      </td>
                      <td>{email.subject}</td>
                      <td>
                        <span className={`status-badge ${email.status}`}>
                          {email.status}
                        </span>
                      </td>
                      <td>{new Date(email.createdAt).toLocaleString()}</td>
                      <td>
                        <button 
                          className="action-btn delete"
                          onClick={() => deleteEmail(email._id)}
                        >
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showComposeForm && (
          <div className="email-modal">
            <div className="email-modal-content">
              <div className="modal-header">
                <h2>Compose Email</h2>
                <button className="close-btn" onClick={() => setShowComposeForm(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={sendEmail}>
                <div className="form-section">
                  <label>Recipients</label>
                  <select
                    name="recipientType"
                    value={composeForm.recipientType}
                    onChange={handleComposeFormChange}
                  >
                    <option value="all">Send to All</option>
                    <option value="individual">Individual</option>
                  </select>
                  
                  {composeForm.recipientType === "all" && (
                    <select
                      name="recipientGroup"
                      value={composeForm.recipientGroup}
                      onChange={handleComposeFormChange}
                    >
                      <option value="students">Students</option>
                      <option value="employees">Employees</option>
                      <option value="both">Both</option>
                    </select>
                  )}

                  {composeForm.recipientType === "individual" && (
                    <input
                      type="email"
                      name="individualEmail"
                      placeholder="Email address"
                      value={composeForm.individualEmail}
                      onChange={handleComposeFormChange}
                    />
                  )}
                </div>

                <div className="form-section">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={composeForm.subject}
                    onChange={handleComposeFormChange}
                    required
                  />
                </div>

                <div className="form-section">
                  <label>Message</label>
                  <textarea
                    name="body"
                    value={composeForm.body}
                    onChange={handleComposeFormChange}
                    rows="8"
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="email-btn primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                  <button 
                    type="button" 
                    className="email-btn secondary" 
                    onClick={() => setShowComposeForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTemplateForm && (
          <div className="email-modal">
            <div className="email-modal-content">
              <div className="modal-header">
                <h2>New Template</h2>
                <button className="close-btn" onClick={() => setShowTemplateForm(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <form onSubmit={saveTemplate}>
                <div className="form-section">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={templateForm.name}
                    onChange={handleTemplateFormChange}
                    required
                  />
                </div>

                <div className="form-section">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={templateForm.subject}
                    onChange={handleTemplateFormChange}
                    required
                  />
                </div>

                <div className="form-section">
                  <label>Body</label>
                  <textarea
                    name="body"
                    value={templateForm.body}
                    onChange={handleTemplateFormChange}
                    rows="8"
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="email-btn primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    type="button" 
                    className="email-btn secondary" 
                    onClick={() => setShowTemplateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Email;