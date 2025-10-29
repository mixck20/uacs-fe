import React, { useState, useEffect } from "react";
import { FaFileAlt, FaDownload, FaShare, FaLock, FaCalendar, FaCapsules, FaNotesMedical, FaHeartbeat, FaUser, FaStethoscope, FaAllergies, FaTint, FaFilePdf, FaFileExcel, FaCertificate, FaPhone } from "react-icons/fa";
import UserPortalLayout from "./UserPortalLayout";
import { PatientsAPI, CertificateAPI } from "../api";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "./UserHealthRecord.css";

const UserHealthRecord = ({ user, onLogout }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [patientRecord, setPatientRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthRecords();
  }, []);

  const loadHealthRecords = async () => {
    try {
      setLoading(true);
      const data = await PatientsAPI.getMyRecords();
      setPatientRecord(data);
    } catch (error) {
      console.error('Error loading health records:', error);
      if (error.message.includes('No patient record found')) {
        // User hasn't had any appointments yet
        setPatientRecord(null);
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Failed to load health records',
          icon: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(229, 29, 94);
    doc.text('UNIVERSITY OF THE ASSUMPTION', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text('CLINIC - PERSONAL HEALTH RECORDS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Patient Info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text('PATIENT INFORMATION', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`Name: ${patientRecord?.fullName || user?.name}`, 20, yPos);
    yPos += 6;
    
    if (patientRecord?.studentId) {
      doc.text(`Student ID: ${patientRecord.studentId}`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.email) {
      doc.text(`Email: ${patientRecord.email}`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.dateOfBirth) {
      const age = Math.floor((new Date() - new Date(patientRecord.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      doc.text(`Date of Birth: ${new Date(patientRecord.dateOfBirth).toLocaleDateString()} (Age: ${age})`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.gender) {
      doc.text(`Gender: ${patientRecord.gender}`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.courseYearSection) {
      doc.text(`Course/Year/Section: ${patientRecord.courseYearSection}`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.contactNumber) {
      doc.text(`Contact Number: ${patientRecord.contactNumber}`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.address) {
      doc.text(`Address: ${patientRecord.address}`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.bloodType && patientRecord.bloodType !== 'Unknown') {
      doc.text(`Blood Type: ${patientRecord.bloodType}`, 20, yPos);
      yPos += 6;
    }
    
    if (patientRecord?.allergies && patientRecord.allergies.length > 0) {
      const allergiesText = `Allergies: ${patientRecord.allergies.join(', ')}`;
      const allergiesLines = doc.splitTextToSize(allergiesText, pageWidth - 40);
      doc.text(allergiesLines, 20, yPos);
      yPos += allergiesLines.length * 6;
    }
    
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 5;

    // Separator line
    doc.setDrawColor(229, 29, 94);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Visits
    if (filteredVisits.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40);
      doc.text(`MEDICAL HISTORY (${filteredVisits.length} Records)`, 20, yPos);
      yPos += 10;

      filteredVisits.forEach((visit, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(229, 29, 94);
        doc.text(`Visit #${index + 1}`, 20, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60);

        // Date
        if (visit.date) {
          const visitDate = new Date(visit.date);
          doc.text(`Date: ${visitDate.toLocaleDateString()} ${visitDate.toLocaleTimeString()}`, 25, yPos);
          yPos += 5;
        }

        // Age and Course at time of visit
        if (visit.age) {
          doc.text(`Age at Visit: ${visit.age}`, 25, yPos);
          yPos += 5;
        }

        if (visit.courseYearSection) {
          doc.text(`Course/Year/Section: ${visit.courseYearSection}`, 25, yPos);
          yPos += 5;
        }

        // Healthcare providers
        if (visit.physician) {
          doc.text(`Physician: ${visit.physician}`, 25, yPos);
          yPos += 5;
        }

        if (visit.nurse) {
          doc.text(`Nurse: ${visit.nurse}`, 25, yPos);
          yPos += 5;
        }

        yPos += 2;

        // Vital Signs
        if (visit.vitalSigns && Object.keys(visit.vitalSigns).length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("VITAL SIGNS:", 25, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");

          const vitals = [];
          if (visit.vitalSigns.bloodPressure) vitals.push(`BP: ${visit.vitalSigns.bloodPressure}`);
          if (visit.vitalSigns.temperature) vitals.push(`Temp: ${visit.vitalSigns.temperature}`);
          if (visit.vitalSigns.heartRate) vitals.push(`HR: ${visit.vitalSigns.heartRate}`);
          if (visit.vitalSigns.weight) vitals.push(`Weight: ${visit.vitalSigns.weight}`);
          if (visit.vitalSigns.height) vitals.push(`Height: ${visit.vitalSigns.height}`);

          if (vitals.length > 0) {
            doc.text(vitals.join(' | '), 30, yPos);
            yPos += 5;
          }
          yPos += 2;
        }

        // Physical Exam Findings (if available)
        const peFindings = [];
        if (visit.height) peFindings.push(`Height: ${visit.height}`);
        if (visit.weight) peFindings.push(`Weight: ${visit.weight}`);
        if (visit.bloodPressure) peFindings.push(`BP: ${visit.bloodPressure}`);
        
        if (peFindings.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("P.E. FINDINGS:", 25, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          doc.text(peFindings.join(' | '), 30, yPos);
          yPos += 5;
          yPos += 2;
        }

        // Diagnosis
        doc.setFont("helvetica", "bold");
        doc.text("DIAGNOSIS:", 25, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        
        if (visit.diagnosis) {
          const diagnosisLines = doc.splitTextToSize(visit.diagnosis, pageWidth - 60);
          doc.text(diagnosisLines, 30, yPos);
          yPos += diagnosisLines.length * 5 + 2;
        } else {
          doc.text("Not specified", 30, yPos);
          yPos += 7;
        }

        // Treatment
        doc.setFont("helvetica", "bold");
        doc.text("TREATMENT:", 25, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        
        if (visit.treatment) {
          const treatmentLines = doc.splitTextToSize(visit.treatment, pageWidth - 60);
          doc.text(treatmentLines, 30, yPos);
          yPos += treatmentLines.length * 5 + 2;
        } else {
          doc.text("Not specified", 30, yPos);
          yPos += 7;
        }

        // Prescriptions
        if (visit.prescriptions?.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("PRESCRIPTIONS:", 25, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          
          visit.prescriptions.forEach((rx) => {
            const rxText = `• ${rx.medication || 'N/A'} - ${rx.dosage || 'N/A'}`;
            doc.text(rxText, 30, yPos);
            yPos += 5;
            if (rx.instructions || rx.frequency) {
              doc.setFontSize(9);
              doc.text(`  ${rx.frequency || rx.instructions || 'As directed'}`, 32, yPos);
              yPos += 4;
              doc.setFontSize(10);
            }
          });
          yPos += 2;
        }

        // Notes
        if (visit.notes) {
          doc.setFont("helvetica", "bold");
          doc.text("NOTES:", 25, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          
          const notesLines = doc.splitTextToSize(visit.notes, pageWidth - 60);
          doc.text(notesLines, 30, yPos);
          yPos += notesLines.length * 5 + 2;
        }

        // Separator line between visits
        yPos += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 8;
      });
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(128);
      doc.text("No medical records available.", 20, yPos);
    }

    // Footer on all pages
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Personal Health Records | Generated ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    doc.save(`Health-Records_${user?.name || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`);
    Swal.fire('Success!', 'Complete health records exported to PDF', 'success');
  };

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Patient Info Sheet
    const patientInfo = [
      ['Patient Information'],
      ['Name', patientRecord?.fullName || user?.name],
      ['Blood Type', patientRecord?.bloodType || 'N/A'],
      ['Allergies', patientRecord?.allergies?.join(', ') || 'None'],
      ['Total Visits', filteredVisits.length],
      ['Generated', new Date().toLocaleDateString()]
    ];
    const patientSheet = XLSX.utils.aoa_to_sheet(patientInfo);
    XLSX.utils.book_append_sheet(workbook, patientSheet, 'Patient Info');

    // Visits Sheet
    const visitsData = filteredVisits.map((visit, index) => ({
      'Visit #': index + 1,
      'Date': new Date(visit.date).toLocaleDateString(),
      'Diagnosis': visit.diagnosis || 'N/A',
      'Treatment': visit.treatment || 'N/A',
      'Prescriptions': visit.prescriptions?.map(p => `${p.medication} - ${p.dosage}`).join('; ') || 'None',
      'Blood Pressure': visit.vitalSigns?.bloodPressure || 'N/A',
      'Temperature': visit.vitalSigns?.temperature || 'N/A',
      'Heart Rate': visit.vitalSigns?.heartRate || 'N/A',
      'Notes': visit.notes || ''
    }));
    
    const visitsSheet = XLSX.utils.json_to_sheet(visitsData);
    XLSX.utils.book_append_sheet(workbook, visitsSheet, 'Visit History');

    XLSX.writeFile(workbook, `health-records-${new Date().toISOString().split('T')[0]}.xlsx`);
    Swal.fire('Success!', 'Health records exported to Excel', 'success');
  };

  // Request Medical Certificate
  const requestMedicalCertificate = async () => {
    const result = await Swal.fire({
      title: 'Request Medical Certificate',
      html: `
        <div style="text-align: left; margin-top: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            Purpose of Certificate *
          </label>
          <select id="certificate-purpose" class="swal2-input" style="width: 100%;">
            <option value="">Select purpose...</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="School Excuse">School Excuse</option>
            <option value="Work Clearance">Work Clearance</option>
            <option value="Insurance">Insurance</option>
            <option value="Other">Other</option>
          </select>
          
          <label style="display: block; margin-top: 1rem; margin-bottom: 0.5rem; font-weight: 600;">
            Additional Notes
          </label>
          <textarea 
            id="certificate-notes" 
            class="swal2-textarea" 
            placeholder="Any additional information..."
            style="width: 100%;"
          ></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Request',
      confirmButtonColor: '#e51d5e',
      preConfirm: () => {
        const purpose = document.getElementById('certificate-purpose').value;
        if (!purpose) {
          Swal.showValidationMessage('Please select a purpose');
          return false;
        }
        return {
          purpose,
          notes: document.getElementById('certificate-notes').value
        };
      }
    });

    if (result.isConfirmed) {
      try {
        await CertificateAPI.requestCertificate(result.value.purpose, result.value.notes);
        Swal.fire({
          title: 'Request Submitted!',
          html: 'Your medical certificate request has been submitted to the clinic. You will be notified once it is ready.',
          icon: 'success'
        });
      } catch (error) {
        console.error('Error requesting certificate:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to submit certificate request',
          icon: 'error'
        });
      }
    }
  };

  const filteredVisits = patientRecord?.visits?.filter(visit => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'consultations') return visit.diagnosis || visit.treatment;
    if (activeCategory === 'prescriptions') return visit.prescriptions?.length > 0;
    if (activeCategory === 'lab') return visit.vitalSigns;
    return true;
  }) || [];

  if (loading) {
    return (
      <UserPortalLayout user={user} onLogout={onLogout}>
        <div className="health-records-page">
          <div className="loading-state">Loading your health records...</div>
        </div>
      </UserPortalLayout>
    );
  }

  return (
    <UserPortalLayout user={user} onLogout={onLogout}>
      <div className="health-records-page">
        <div className="page-header">
          <div>
            <h1>Health Records</h1>
            <p className="user-info">
              {user?.name || user?.fullName || 'User'} {user?.role && `(${user.role})`}
            </p>
          </div>
          <div className="header-actions">
            <button className="export-btn pdf-btn" onClick={exportToPDF}>
              <FaFilePdf /> Export PDF
            </button>
            <button className="export-btn excel-btn" onClick={exportToExcel}>
              <FaFileExcel /> Export Excel
            </button>
            <button className="export-btn certificate-btn" onClick={requestMedicalCertificate}>
              <FaCertificate /> Request Certificate
            </button>
          </div>
        </div>

        {patientRecord ? (
          <>
            {/* Patient Information Summary */}
            <div className="patient-summary-card">
              <h3>Patient Information</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <FaUser className="summary-icon" />
                  <div>
                    <div className="summary-label">Full Name</div>
                    <div className="summary-value">{patientRecord.fullName}</div>
                  </div>
                </div>
                {patientRecord.email && (
                  <div className="summary-item">
                    <FaUser className="summary-icon" />
                    <div>
                      <div className="summary-label">Email</div>
                      <div className="summary-value">{patientRecord.email}</div>
                    </div>
                  </div>
                )}
                {patientRecord.studentId && (
                  <div className="summary-item">
                    <FaUser className="summary-icon" />
                    <div>
                      <div className="summary-label">Student ID</div>
                      <div className="summary-value">{patientRecord.studentId}</div>
                    </div>
                  </div>
                )}
                {patientRecord.dateOfBirth && (
                  <div className="summary-item">
                    <FaUser className="summary-icon" />
                    <div>
                      <div className="summary-label">Date of Birth</div>
                      <div className="summary-value">
                        {new Date(patientRecord.dateOfBirth).toLocaleDateString()}
                        {' '}({Math.floor((new Date() - new Date(patientRecord.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))} years old)
                      </div>
                    </div>
                  </div>
                )}
                {patientRecord.gender && (
                  <div className="summary-item">
                    <FaUser className="summary-icon" />
                    <div>
                      <div className="summary-label">Sex</div>
                      <div className="summary-value">{patientRecord.gender}</div>
                    </div>
                  </div>
                )}
                {patientRecord.courseYearSection && (
                  <div className="summary-item">
                    <FaUser className="summary-icon" />
                    <div>
                      <div className="summary-label">Course/Year/Section</div>
                      <div className="summary-value">{patientRecord.courseYearSection}</div>
                    </div>
                  </div>
                )}
                {patientRecord.contactNumber && (
                  <div className="summary-item">
                    <FaPhone className="summary-icon" />
                    <div>
                      <div className="summary-label">Contact Number</div>
                      <div className="summary-value">{patientRecord.contactNumber}</div>
                    </div>
                  </div>
                )}
                {patientRecord.address && (
                  <div className="summary-item">
                    <FaUser className="summary-icon" />
                    <div>
                      <div className="summary-label">Address</div>
                      <div className="summary-value">{patientRecord.address}</div>
                    </div>
                  </div>
                )}
                <div className="summary-item">
                  <FaStethoscope className="summary-icon" />
                  <div>
                    <div className="summary-label">Total Visits</div>
                    <div className="summary-value">{patientRecord.visits?.length || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="records-categories">
              <button 
                className={`category-btn ${activeCategory === 'all' ? 'active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All Records ({patientRecord.visits?.length || 0})
              </button>
              <button 
                className={`category-btn ${activeCategory === 'consultations' ? 'active' : ''}`}
                onClick={() => setActiveCategory('consultations')}
              >
                Consultations
              </button>
              <button 
                className={`category-btn ${activeCategory === 'prescriptions' ? 'active' : ''}`}
                onClick={() => setActiveCategory('prescriptions')}
              >
                Prescriptions
              </button>
              <button 
                className={`category-btn ${activeCategory === 'lab' ? 'active' : ''}`}
                onClick={() => setActiveCategory('lab')}
              >
                Vital Signs
              </button>
            </div>

            {/* Visit Records */}
            {filteredVisits.length > 0 ? (
              <div className="records-grid">
                {filteredVisits.map((visit, index) => (
                  <div className="record-card" key={visit._id || index}>
                    <div className="record-header">
                      <div className="record-date">
                        <FaCalendar />
                        <span>{new Date(visit.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>

                    {/* Linked Appointment Info */}
                    {visit.appointmentId && (
                      <div className="appointment-link-section">
                        <div className="appointment-badge">
                          <FaCalendar className="badge-icon" />
                          <div className="badge-content">
                            <span className="badge-label">Related Appointment</span>
                            <span className="badge-details">
                              {new Date(visit.appointmentId.date).toLocaleDateString()} at {visit.appointmentId.time}
                              {visit.appointmentId.type && ` • ${visit.appointmentId.type}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {visit.diagnosis && (
                      <div className="record-section">
                        <h4><FaNotesMedical /> Diagnosis</h4>
                        <p>{visit.diagnosis}</p>
                      </div>
                    )}

                    {visit.treatment && (
                      <div className="record-section">
                        <h4><FaStethoscope /> Treatment</h4>
                        <p>{visit.treatment}</p>
                      </div>
                    )}

                    {visit.prescriptions && visit.prescriptions.length > 0 && (
                      <div className="record-section">
                        <h4><FaCapsules /> Prescriptions</h4>
                        <ul className="prescriptions-list">
                          {visit.prescriptions.map((rx, idx) => (
                            <li key={idx}>
                              <strong>{rx.medication}</strong> - {rx.dosage}
                              {rx.instructions && <div className="rx-instructions">{rx.instructions}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {visit.vitalSigns && (
                      <div className="record-section">
                        <h4><FaHeartbeat /> Vital Signs</h4>
                        <div className="vitals-grid">
                          {visit.vitalSigns.bloodPressure && (
                            <div className="vital-item">
                              <span className="vital-label">BP:</span>
                              <span className="vital-value">{visit.vitalSigns.bloodPressure}</span>
                            </div>
                          )}
                          {visit.vitalSigns.temperature && (
                            <div className="vital-item">
                              <span className="vital-label">Temp:</span>
                              <span className="vital-value">{visit.vitalSigns.temperature}°</span>
                            </div>
                          )}
                          {visit.vitalSigns.heartRate && (
                            <div className="vital-item">
                              <span className="vital-label">HR:</span>
                              <span className="vital-value">{visit.vitalSigns.heartRate} bpm</span>
                            </div>
                          )}
                          {visit.vitalSigns.weight && (
                            <div className="vital-item">
                              <span className="vital-label">Weight:</span>
                              <span className="vital-value">{visit.vitalSigns.weight} kg</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {visit.notes && (
                      <div className="record-section">
                        <h4><FaNotesMedical /> Notes</h4>
                        <p className="record-notes">{visit.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-records-message">
                <FaFileAlt size={48} />
                <h3>No Records in This Category</h3>
                <p>Try selecting a different category to view your health records.</p>
              </div>
            )}
          </>
        ) : (
          <div className="no-records-message">
            <FaFileAlt size={48} />
            <h3>No Health Records Yet</h3>
            <p>Your health records will appear here after your first consultation with the clinic.</p>
            <p className="hint">Book an appointment to get started!</p>
          </div>
        )}

        <div className="privacy-notice">
          <FaLock className="lock-icon" />
          <p>Your health records are private and secure. Only you and your healthcare providers can access this information.</p>
        </div>
      </div>
    </UserPortalLayout>
  );
};

export default UserHealthRecord;