import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Email.css";
import { FaEnvelope, FaPaperPlane, FaFileAlt, FaCog, FaTimes } from "react-icons/fa";

function Email({ patients, appointments, inventory, setActivePage, onLogout }) {
  const [showComposeForm, setShowComposeForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [emailHistory, setEmailHistory] = useState([]);
  const [templates, setTemplates] = useState([
    {
      id: 1,
      name: "Appointment Confirmation",
      subject: "Appointment Confirmed - UACS Clinic",
      body: "Dear {{patientName}},\n\nYour appointment has been confirmed for {{appointmentDate}} at {{appointmentTime}}.\n\nPlease arrive 10 minutes before your scheduled time.\n\nIf you need to reschedule, please contact us immediately.\n\nBest regards,\nUACS Clinic Staff",
      type: "appointment",
      category: "confirmation"
    },
    {
      id: 2,
      name: "Appointment Reminder",
      subject: "Reminder: Your Appointment Tomorrow - UACS Clinic",
      body: "Dear {{patientName}},\n\nThis is a friendly reminder that you have an appointment tomorrow at {{appointmentTime}}.\n\nPlease ensure you have:\n- Valid ID\n- Any relevant medical documents\n- List of current medications\n\nWe look forward to seeing you.\n\nBest regards,\nUACS Clinic Staff",
      type: "appointment",
      category: "reminder"
    },
    {
      id: 3,
      name: "Inventory Alert",
      subject: "Inventory Alert - UACS Clinic",
      body: "Dear Clinic Staff,\n\nThe following items are running low:\n\n{{inventoryItems}}\n\nPlease restock these items as soon as possible.\n\nBest regards,\nUACS System",
      type: "inventory",
      category: "alert"
    },
    {
      id: 4,
      name: "New Patient Welcome",
      subject: "Welcome to UACS Clinic - Registration Complete",
      body: "Dear {{patientName}},\n\nWelcome to UACS Clinic! Your registration has been completed successfully.\n\nYour Student/Faculty ID: {{studentId}}\n\nYou can now:\n- Schedule appointments\n- Access your medical records\n- Receive health updates\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nUACS Clinic Team",
      type: "registration",
      category: "welcome"
    },
    {
      id: 5,
      name: "Follow-up Reminder",
      subject: "Follow-up Appointment Due - UACS Clinic",
      body: "Dear {{patientName}},\n\nIt's time for your follow-up appointment.\n\nLast visit: {{lastVisitDate}}\nReason: {{lastVisitReason}}\n\nPlease schedule your follow-up appointment at your earliest convenience.\n\nBest regards,\nUACS Clinic Staff",
      type: "followup",
      category: "reminder"
    }
  ]);

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

  const [settings, setSettings] = useState({
    autoSendAppointments: true,
    autoSendReminders: true,
    autoSendInventory: true,
    autoSendWelcome: true,
    clinicEmail: "clinic@uacs.edu.ph",
    clinicName: "UACS Clinic",
    smtpEnabled: false
  });

  // Initialize email history
  useEffect(() => {
    if (emailHistory.length === 0) {
      setEmailHistory([
        {
          id: 1,
          recipient: "All Students",
          subject: "Welcome to UACS Clinic",
          type: "bulk",
          status: "sent",
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          opened: 45,
          total: 120
        },
        {
          id: 2,
          recipient: "john.doe@student.uacs.edu.ph",
          subject: "Appointment Confirmed",
          type: "individual",
          status: "sent",
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          opened: 1,
          total: 1
        }
      ]);
    }
  }, [emailHistory]);

  function handleComposeFormChange(e) {
    setComposeForm({ ...composeForm, [e.target.name]: e.target.value });
  }

  function handleTemplateFormChange(e) {
    setTemplateForm({ ...templateForm, [e.target.name]: e.target.value });
  }

  function handleSettingsChange(e) {
    setSettings({ ...settings, [e.target.name]: e.target.checked });
  }

  function handleTemplateSelect(templateId) {
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setComposeForm({
        ...composeForm,
        subject: template.subject,
        body: template.body,
        templateId: template.id
      });
    }
  }

  function validateForm() {
    if (!composeForm.subject || !composeForm.body) {
      alert("Please fill in all required fields.");
      return false;
    }
    
    if (composeForm.recipientType === "individual" && !composeForm.individualEmail) {
      alert("Please enter an email address for individual sending.");
      return false;
    }
    
    if (composeForm.recipientType === "custom" && !composeForm.customEmails) {
      alert("Please enter email addresses for custom list.");
      return false;
    }
    
    if (composeForm.recipientType === "custom") {
      const emailList = composeForm.customEmails.split(',').map(email => email.trim()).filter(email => email);
      if (emailList.length === 0) {
        alert("Please enter valid email addresses separated by commas.");
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailList.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        alert(`Invalid email format: ${invalidEmails.join(', ')}`);
        return false;
      }
    }
    
    return true;
  }

  function sendEmail(e) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
      let recipient, total;
      
      if (composeForm.recipientType === "all") {
        if (composeForm.recipientGroup === "students") {
          recipient = "All Students";
          total = patients.filter(p => p.role === "Student" && p.emailUpdates).length;
        } else if (composeForm.recipientGroup === "faculty") {
          recipient = "All Faculty";
          total = patients.filter(p => p.role === "Faculty" && p.emailUpdates).length;
        } else {
          recipient = "All Students & Faculty";
          total = patients.filter(p => p.emailUpdates).length;
        }
      } else if (composeForm.recipientType === "individual") {
        recipient = composeForm.individualEmail;
        total = 1;
      } else if (composeForm.recipientType === "custom") {
        const emailList = composeForm.customEmails.split(',').map(email => email.trim()).filter(email => email);
        recipient = `${emailList.length} Custom Emails`;
        total = emailList.length;
      }
      
      const newEmail = {
        id: Date.now(),
        recipient: recipient,
        subject: composeForm.subject,
        type: composeForm.recipientType,
        status: "sent",
        sentAt: new Date().toISOString(),
        opened: 0,
        total: total
      };
      
      setEmailHistory([newEmail, ...emailHistory]);
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
      
      // Here you would integrate with actual email service
      alert("Email sent successfully!");
  }

  function saveTemplate(e) {
    e.preventDefault();
    if (templateForm.name && templateForm.subject && templateForm.body) {
      const newTemplate = {
        id: Date.now(),
        ...templateForm
      };
      setTemplates([...templates, newTemplate]);
      setTemplateForm({
        name: "",
        subject: "",
        body: "",
        type: "general",
        category: "notification"
      });
      setShowTemplateForm(false);
      alert("Template saved successfully!");
    } else {
      alert("Please fill in all required fields.");
    }
  }

  function deleteTemplate(templateId) {
    if (window.confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  }

  function deleteEmail(emailId) {
    if (window.confirm("Are you sure you want to delete this email record?")) {
      setEmailHistory(emailHistory.filter(e => e.id !== emailId));
    }
  }

  // Filter patients by role and email preference
  const studentsWithEmail = patients.filter(p => p.role === "Student" && p.emailUpdates);
  const facultyWithEmail = patients.filter(p => p.role === "Faculty" && p.emailUpdates);

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage="email" setActivePage={setActivePage} onLogout={onLogout} />
      <main className="email-container">
        <div className="email-header">
          <h1 className="email-title">Email Notifications</h1>
          <div className="email-actions">
            <button className="email-btn primary" onClick={() => setShowComposeForm(true)}>
              <FaEnvelope /> Compose Email
            </button>
            <button className="email-btn secondary" onClick={() => setShowTemplateForm(true)}>
              <FaFileAlt /> New Template
            </button>
            <button className="email-btn secondary" onClick={() => setShowSettings(true)}>
              <FaCog /> Settings
            </button>
          </div>
        </div>

        {/* Email Statistics */}
        <div className="email-stats">
          <div className="stat-card">
            <div className="stat-number">{emailHistory.length}</div>
            <div className="stat-label">Total Emails Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{studentsWithEmail.length}</div>
            <div className="stat-label">Students with Email Updates</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{facultyWithEmail.length}</div>
            <div className="stat-label">Faculty with Email Updates</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{Math.round(emailHistory.reduce((acc, email) => acc + (email.opened / email.total), 0) / emailHistory.length * 100)}%</div>
            <div className="stat-label">Average Open Rate</div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="email-section">
          <h2>Email Templates</h2>
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.name}</h3>
                  <div className="template-actions">
                    <button 
                      className="template-btn use"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      Use
                    </button>
                    <button 
                      className="template-btn delete"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
                <div className="template-content">
                  <div className="template-type">
                    <span className={`type-badge ${template.type}`}>{template.type}</span>
                    <span className={`category-badge ${template.category}`}>{template.category}</span>
                  </div>
                  <div className="template-subject">
                    <strong>Subject:</strong> {template.subject}
                  </div>
                  <div className="template-body">
                    <strong>Body:</strong> {template.body.substring(0, 100)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email History */}
        <div className="email-section">
          <h2>Email History</h2>
          <table className="email-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Status</th>
                <th>Sent At</th>
                <th>Open Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emailHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">No emails sent yet</td>
                </tr>
              ) : (
                emailHistory.map(email => (
                  <tr key={email.id} className="email-row">
                    <td>{email.recipient}</td>
                    <td>{email.subject}</td>
                    <td>
                      <span className={`type-badge ${email.type}`}>
                        {email.type}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${email.status}`}>
                        {email.status}
                      </span>
                    </td>
                    <td>{new Date(email.sentAt).toLocaleString()}</td>
                    <td>{email.opened}/{email.total} ({Math.round(email.opened/email.total*100)}%)</td>
                    <td>
                      <button 
                        className="action-btn delete"
                        onClick={() => deleteEmail(email.id)}
                      >
                        <FaTimes />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Compose Email Modal */}
        {showComposeForm && (
          <div className="email-modal">
            <div className="email-modal-content">
              <h2>Compose Email</h2>
              <div className="compose-instructions">
                <p><strong>Recipient Options:</strong></p>
                <ul>
                  <li><strong>Send to All:</strong> Send to all students/faculty who opted in for email updates</li>
                  <li><strong>Individual:</strong> Send to a specific email address</li>
                  <li><strong>Custom List:</strong> Send to multiple specific email addresses (separate with commas)</li>
                </ul>
              </div>
              <form onSubmit={sendEmail}>
                <div className="form-row">
                  <select
                    name="recipientType"
                    value={composeForm.recipientType}
                    onChange={handleComposeFormChange}
                    required
                  >
                    <option value="all">Send to All</option>
                    <option value="individual">Individual</option>
                    <option value="custom">Custom List</option>
                  </select>
                  {composeForm.recipientType === "all" && (
                    <select
                      name="recipientGroup"
                      value={composeForm.recipientGroup}
                      onChange={handleComposeFormChange}
                      required
                    >
                      <option value="students">Students Only ({patients.filter(p => p.role === "Student" && p.emailUpdates).length} recipients)</option>
                      <option value="faculty">Faculty Only ({patients.filter(p => p.role === "Faculty" && p.emailUpdates).length} recipients)</option>
                      <option value="both">Both Students & Faculty ({patients.filter(p => p.emailUpdates).length} recipients)</option>
                    </select>
                  )}
                  {composeForm.recipientType === "individual" && (
                    <input
                      type="email"
                      name="individualEmail"
                      placeholder="Enter email address"
                      value={composeForm.individualEmail}
                      onChange={handleComposeFormChange}
                      required
                    />
                  )}
                  {composeForm.recipientType === "custom" && (
                    <textarea
                      name="customEmails"
                      placeholder="Enter email addresses separated by commas (e.g., email1@example.com, email2@example.com)"
                      value={composeForm.customEmails}
                      onChange={handleComposeFormChange}
                      rows="3"
                      required
                    />
                  )}
                </div>
                <div className="form-row">
                  <select
                    name="templateId"
                    value={composeForm.templateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                  >
                    <option value="">Select Template (Optional)</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  name="subject"
                  placeholder="Email Subject"
                  value={composeForm.subject}
                  onChange={handleComposeFormChange}
                  required
                />
                <textarea
                  name="body"
                  placeholder="Email Body"
                  value={composeForm.body}
                  onChange={handleComposeFormChange}
                  rows="8"
                  required
                />
                <div className="form-row">
                  <input
                    type="date"
                    name="scheduledDate"
                    value={composeForm.scheduledDate}
                    onChange={handleComposeFormChange}
                    placeholder="Schedule Date (Optional)"
                  />
                  <input
                    type="time"
                    name="scheduledTime"
                    value={composeForm.scheduledTime}
                    onChange={handleComposeFormChange}
                    placeholder="Schedule Time (Optional)"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="email-btn primary"><FaPaperPlane /> Send Email</button>
                  <button type="button" className="email-btn secondary" onClick={() => setShowComposeForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* New Template Modal */}
        {showTemplateForm && (
          <div className="email-modal">
            <div className="email-modal-content">
              <h2>Create New Template</h2>
              <form onSubmit={saveTemplate}>
                <div className="form-row">
                  <input
                    type="text"
                    name="name"
                    placeholder="Template Name"
                    value={templateForm.name}
                    onChange={handleTemplateFormChange}
                    required
                  />
                  <select
                    name="type"
                    value={templateForm.type}
                    onChange={handleTemplateFormChange}
                    required
                  >
                    <option value="general">General</option>
                    <option value="appointment">Appointment</option>
                    <option value="inventory">Inventory</option>
                    <option value="registration">Registration</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>
                <div className="form-row">
                  <select
                    name="category"
                    value={templateForm.category}
                    onChange={handleTemplateFormChange}
                    required
                  >
                    <option value="notification">Notification</option>
                    <option value="confirmation">Confirmation</option>
                    <option value="reminder">Reminder</option>
                    <option value="alert">Alert</option>
                    <option value="welcome">Welcome</option>
                  </select>
                </div>
                <input
                  type="text"
                  name="subject"
                  placeholder="Email Subject"
                  value={templateForm.subject}
                  onChange={handleTemplateFormChange}
                  required
                />
                <textarea
                  name="body"
                  placeholder="Email Body (Use {{variableName}} for dynamic content)"
                  value={templateForm.body}
                  onChange={handleTemplateFormChange}
                  rows="8"
                  required
                />
                <div className="template-variables">
                  <strong>Available Variables:</strong>
                  <div className="variables-list">
                    {{patientName}}, {{studentId}}, {{appointmentDate}}, {{appointmentTime}}, {{lastVisitDate}}, {{lastVisitReason}}, {{inventoryItems}}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="email-btn primary">💾 Save Template</button>
                  <button type="button" className="email-btn secondary" onClick={() => setShowTemplateForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="email-modal">
            <div className="email-modal-content">
              <h2>Email Settings</h2>
              <div className="settings-section">
                <h3>Automated Email Settings</h3>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="autoSendAppointments"
                      checked={settings.autoSendAppointments}
                      onChange={handleSettingsChange}
                    />
                    Automatically send appointment confirmations
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="autoSendReminders"
                      checked={settings.autoSendReminders}
                      onChange={handleSettingsChange}
                    />
                    Automatically send appointment reminders
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="autoSendInventory"
                      checked={settings.autoSendInventory}
                      onChange={handleSettingsChange}
                    />
                    Automatically send inventory alerts
                  </label>
                </div>
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      name="autoSendWelcome"
                      checked={settings.autoSendWelcome}
                      onChange={handleSettingsChange}
                    />
                    Automatically send welcome emails to new patients
                  </label>
                </div>
              </div>
              <div className="settings-section">
                <h3>Clinic Information</h3>
                <input
                  type="email"
                  placeholder="Clinic Email Address"
                  value={settings.clinicEmail}
                  onChange={(e) => setSettings({...settings, clinicEmail: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Clinic Name"
                  value={settings.clinicName}
                  onChange={(e) => setSettings({...settings, clinicName: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button className="email-btn primary" onClick={() => setShowSettings(false)}>Save Settings</button>
                <button className="email-btn secondary" onClick={() => setShowSettings(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Email;
