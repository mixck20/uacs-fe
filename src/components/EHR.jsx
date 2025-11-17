import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./EHR.css";
import { PatientsAPI, InventoryAPI, CertificateAPI } from "../api";
import { FaUser, FaCalendar, FaStethoscope, FaPills, FaNotesMedical, FaHeartbeat, FaPhone, FaFileMedical, FaTimes, FaPlus, FaFileExport, FaTrash, FaEye, FaCheckCircle, FaExclamationTriangle, FaCertificate, FaDownload, FaBan } from "react-icons/fa";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

function EHR({ setActivePage, activePage, sidebarOpen, setSidebarOpen, onLogout, user }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'certificates'
  const [certificates, setCertificates] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showCertificates, setShowCertificates] = useState(false);

  // EHR record form state
  const [newRecord, setNewRecord] = useState({
    date: "",
    age: "",
    physician: "",
    nurse: "",
    // PE Findings
    height: "",
    weight: "",
    bloodPressure: "",
    lmp: "",
    // Diagnosis & Treatment
    diagnosis: "",
    treatment: "",
    notes: "",
  });

  // Prescription state
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  // --- Fetch patients and inventory from backend on mount ---
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log('Fetching patients for EHR...');
        const data = await PatientsAPI.list();
        console.log(`Successfully fetched ${data.length} patients for EHR`);
        setPatients(data || []);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setPatients([]);
      }
    };

    const fetchInventory = async () => {
      try {
        const data = await InventoryAPI.list();
        setInventoryItems(data || []);
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
        setInventoryItems([]);
      }
    };

    fetchPatients();
    fetchInventory();
  }, []);

  // --- Fetch health record for selected patient ---
  async function fetchPatientRecord(patientId) {
    try {
      const record = await PatientsAPI.get(patientId);
      setSelectedPatient(prev => ({
        ...prev,
        visits: record.visits || []
      }));
    } catch (err) {
      setSelectedPatient(prev => ({ ...prev, visits: [] }));
      // Optionally display message if not found
    }
  }

  // --- Load all certificates or patient-specific ---
  async function loadCertificates(patientId = null) {
    try {
      const allCerts = await CertificateAPI.getAllCertificates();
      if (patientId) {
        // Filter certificates for this patient
        const patientCerts = allCerts.filter(cert => 
          cert.patientId?._id === patientId || cert.patientId === patientId
        );
        setCertificates(patientCerts);
      } else {
        // Show all certificates
        setCertificates(allCerts);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setCertificates([]);
    }
  }

  // Load all certificates on mount
  useEffect(() => {
    loadCertificates();
  }, []);

  // --- Handle patient selection ---
  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setShowForm(false);
    setActiveTab('history');
    fetchPatientRecord(patient._id || patient.id);
    loadCertificates(patient._id || patient.id);
  }

  // --- Handle file upload ---
  function handleFileUpload(e) {
    setNewRecord({
      ...newRecord,
      tests: [...newRecord.tests, ...Array.from(e.target.files).map(f => f.name)],
    });
  }

  // --- Handle record field update ---
  function handleRecordChange(e) {
    const { name, value } = e.target;
    setNewRecord({ ...newRecord, [name]: value });
  }

  // --- Prescription management functions ---
  function handleAddPrescription() {
    setPrescriptions([...prescriptions, {
      medication: "",
      itemId: "",
      dosage: "",
      frequency: "",
      instructions: "",
      quantity: 1
    }]);
  }

  function handleRemovePrescription(index) {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  }

  function handlePrescriptionChange(index, field, value) {
    const updated = [...prescriptions];
    updated[index][field] = value;
    
    // Auto-fill medication name when item is selected
    if (field === 'itemId') {
      const item = inventoryItems.find(i => i._id === value);
      if (item) {
        updated[index].medication = item.name;
      }
    }
    
    setPrescriptions(updated);
  }

  // --- Open visit details modal ---
  function handleViewDetails(visit) {
    setSelectedVisit(visit);
    setShowDetailsModal(true);
  }

  // --- Add a new medical record via backend ---
  async function handleAddRecord() {
    if (!selectedPatient) return;

    if (
      !newRecord.date ||
      !newRecord.diagnosis ||
      !newRecord.treatment
    ) {
      alert("Please fill in Date, Diagnosis, and Treatment fields.");
      return;
    }

    // Validate prescriptions - always dispense if medications are selected
    if (prescriptions.length > 0) {
      for (let i = 0; i < prescriptions.length; i++) {
        const rx = prescriptions[i];
        if (!rx.medication || !rx.dosage) {
          alert(`Please fill in all required fields for prescription #${i + 1}`);
          return;
        }
        if (rx.itemId && rx.quantity < 1) {
          alert(`Please enter a valid quantity for ${rx.medication}`);
          return;
        }
      }
    }

    try {
      const recordData = {
        ...newRecord,
        prescriptions: prescriptions,
        dispenseMedications: prescriptions.filter(rx => rx.itemId).map(rx => ({
          itemId: rx.itemId,
          medication: rx.medication,
          quantity: rx.quantity || 1
        }))
      };

      const data = await PatientsAPI.addVisit(selectedPatient._id || selectedPatient.id, recordData);
      
      // Show dispensing results if any
      if (data.dispensingResults) {
        const successCount = data.dispensingResults.filter(r => r.success).length;
        const failCount = data.dispensingResults.filter(r => !r.success).length;
        
        let message = `Visit record added successfully!\n\n`;
        if (successCount > 0) {
          message += `${successCount} medication(s) dispensed from inventory\n`;
        }
        if (failCount > 0) {
          message += `${failCount} medication(s) failed to dispense:\n`;
          data.dispensingResults.filter(r => !r.success).forEach(r => {
            message += `   • ${r.medication}: ${r.message}\n`;
          });
        }
        
        await Swal.fire({
          title: 'Record Added',
          text: message,
          icon: successCount > 0 ? 'success' : 'warning',
          confirmButtonColor: '#4CAF50'
        });
      } else {
        await Swal.fire({
          title: 'Success!',
          text: 'Visit record added successfully',
          icon: 'success',
          confirmButtonColor: '#4CAF50'
        });
      }
      
      // Update visits from backend response
      setSelectedPatient({
        ...selectedPatient,
        visits: data.patient.visits || []
      });

      // Optionally update patients array
      setPatients(patients.map(p =>
        (p._id || p.id) === (selectedPatient._id || selectedPatient.id) ?
          { ...p, visits: data.patient.visits || [] } :
          p
      ));

      // Reset form
      setNewRecord({
        date: "",
        age: "",
        physician: "",
        nurse: "",
        height: "",
        weight: "",
        bloodPressure: "",
        lmp: "",
        diagnosis: "",
        treatment: "",
        notes: "",
      });
      setPrescriptions([]);
      setShowForm(false);
    } catch (err) {
      alert(err.message || 'Failed to add record');
    }
  }

  async function handleExportPDF() {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Try to add school logo, but continue if it fails
    try {
      const logo = new Image();
      logo.src = '/ua-logo.png';
      await new Promise((resolve, reject) => {
        logo.onload = () => {
          try {
            doc.addImage(logo, 'PNG', 15, 15, 20, 20);
            resolve();
          } catch (err) {
            console.warn('Failed to add logo to PDF:', err);
            resolve(); // Continue without logo
          }
        };
        logo.onerror = () => {
          console.warn('Logo image failed to load');
          resolve(); // Continue without logo
        };
        // Set timeout to not hang indefinitely
        setTimeout(() => resolve(), 1000);
      });
    } catch (error) {
      console.warn('Error loading logo:', error);
      // Continue without logo
    }

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("UNIVERSITY OF THE ASSUMPTION", pageWidth / 2, yPos + 5, { align: "center" });
    yPos += 13;
    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text("CLINIC ELECTRONIC HEALTH RECORD", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Patient Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT INFORMATION", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${selectedPatient.fullName || selectedPatient.name || 'N/A'}`, 20, yPos);
    yPos += 6;
    
    if (selectedPatient.studentId) {
      doc.text(`Student ID: ${selectedPatient.studentId}`, 20, yPos);
      yPos += 6;
    }
    
    if (selectedPatient.email) {
      doc.text(`Email: ${selectedPatient.email}`, 20, yPos);
      yPos += 6;
    }
    
    if (selectedPatient.courseYear) {
      doc.text(`Course/Year: ${selectedPatient.courseYear}`, 20, yPos);
      yPos += 6;
    }
    
    if (selectedPatient.contactNumber) {
      doc.text(`Contact: ${selectedPatient.contactNumber}`, 20, yPos);
      yPos += 6;
    }
    
    if (selectedPatient.dateOfBirth) {
      const dob = new Date(selectedPatient.dateOfBirth);
      doc.text(`Date of Birth: ${dob.toLocaleDateString()}`, 20, yPos);
      yPos += 6;
    }
    
    if (selectedPatient.gender) {
      doc.text(`Gender: ${selectedPatient.gender}`, 20, yPos);
      yPos += 6;
    }

    yPos += 5;
    doc.setDrawColor(229, 29, 94);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Medical Records
    const visits = selectedPatient.visits || [];
    
    if (visits.length === 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("No medical records available.", 20, yPos);
    } else {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`MEDICAL HISTORY (${visits.length} Records)`, 20, yPos);
      yPos += 10;

      visits.forEach((visit, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Visit #${index + 1}`, 20, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Date
        if (visit.date) {
          const visitDate = new Date(visit.date);
          doc.text(`Date: ${visitDate.toLocaleDateString()}`, 25, yPos);
          yPos += 5;
        }

        // Age & Course
        if (visit.age) {
          doc.text(`Age: ${visit.age}`, 25, yPos);
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

        // PE Findings
        doc.setFont("helvetica", "bold");
        doc.text("P.E. FINDINGS:", 25, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");

        const findings = [];
        if (visit.height) findings.push(`Height: ${visit.height}`);
        if (visit.weight) findings.push(`Weight: ${visit.weight}`);
        if (visit.bloodPressure) findings.push(`BP: ${visit.bloodPressure}`);
        if (visit.lmp) findings.push(`LMP: ${visit.lmp}`);

        if (findings.length > 0) {
          doc.text(findings.join(' | '), 30, yPos);
          yPos += 5;
        } else {
          doc.text("No physical exam findings recorded", 30, yPos);
          yPos += 5;
        }

        yPos += 2;

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
        if (visit.prescriptions && visit.prescriptions.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("PRESCRIPTIONS:", 25, yPos);
          yPos += 5;
          doc.setFont("helvetica", "normal");
          
          visit.prescriptions.forEach((rx) => {
            const rxText = `- ${rx.medication || 'N/A'} (${rx.dosage || 'N/A'}) - ${rx.frequency || rx.instructions || 'As directed'}`;
            doc.text(rxText, 30, yPos);
            yPos += 5;
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

        // Separator line
        yPos += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 8;
      });
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Save PDF
    const fileName = `EHR_${selectedPatient.fullName || selectedPatient.name || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // --- Certificate Handlers ---
  async function handleIssueCertificate(cert) {
    const patientName = cert.patientId?.fullName || cert.patientId?.name || 'Unknown Patient';
    const requestDate = cert.createdAt || cert.requestDate || cert.dateRequested;
    const formattedDate = requestDate ? new Date(requestDate).toLocaleDateString() : new Date().toLocaleDateString();
    
    const { value: formValues } = await Swal.fire({
      title: 'Issue Medical Certificate',
      html: `
        <div class="cert-issue-form">
          <div class="cert-info-box">
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Purpose:</strong> ${cert.purpose || 'Medical Certificate'}</p>
            <p><strong>Requested:</strong> ${formattedDate}</p>
            ${cert.requestNotes ? `<p><strong>Notes:</strong> ${cert.requestNotes}</p>` : ''}
          </div>
          
          <div class="form-field">
            <label for="cert-diagnosis">Diagnosis *</label>
            <div 
              id="cert-diagnosis" 
              class="cert-input-field"
              contenteditable="true"
              data-placeholder="Enter diagnosis"
            ></div>
          </div>
          
          <div class="form-field">
            <label for="cert-recommendations">Recommendations *</label>
            <div 
              id="cert-recommendations" 
              class="cert-input-field"
              contenteditable="true"
              data-placeholder="Enter recommendations"
            ></div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Issue Certificate',
      confirmButtonColor: '#e51d5e',
      cancelButtonColor: '#6c757d',
      customClass: {
        popup: 'cert-issue-modal',
        htmlContainer: 'cert-issue-content'
      },
      width: '600px',
      didOpen: () => {
        const diagnosis = document.getElementById('cert-diagnosis');
        const recommendations = document.getElementById('cert-recommendations');
        if (diagnosis) diagnosis.focus();
      },
      preConfirm: () => {
        const diagnosis = document.getElementById('cert-diagnosis').innerText.trim();
        const recommendations = document.getElementById('cert-recommendations').innerText.trim();
        
        if (!diagnosis || !recommendations) {
          Swal.showValidationMessage('Please fill in all required fields');
          return false;
        }
        
        return { diagnosis, recommendations };
      }
    });

    if (formValues) {
      try {
        await CertificateAPI.issueCertificate(cert._id, formValues);
        await loadCertificates(selectedPatient?._id || selectedPatient?.id);
        Swal.fire({
          title: 'Success!',
          text: 'Certificate issued successfully',
          icon: 'success',
          confirmButtonColor: '#e51d5e'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to issue certificate',
          icon: 'error',
          confirmButtonColor: '#e51d5e'
        });
      }
    }
  }

  async function handleRejectCertificate(cert) {
    const { value: reason } = await Swal.fire({
      title: 'Reject Certificate Request',
      input: 'textarea',
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'Enter reason for rejection...',
      inputAttributes: {
        'aria-label': 'Enter reason for rejection'
      },
      showCancelButton: true,
      confirmButtonText: 'Reject',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to provide a reason!';
        }
      }
    });

    if (reason) {
      try {
        await CertificateAPI.rejectCertificate(cert._id, reason);
        await loadCertificates(selectedPatient?._id || selectedPatient?.id);
        Swal.fire({
          title: 'Rejected',
          text: 'Certificate request has been rejected',
          icon: 'info',
          confirmButtonColor: '#e51d5e'
        });
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to reject certificate',
          icon: 'error',
          confirmButtonColor: '#e51d5e'
        });
      }
    }
  }

  async function handleDownloadCertificate(certId) {
    try {
      await CertificateAPI.downloadCertificate(certId);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to download certificate',
        icon: 'error',
        confirmButtonColor: '#e51d5e'
      });
    }
  }

  // --- Filter patients by search ---
  const filteredPatients = patients.filter(p =>
    ((p.fullName || p.name || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={user} />
      <div className="clinic-content">
        <div className="ehr-header">
          <h1 className="ehr-title">Electronic Health Records</h1>
          <button 
            className="cert-requests-btn"
            onClick={() => setShowCertificates(!showCertificates)}
          >
            <FaCertificate />
            <span>Certificate Requests</span>
            {certificates.filter(c => c.status?.toLowerCase() === 'pending').length > 0 && (
              <span className="cert-badge">
                {certificates.filter(c => c.status?.toLowerCase() === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {!showCertificates ? (
          <>
            {/* Search Bar */}
            <input
              type="text"
              className="ehr-search"
              placeholder="Search by patient name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="ehr-layout">
          <div className="ehr-patient-list">
            <div className="patient-list-header">
              <FaUser />
              <h2>Patients</h2>
              <span className="patient-count">{filteredPatients.length}</span>
            </div>
            {filteredPatients.length === 0 ? (
              <p className="ehr-empty">No patients found</p>
            ) : (
              filteredPatients.map(p => (
                <div
                  key={p._id || p.id}
                  className={`ehr-patient ${
                    (selectedPatient?._id || selectedPatient?.id) === (p._id || p.id) ? "active" : ""
                  }`}
                  onClick={() => handleSelectPatient(p)}
                >
                  <div className="patient-avatar">
                    {(p.fullName || p.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="patient-info">
                    <p className="patient-name">{p.fullName || p.name}</p>
                    <p className="patient-meta">
                      {p.courseYear && <span>{p.courseYear}</span>}
                      {p.visits && <span>• {p.visits.length} visits</span>}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="ehr-records">
            {selectedPatient ? (
              <>
                {/* Patient Header */}
                <div className="patient-header">
                  <div className="patient-header-avatar">
                    {(selectedPatient.fullName || selectedPatient.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="patient-header-info">
                    <h2>{selectedPatient.fullName || selectedPatient.name}</h2>
                    <div className="patient-header-details">
                      {selectedPatient.email && <span><FaUser /> {selectedPatient.email}</span>}
                      {selectedPatient.courseYear && <span><FaFileMedical /> {selectedPatient.courseYear}</span>}
                    </div>
                  </div>
                  <div className="ehr-actions">
                    <button className="ehr-btn add-btn" onClick={() => setShowForm(true)}>
                      <FaPlus /> Add Record
                    </button>
                    <button className="ehr-btn export-btn pdf-export-btn" onClick={handleExportPDF}>
                      <FaFileExport /> Export PDF
                    </button>
                  </div>
                </div>
                
                {/* Medical History Tab */}
                {activeTab === 'history' && (
                <div className="medical-history-section">
                  <div className="section-header">
                    <FaNotesMedical />
                    <h3>Medical History</h3>
                    <span className="record-count">
                      {selectedPatient.visits?.length || 0} {selectedPatient.visits?.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>
                  
                  {(!selectedPatient.visits || selectedPatient.visits.length === 0) ? (
                    <div className="empty-state">
                      <FaFileMedical className="empty-icon" />
                      <p>No medical history available</p>
                      <button className="ehr-btn add-btn" onClick={() => setShowForm(true)}>
                        <FaPlus /> Add First Record
                      </button>
                    </div>
                  ) : (
                    <div className="records-timeline">
                      {selectedPatient.visits.map((visit, index) => (
                        <div key={index} className="record-card">
                          <div className="record-header">
                            <div className="record-date">
                              <FaCalendar />
                              <span>{new Date(visit.date).toLocaleDateString()}</span>
                            </div>
                            <div className="record-header-actions">
                              {visit.appointmentId && (
                                <span className="appointment-badge">From Appointment</span>
                              )}
                              <button 
                                className="view-details-btn" 
                                onClick={() => handleViewDetails(visit)}
                                title="View Full Details"
                              >
                                <FaEye /> View Details
                              </button>
                            </div>
                          </div>
                          
                          <div className="record-body">
                            {/* Vital Signs */}
                            {visit.vitalSigns && (
                              <div className="record-section vitals-section">
                                <h4><FaHeartbeat /> Vital Signs</h4>
                                <div className="vitals-grid">
                                  {visit.vitalSigns.bloodPressure && (
                                    <div className="vital-item">
                                      <span className="vital-label">BP</span>
                                      <span className="vital-value">{visit.vitalSigns.bloodPressure}</span>
                                    </div>
                                  )}
                                  {visit.vitalSigns.temperature && (
                                    <div className="vital-item">
                                      <span className="vital-label">Temp</span>
                                      <span className="vital-value">{visit.vitalSigns.temperature}</span>
                                    </div>
                                  )}
                                  {visit.vitalSigns.heartRate && (
                                    <div className="vital-item">
                                      <span className="vital-label">Heart Rate</span>
                                      <span className="vital-value">{visit.vitalSigns.heartRate}</span>
                                    </div>
                                  )}
                                  {visit.vitalSigns.weight && (
                                    <div className="vital-item">
                                      <span className="vital-label">Weight</span>
                                      <span className="vital-value">{visit.vitalSigns.weight}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Diagnosis */}
                            {visit.diagnosis && (
                              <div className="record-section">
                                <h4><FaStethoscope /> Diagnosis</h4>
                                <p>{visit.diagnosis}</p>
                              </div>
                            )}
                            
                            {/* Treatment */}
                            {visit.treatment && (
                              <div className="record-section">
                                <h4><FaNotesMedical /> Treatment</h4>
                                <p>{visit.treatment}</p>
                              </div>
                            )}
                            
                            {/* Prescriptions */}
                            {visit.prescriptions && visit.prescriptions.length > 0 && (
                              <div className="record-section">
                                <h4><FaPills /> Prescriptions</h4>
                                <div className="prescriptions-list">
                                  {visit.prescriptions.map((rx, idx) => (
                                    <div key={idx} className="prescription-item">
                                      <span className="rx-name">{rx.medication}</span>
                                      <span className="rx-dosage">{rx.dosage}</span>
                                      <span className="rx-frequency">{rx.frequency}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Notes */}
                            {visit.notes && (
                              <div className="record-section">
                                <h4>Additional Notes</h4>
                                <p className="notes-text">{visit.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}
              </>
            ) : (
              <div className="empty-state centered">
                <FaUser className="empty-icon large" />
                <h3>No Patient Selected</h3>
                <p>Select a patient from the list to view their medical records</p>
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          /* Certificate Requests View */
          <div className="certificates-full-view">
            <div className="certificates-section">
              <div className="section-header">
                <FaCertificate />
                <h3>Medical Certificate Requests</h3>
                <span className="record-count">
                  {certificates.length} {certificates.length === 1 ? 'Request' : 'Requests'}
                </span>
              </div>
              
              {certificates.length === 0 ? (
                <div className="empty-state">
                  <FaCertificate className="empty-icon" />
                  <p>No certificate requests yet</p>
                </div>
              ) : (
                <div className="certificates-list">
                  {certificates.map((cert) => (
                    <div key={cert._id} className={`certificate-card status-${cert.status?.toLowerCase()}`}>
                      <div className="certificate-header">
                        <div className="certificate-info">
                          <h4>{cert.purpose || 'Medical Certificate'}</h4>
                          <div className="certificate-meta">
                            <span className="certificate-patient">
                              <FaUser /> {cert.patientId?.fullName || cert.patientId?.name || 'Unknown Patient'}
                            </span>
                            <span className="certificate-date">
                              <FaCalendar /> {cert.createdAt ? new Date(cert.createdAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                        </div>
                        <span className={`certificate-status status-${cert.status?.toLowerCase()}`}>
                          {cert.status?.toLowerCase() === 'pending' && <FaExclamationTriangle />}
                          {cert.status?.toLowerCase() === 'issued' && <FaCheckCircle />}
                          {cert.status?.toLowerCase() === 'rejected' && <FaBan />}
                          {cert.status}
                        </span>
                      </div>
                      
                      <div className="certificate-body">
                        {cert.requestNotes && (
                          <p className="certificate-notes"><strong>Request Notes:</strong> {cert.requestNotes}</p>
                        )}
                        
                        {cert.status?.toLowerCase() === 'issued' && cert.diagnosis && (
                          <p className="certificate-diagnosis"><strong>Diagnosis:</strong> {cert.diagnosis}</p>
                        )}
                        
                        {cert.status?.toLowerCase() === 'issued' && cert.recommendations && (
                          <p className="certificate-recommendations"><strong>Recommendations:</strong> {cert.recommendations}</p>
                        )}
                        
                        {cert.status?.toLowerCase() === 'rejected' && cert.rejectionReason && (
                          <p className="certificate-rejection"><strong>Rejection Reason:</strong> {cert.rejectionReason}</p>
                        )}
                      </div>
                      
                      <div className="certificate-actions">
                        {cert.status?.toLowerCase() === 'pending' && (
                          <>
                            <button 
                              className="cert-btn issue-btn"
                              onClick={() => handleIssueCertificate(cert)}
                            >
                              <FaCheckCircle /> Issue Certificate
                            </button>
                            <button 
                              className="cert-btn reject-btn"
                              onClick={() => handleRejectCertificate(cert)}
                            >
                              <FaBan /> Reject
                            </button>
                          </>
                        )}
                        {cert.status?.toLowerCase() === 'issued' && (
                          <button 
                            className="cert-btn download-btn"
                            onClick={() => handleDownloadCertificate(cert._id)}
                          >
                            <FaDownload /> Download PDF
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Record Modal */}
        {showForm && (
          <div className="ehr-modal">
            <div className="ehr-modal-content">
              <div className="modal-header">
                <h2>Add New Medical Record</h2>
                <button className="close-modal-btn" onClick={() => setShowForm(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date <span className="required">*</span></label>
                    <input
                      type="date"
                      name="date"
                      value={newRecord.date}
                      onChange={handleRecordChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      placeholder="Age"
                      value={newRecord.age}
                      onChange={handleRecordChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Physician</label>
                    <input
                      type="text"
                      name="physician"
                      placeholder="Physician Name"
                      value={newRecord.physician}
                      onChange={handleRecordChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nurse</label>
                    <input
                      type="text"
                      name="nurse"
                      placeholder="Nurse Name"
                      value={newRecord.nurse}
                      onChange={handleRecordChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">P.E. FINDINGS</h3>
                <div className="form-row form-row-4">
                  <div className="form-group">
                    <label>HT (Height)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        name="height"
                        placeholder="e.g., 170"
                        value={newRecord.height}
                        onChange={handleRecordChange}
                        min="0"
                        step="0.1"
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontWeight: '500', color: '#666' }}>cm</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>WT (Weight)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        name="weight"
                        placeholder="e.g., 65"
                        value={newRecord.weight}
                        onChange={handleRecordChange}
                        min="0"
                        step="0.1"
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontWeight: '500', color: '#666' }}>kg</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>BP (Blood Pressure)</label>
                    <input
                      type="text"
                      name="bloodPressure"
                      placeholder="e.g., 120/80"
                      value={newRecord.bloodPressure}
                      onChange={handleRecordChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>LMP (for female)</label>
                    <input
                      type="date"
                      name="lmp"
                      placeholder="Last Menstrual Period"
                      value={newRecord.lmp}
                      onChange={handleRecordChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Clinical Assessment</h3>
                <div className="form-group">
                  <label>DIAGNOSIS <span className="required">*</span></label>
                  <textarea
                    name="diagnosis"
                    placeholder="Enter diagnosis..."
                    value={newRecord.diagnosis}
                    onChange={handleRecordChange}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>TREATMENT <span className="required">*</span></label>
                  <textarea
                    name="treatment"
                    placeholder="Enter treatment plan..."
                    value={newRecord.treatment}
                    onChange={handleRecordChange}
                    rows="3"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    name="notes"
                    placeholder="Any additional notes..."
                    value={newRecord.notes}
                    onChange={handleRecordChange}
                    rows="2"
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="prescription-section-header">
                  <h3 className="form-section-title"><FaPills /> Prescriptions</h3>
                  <button type="button" className="add-prescription-btn" onClick={handleAddPrescription}>
                    <FaPlus /> Add Medication
                  </button>
                </div>

                {prescriptions.length > 0 && (
                  <div className="prescriptions-form-list">
                    {prescriptions.map((rx, index) => (
                      <div key={index} className="prescription-form-item">
                        <div className="prescription-item-header">
                          <span className="prescription-number">Medication #{index + 1}</span>
                          <button 
                            type="button" 
                            className="remove-prescription-btn"
                            onClick={() => handleRemovePrescription(index)}
                          >
                            <FaTrash /> Remove
                          </button>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Select from Inventory (Optional)</label>
                            <select
                              value={rx.itemId}
                              onChange={(e) => handlePrescriptionChange(index, 'itemId', e.target.value)}
                            >
                              <option value="">-- Manual Entry / Not in Stock --</option>
                              {inventoryItems
                                .filter(item => item.category === 'Medicine' && item.quantity > 0)
                                .map(item => (
                                  <option key={item._id} value={item._id}>
                                    {item.name} (Available: {item.quantity})
                                  </option>
                                ))}
                            </select>
                            {rx.itemId && (
                              <small className="form-hint">
                                Will be dispensed from inventory when saved
                              </small>
                            )}
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Medication Name <span className="required">*</span></label>
                            <input
                              type="text"
                              value={rx.medication}
                              onChange={(e) => handlePrescriptionChange(index, 'medication', e.target.value)}
                              placeholder="e.g., Biogesic"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Dosage <span className="required">*</span></label>
                            <input
                              type="text"
                              value={rx.dosage}
                              onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                              placeholder="e.g., 500mg"
                              required
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group">
                            <label>Frequency</label>
                            <input
                              type="text"
                              value={rx.frequency}
                              onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                              placeholder="e.g., 3 times a day"
                            />
                          </div>
                          {rx.itemId && (
                            <div className="form-group">
                              <label>Quantity to Dispense <span className="required">*</span></label>
                              <input
                                type="number"
                                min="1"
                                value={rx.quantity}
                                onChange={(e) => handlePrescriptionChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                placeholder="1"
                              />
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Instructions</label>
                          <textarea
                            value={rx.instructions}
                            onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                            placeholder="e.g., Take after meals"
                            rows="2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="ehr-modal-actions">
                <button className="ehr-btn cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button className="ehr-btn save-btn" onClick={handleAddRecord}>
                  Save Record
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showDetailsModal && selectedVisit && (
          <div className="ehr-modal">
            <div className="ehr-modal-content">
              <div className="modal-header">
                <h2>Complete Medical Record</h2>
                <button className="close-modal-btn" onClick={() => setShowDetailsModal(false)}>
                  <FaTimes />
                </button>
              </div>

              {/* Visit Date */}
              <div className="form-section">
                <h3 className="form-section-title">Visit Information</h3>
                <div className="detail-row">
                  <span className="detail-label"><FaCalendar /> Visit Date:</span>
                  <span className="detail-value">{new Date(selectedVisit.date).toLocaleDateString()}</span>
                </div>
                {selectedVisit.appointmentId && (
                  <div className="detail-row">
                    <span className="detail-label">Source:</span>
                    <span className="detail-value appointment-badge">From Appointment</span>
                  </div>
                )}
                {selectedVisit.addedBy && (
                  <div className="detail-row">
                    <span className="detail-label">Added By:</span>
                    <span className="detail-value">{selectedVisit.addedBy.name || 'Staff'}</span>
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="form-section">
                <h3 className="form-section-title">Basic Information</h3>
                {selectedVisit.age && (
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{selectedVisit.age} years</span>
                  </div>
                )}
                {selectedVisit.physician && (
                  <div className="detail-row">
                    <span className="detail-label">Physician:</span>
                    <span className="detail-value">{selectedVisit.physician}</span>
                  </div>
                )}
                {selectedVisit.nurse && (
                  <div className="detail-row">
                    <span className="detail-label">Nurse:</span>
                    <span className="detail-value">{selectedVisit.nurse}</span>
                  </div>
                )}
              </div>

              {/* PE Findings */}
              {(selectedVisit.height || selectedVisit.weight || selectedVisit.bloodPressure || selectedVisit.lmp) && (
                <div className="form-section">
                  <h3 className="form-section-title">P.E. FINDINGS</h3>
                  <div className="details-grid">
                    {selectedVisit.height && (
                      <div className="detail-box">
                        <span className="detail-label">Height (HT)</span>
                        <span className="detail-value">{selectedVisit.height}</span>
                      </div>
                    )}
                    {selectedVisit.weight && (
                      <div className="detail-box">
                        <span className="detail-label">Weight (WT)</span>
                        <span className="detail-value">{selectedVisit.weight}</span>
                      </div>
                    )}
                    {selectedVisit.bloodPressure && (
                      <div className="detail-box">
                        <span className="detail-label">Blood Pressure (BP)</span>
                        <span className="detail-value">{selectedVisit.bloodPressure}</span>
                      </div>
                    )}
                    {selectedVisit.lmp && (
                      <div className="detail-box">
                        <span className="detail-label">LMP (for female)</span>
                        <span className="detail-value">{selectedVisit.lmp}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vital Signs */}
              {selectedVisit.vitalSigns && (
                <div className="form-section">
                  <h3 className="form-section-title"><FaHeartbeat /> Vital Signs</h3>
                  <div className="details-grid">
                    {selectedVisit.vitalSigns.bloodPressure && (
                      <div className="detail-box">
                        <span className="detail-label">Blood Pressure</span>
                        <span className="detail-value">{selectedVisit.vitalSigns.bloodPressure}</span>
                      </div>
                    )}
                    {selectedVisit.vitalSigns.temperature && (
                      <div className="detail-box">
                        <span className="detail-label">Temperature</span>
                        <span className="detail-value">{selectedVisit.vitalSigns.temperature}</span>
                      </div>
                    )}
                    {selectedVisit.vitalSigns.heartRate && (
                      <div className="detail-box">
                        <span className="detail-label">Heart Rate</span>
                        <span className="detail-value">{selectedVisit.vitalSigns.heartRate}</span>
                      </div>
                    )}
                    {selectedVisit.vitalSigns.weight && (
                      <div className="detail-box">
                        <span className="detail-label">Weight</span>
                        <span className="detail-value">{selectedVisit.vitalSigns.weight}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Clinical Assessment */}
              <div className="form-section">
                <h3 className="form-section-title">Clinical Assessment</h3>
                {selectedVisit.diagnosis && (
                  <div className="detail-section">
                    <h4><FaStethoscope /> Diagnosis</h4>
                    <p className="detail-text">{selectedVisit.diagnosis}</p>
                  </div>
                )}
                {selectedVisit.treatment && (
                  <div className="detail-section">
                    <h4><FaNotesMedical /> Treatment</h4>
                    <p className="detail-text">{selectedVisit.treatment}</p>
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              {selectedVisit.prescriptions && selectedVisit.prescriptions.length > 0 && (
                <div className="form-section">
                  <h3 className="form-section-title"><FaPills /> Prescriptions</h3>
                  <div className="prescriptions-details-list">
                    {selectedVisit.prescriptions.map((rx, idx) => (
                      <div key={idx} className="prescription-detail-card">
                        <div className="prescription-detail-header">
                          <FaPills className="prescription-icon" />
                          <span className="prescription-name">{rx.medication}</span>
                        </div>
                        <div className="prescription-detail-body">
                          <div className="prescription-detail-item">
                            <span className="label">Dosage:</span>
                            <span className="value">{rx.dosage}</span>
                          </div>
                          {rx.frequency && (
                            <div className="prescription-detail-item">
                              <span className="label">Frequency:</span>
                              <span className="value">{rx.frequency}</span>
                            </div>
                          )}
                          {rx.instructions && (
                            <div className="prescription-detail-item">
                              <span className="label">Instructions:</span>
                              <span className="value">{rx.instructions}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedVisit.notes && (
                <div className="form-section">
                  <h3 className="form-section-title">Additional Notes</h3>
                  <p className="detail-text notes-text">{selectedVisit.notes}</p>
                </div>
              )}

              <div className="ehr-modal-actions">
                <button className="ehr-btn cancel-btn" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EHR;