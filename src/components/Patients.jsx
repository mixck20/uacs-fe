import React, { useEffect, useState } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Patients.css";
import { FaEnvelope, FaSearch, FaPlus, FaFileExport, FaUpload, FaTimes, FaUser, FaPhone, FaMapMarkerAlt, FaAllergies, FaNotesMedical, FaEdit, FaTrash, FaUserCheck, FaUserClock, FaFilter, FaEye, FaFilePdf, FaFileExcel, FaArchive, FaUndo } from "react-icons/fa";
import { PatientsAPI } from "../api";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const Patients = ({ setActivePage, activePage, patients, setPatients, sidebarOpen, setSidebarOpen, onLogout, user }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'registered', 'walkins'
  const [showArchived, setShowArchived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submit
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [patientToArchive, setPatientToArchive] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');
  const [form, setForm] = useState({
    surname: "",
    firstName: "",
    middleName: "",
    email: "",
    cellNumber: "",
    birthday: "",
    birthplace: "",
    sex: "",
    religion: "",
    address: "",
    patientType: "student", // student, faculty, staff, visitor
    course: "",
    yearLevel: "",
    section: "",
    department: "",
    fatherName: "",
    motherName: "",
    spouseName: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyAddress: "",
    emergencyCel: "",
  });

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const filteredPatients = patients.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (p.fullName || p.name || '').toLowerCase().includes(searchLower) ||
      (p.email || '').toLowerCase().includes(searchLower) ||
      (p.userId?.department || p.department || '').toLowerCase().includes(searchLower) ||
      (p.userId?.course || p.course || '').toLowerCase().includes(searchLower) ||
      (p.userId?.yearLevel || p.yearLevel || '').toString().toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    // Load patients with current filter and archived status
    PatientsAPI.list(filterType, searchTerm, showArchived).then(setPatients).catch(err => {
      console.error(err);
      Swal.fire({ title: "Failed to load patients", text: err.message, icon: "error" });
    });
  }, [setPatients, filterType, searchTerm, showArchived]);

  async function handleAddPatient(e) {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    if (!form.surname || !form.firstName || !form.birthday || !form.sex) {
      Swal.fire({ 
        title: "Missing Required Fields", 
        text: "Please fill in Surname, First Name, Birthday, and Sex", 
        icon: "warning" 
      });
      return;
    }

    // Email is required for student, faculty, and staff only
    if (['student', 'faculty', 'staff'].includes(form.patientType) && !form.email) {
      Swal.fire({ 
        title: "Missing Required Field", 
        text: "Email is required for students, faculty, and staff", 
        icon: "warning" 
      });
      return;
    }

    // Validate email format only if email is provided and not a visitor
    if (form.email && form.patientType !== 'visitor') {
      const emailRegex = /^[^\s@]+@ua\.edu\.ph$/i;
      if (!emailRegex.test(form.email)) {
        Swal.fire({ 
          title: "Invalid Email", 
          text: "Please use a valid school email (@ua.edu.ph) for students, faculty, and staff", 
          icon: "warning" 
        });
        return;
      }
    }

    setIsSubmitting(true); // Disable button
    try {
      const fullName = `${form.surname}, ${form.firstName}${form.middleName ? ' ' + form.middleName : ''}`;
      const payload = {
        surname: form.surname.trim(),
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        fullName: fullName,
        email: form.email ? form.email.trim().toLowerCase() : "", // Email optional for visitors
        contactNumber: form.cellNumber || "",
        cellNumber: form.cellNumber || "",
        dateOfBirth: form.birthday,
        birthplace: form.birthplace || "",
        gender: form.sex,
        religion: form.religion || "",
        address: form.address || "",
        patientType: form.patientType, // student, faculty, staff, visitor
        // Academic info - only for students
        ...(form.patientType === 'student' && form.course ? { course: form.course } : {}),
        ...(form.patientType === 'student' && form.yearLevel ? { yearLevel: form.yearLevel } : {}),
        ...(form.patientType === 'student' && form.section ? { section: form.section.toUpperCase() } : {}),
        // Department - only for faculty
        ...(form.patientType === 'faculty' && form.department ? { department: form.department } : {}),
        fatherName: form.fatherName || "",
        motherName: form.motherName || "",
        spouseName: form.spouseName || "",
        emergencyContact: {
          name: form.emergencyName || "",
          relationship: form.emergencyRelationship || "",
          address: form.emergencyAddress || "",
          phone: form.emergencyCel || "",
          cellNumber: form.emergencyCel || "",
        },
      };
      const created = await PatientsAPI.create(payload);
      setPatients(prev => [created, ...prev]);
      setForm({
        surname: "",
        firstName: "",
        middleName: "",
        email: "",
        cellNumber: "",
        birthday: "",
        birthplace: "",
        sex: "",
        religion: "",
        address: "",
        patientType: "student",
        course: "",
        yearLevel: "",
        section: "",
        department: "",
        fatherName: "",
        motherName: "",
        spouseName: "",
        emergencyName: "",
        emergencyRelationship: "",
        emergencyAddress: "",
        emergencyCel: "",
      });
      setShowForm(false);
      Swal.fire({ title: "Patient added successfully!", icon: "success", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Failed to add patient", text: err.message, icon: "error" });
    } finally {
      setIsSubmitting(false); // Re-enable button
    }
  }

  async function handleExportToExcel() {
    try {
      const dataToExport = filteredPatients.map((patient, index) => ({
        'No.': index + 1,
        'Student ID': patient.studentId || patient.schoolId || 'N/A',
        'Full Name': patient.fullName || patient.name || 'N/A',
        'Email': patient.email || 'N/A',
        'Gender': patient.gender || 'N/A',
        'Date of Birth': patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A',
        'Contact Number': patient.contactNumber || patient.contact || 'N/A',
        'Department': patient.department || patient.userId?.department || 'N/A',
        'Address': patient.address || 'N/A',
        'Emergency Contact': patient.emergencyContact?.name || 'N/A',
        'Emergency Phone': patient.emergencyContact?.phone || 'N/A',
        'Registered': patient.isRegisteredUser ? 'Yes' : 'No',
        'Total Visits': patient.visits ? patient.visits.length : 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patients");

      // Auto-size columns
      const maxWidth = 30;
      const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length, 10))
      }));
      worksheet['!cols'] = colWidths;

      const fileName = `Patients_List_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      Swal.fire({
        title: "Export Successful!",
        text: `${filteredPatients.length} patients exported to Excel`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ title: "Export Failed", text: err.message, icon: "error" });
    }
  }

  async function handleExportToPDF() {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Try to add UA school logo on the left (if available)
      try {
        const logo = new Image();
        logo.src = '/UA-Logo (1).png'; // University of the Assumption logo
        await new Promise((resolve, reject) => {
          logo.onload = () => resolve();
          logo.onerror = () => reject();
        });
        doc.addImage(logo, 'PNG', 15, 15, 25, 25);
      } catch (logoError) {
        console.log('Logo could not be loaded, continuing without it');
      }

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("UNIVERSITY OF THE ASSUMPTION", pageWidth / 2, yPos + 5, { align: "center" });
      yPos += 13;
      doc.setFontSize(14);
      doc.setTextColor(60);
      doc.text("Patient Records List", pageWidth / 2, yPos, { align: "center" });
      yPos += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Summary
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Patients: ${filteredPatients.length}`, 20, yPos);
      yPos += 6;
      const registered = filteredPatients.filter(p => p.isRegisteredUser).length;
      doc.setFont("helvetica", "normal");
      doc.text(`Registered Users: ${registered}`, 20, yPos);
      yPos += 6;
      doc.text(`Walk-ins: ${filteredPatients.length - registered}`, 20, yPos);
      yPos += 10;

      doc.setDrawColor(229, 29, 94);
      doc.line(20, yPos, pageWidth - 20, yPos);
      yPos += 10;

      // Patient List
      filteredPatients.forEach((patient, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${patient.fullName || patient.name || 'N/A'}`, 20, yPos);
        yPos += 6;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        const details = [
          `Email: ${patient.email || 'N/A'}`,
          `Gender: ${patient.gender || 'N/A'}`,
          `Contact: ${patient.contactNumber || patient.contact || 'N/A'}`,
        ];

        if (patient.department || patient.userId?.department) {
          details.push(`Department: ${patient.department || patient.userId?.department}`);
        }

        if (patient.visits && patient.visits.length > 0) {
          details.push(`Visits: ${patient.visits.length} records`);
        }

        if (patient.isRegisteredUser) {
          doc.setTextColor(16, 185, 129);
          doc.text(`[Registered User]`, 25, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 5;
        }

        details.forEach(detail => {
          doc.text(detail, 25, yPos);
          yPos += 5;
        });

        yPos += 3;
        doc.setDrawColor(220, 220, 220);
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 8;
      });

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | UA Clinic System`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      const fileName = `Patients_List_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Swal.fire({
        title: "Export Successful!",
        text: `${filteredPatients.length} patients exported to PDF`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({ title: "Export Failed", text: err.message, icon: "error" });
    }
  }

  function handleExport() {
    Swal.fire({
      title: "Export Patients",
      text: "Choose export format:",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: '<i class="fa fa-file-excel"></i> Export to Excel',
      cancelButtonText: '<i class="fa fa-file-pdf"></i> Export to PDF',
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#e51d5e",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        handleExportToExcel();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        handleExportToPDF();
      }
    });
  }

  function handleArchivePatient(patient) {
    setPatientToArchive(patient);
    setShowArchiveModal(true);
    setArchiveReason('');
    setArchiveNotes('');
  }

  async function confirmArchive() {
    if (!archiveReason) {
      Swal.fire({ 
        title: "Reason Required", 
        text: "Please select a reason for archiving", 
        icon: "warning" 
      });
      return;
    }

    try {
      await PatientsAPI.archive(patientToArchive._id, archiveReason, archiveNotes);
      setPatients(prev => prev.filter(p => p._id !== patientToArchive._id));
      setShowArchiveModal(false);
      setPatientToArchive(null);
      Swal.fire({
        title: "Patient Archived!",
        text: `${patientToArchive.fullName} has been archived successfully.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        title: "Archive Failed",
        text: error.message || "Failed to archive patient",
        icon: "error"
      });
    }
  }

  async function handleRestorePatient(patient) {
    const result = await Swal.fire({
      title: `Restore Patient: ${patient.fullName}`,
      text: "This will restore the patient record and make it active again.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Restore",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981"
    });

    if (result.isConfirmed) {
      try {
        await PatientsAPI.restore(patient._id);
        setPatients(prev => prev.filter(p => p._id !== patient._id));
        Swal.fire({
          title: "Patient Restored!",
          text: `${patient.fullName} has been restored successfully.`,
          icon: "success",
          timer: 2000
        });
      } catch (error) {
        Swal.fire({
          title: "Restore Failed",
          text: error.message || "Failed to restore patient",
          icon: "error"
        });
      }
    }
  }

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={user} />
      <div className="clinic-content">
        {/* Header Section */}
        <div className="patients-header">
          <div>
            <h1 className="patients-title">Patient Management</h1>
            <p className="patients-subtitle">Manage and view all patient records</p>
          </div>
          <div className="patients-header-actions">
            <button className="patients-btn patients-btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Add Patient
            </button>
            <button className="patients-btn patients-btn-secondary">
              <FaUpload /> Bulk Upload
            </button>
            <button className="patients-btn patients-btn-secondary" onClick={handleExport}>
              <FaFileExport /> Export
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="patients-search-container">
          <FaSearch className="patients-search-icon" />
          <input
            className="patients-search"
            placeholder="Search by name, email, department, course, or year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="patients-filter-tabs">
          <button 
            className={`patients-filter-tab ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            <FaUser /> All Patients
          </button>
          <button 
            className={`patients-filter-tab ${filterType === 'registered' ? 'active' : ''}`}
            onClick={() => setFilterType('registered')}
          >
            <FaUserCheck /> Registered Users
          </button>
          <button 
            className={`patients-filter-tab ${filterType === 'walkins' ? 'active' : ''}`}
            onClick={() => setFilterType('walkins')}
          >
            <FaUserClock /> Walk-ins
          </button>
          <button 
            className={`patients-filter-tab ${showArchived ? 'active' : ''}`}
            onClick={() => setShowArchived(!showArchived)}
            style={{ marginLeft: 'auto', backgroundColor: showArchived ? '#6b7280' : '#f3f4f6', color: showArchived ? 'white' : '#374151' }}
          >
            <FaArchive /> {showArchived ? 'Viewing Archived' : 'View Archived'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="patients-stats">
          <div className="patients-stat-card">
            <div className="patients-stat-number">{patients.length}</div>
            <div className="patients-stat-label">Total Patients</div>
          </div>
          <div className="patients-stat-card">
            <div className="patients-stat-number">{patients.filter(p => p.isRegisteredUser).length}</div>
            <div className="patients-stat-label">Registered Users</div>
          </div>
          <div className="patients-stat-card">
            <div className="patients-stat-number">{patients.filter(p => !p.isRegisteredUser).length}</div>
            <div className="patients-stat-label">Walk-ins</div>
          </div>
          <div className="patients-stat-card">
            <div className="patients-stat-number">{patients.filter(p => p.visits && p.visits.length > 0).length}</div>
            <div className="patients-stat-label">Students</div>
          </div>
          <div className="patients-stat-card">
            <div className="patients-stat-number">{patients.filter(p => p.role === 'Faculty').length}</div>
            <div className="patients-stat-label">Faculty</div>
          </div>
        </div>

        {/* Patients Grid */}
        <div className="patients-grid">
          {filteredPatients.map((patient) => (
            <div className="patient-card" key={patient._id || patient.id}>
              <div className="patient-card-header">
                <div className="patient-avatar">
                  <FaUser />
                </div>
                <div className="patient-header-actions">
                  {patient.isRegisteredUser && (
                    <span className="patient-registered-badge" title="Has User Account">
                      <FaUserCheck /> Registered
                    </span>
                  )}
                  <button 
                    className="patient-action-icon"
                    onClick={() => setSelectedPatient(patient)}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                </div>
              </div>
              <div className="patient-card-body">
                <h3 className="patient-name">{patient.fullName || patient.name}</h3>
                <div className="patient-info-row">
                  <span className="patient-label">Email:</span>
                  <span className="patient-value">{patient.email}</span>
                </div>
                {(patient.userId?.department || patient.department) && (
                  <div className="patient-info-row">
                    <span className="patient-label">Department:</span>
                    <span className="patient-value">{patient.userId?.department || patient.department}</span>
                  </div>
                )}
                <div className="patient-info-row">
                  <span className="patient-label">Gender:</span>
                  <span className="patient-value">{patient.gender || 'N/A'}</span>
                </div>
                <div className="patient-info-row">
                  <span className="patient-label">Visits:</span>
                  <span className="patient-value">{patient.visits ? patient.visits.length : 0} records</span>
                </div>
              </div>
              <div className="patient-card-actions">
                <button 
                  className="patient-view-btn"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <FaEye /> View Details
                </button>
                {showArchived ? (
                  <button 
                    className="patient-restore-btn"
                    onClick={() => handleRestorePatient(patient)}
                    title="Restore patient record"
                  >
                    <FaUndo /> Restore
                  </button>
                ) : (
                  <button 
                    className="patient-archive-btn"
                    onClick={() => handleArchivePatient(patient)}
                    title="Archive patient record"
                  >
                    <FaArchive /> Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="patients-empty">
            <p>No patients found matching "{searchTerm}"</p>
          </div>
        )}

        {/* Add Patient Modal */}
        {showForm && (
          <div className="patients-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="patients-modal" onClick={(e) => e.stopPropagation()}>
              <div className="patients-modal-header">
                <h2>Add New Patient</h2>
                <button className="patients-modal-close" onClick={() => setShowForm(false)}>
                  <FaTimes />
                </button>
              </div>
              <form className="patients-modal-form" onSubmit={handleAddPatient}>
                {/* Patient Type Selector - First Step */}
                <div className="form-section">
                  <h3 className="form-section-title">Patient Type <span className="required">*</span></h3>
                  <div className="patient-type-cards">
                    <div 
                      className={`patient-type-card ${form.patientType === 'student' ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, patientType: 'student' })}
                    >
                      <div className="patient-type-label">Student</div>
                      <div className="patient-type-desc">University students</div>
                    </div>
                    <div 
                      className={`patient-type-card ${form.patientType === 'faculty' ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, patientType: 'faculty' })}
                    >
                      <div className="patient-type-label">Faculty</div>
                      <div className="patient-type-desc">Teaching staff</div>
                    </div>
                    <div 
                      className={`patient-type-card ${form.patientType === 'staff' ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, patientType: 'staff' })}
                    >
                      <div className="patient-type-label">Staff</div>
                      <div className="patient-type-desc">Security, maintenance, admin</div>
                    </div>
                    <div 
                      className={`patient-type-card ${form.patientType === 'visitor' ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, patientType: 'visitor' })}
                    >
                      <div className="patient-type-label">Visitor/Other</div>
                      <div className="patient-type-desc">Walk-in patients</div>
                    </div>
                  </div>
                  <p className="form-note">
                    <small>Select the type of patient to continue</small>
                  </p>
                </div>

                {/* Show personal information only after patient type is selected */}
                {form.patientType && (
                  <>
                    <div className="form-section">
                      <h3 className="form-section-title">Personal Information</h3>
                      <div className="patients-form-grid">
                        <div className="patients-form-group">
                          <label>Surname <span className="required">*</span></label>
                          <input
                            type="text"
                            name="surname"
                            placeholder="Enter surname"
                            value={form.surname}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="patients-form-group">
                          <label>First Name <span className="required">*</span></label>
                          <input
                            type="text"
                            name="firstName"
                            placeholder="Enter first name"
                            value={form.firstName}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="patients-form-group">
                          <label>Middle Name</label>
                          <input
                            type="text"
                            name="middleName"
                            placeholder="Enter middle name"
                            value={form.middleName}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>

                      <div className="patients-form-grid">
                        <div className="patients-form-group">
                          <label>
                            {form.patientType === 'visitor' ? 'Email' : 'School Email'} 
                            {form.patientType !== 'visitor' && <span className="required">*</span>}
                          </label>
                          <input
                            type="email"
                            name="email"
                            placeholder={
                              form.patientType === 'visitor' 
                                ? "Enter email (optional)" 
                                : "Enter school email (@ua.edu.ph)"
                            }
                            value={form.email}
                            onChange={handleFormChange}
                            required={form.patientType !== 'visitor'}
                          />
                        </div>
                    <div className="patients-form-group">
                      <label>Contact Number</label>
                      <input
                        type="text"
                        name="cellNumber"
                        placeholder="Enter contact number"
                        value={form.cellNumber}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>

                  <div className="patients-form-grid">
                    <div className="patients-form-group">
                      <label>Birthday <span className="required">*</span></label>
                      <input
                        type="date"
                        name="birthday"
                        value={form.birthday}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    <div className="patients-form-group">
                      <label>Birthplace</label>
                      <input
                        type="text"
                        name="birthplace"
                        placeholder="Enter birthplace"
                        value={form.birthplace}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="patients-form-group">
                      <label>Sex <span className="required">*</span></label>
                      <select name="sex" value={form.sex} onChange={handleFormChange} required>
                        <option value="">Select sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="patients-form-grid">
                    <div className="patients-form-group">
                      <label>Religion</label>
                      <input
                        type="text"
                        name="religion"
                        placeholder="Enter religion"
                        value={form.religion}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="patients-form-group patients-form-group-full">
                      <label>Address</label>
                      <input
                        type="text"
                        name="address"
                        placeholder="Enter complete address"
                        value={form.address}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Academic/Department Information */}
                {form.patientType === 'student' && (
                  <div className="form-section">
                    <h3 className="form-section-title">Academic Information (Student)</h3>
                    <div className="patients-form-grid">
                    <div className="patients-form-group">
                      <label>Course</label>
                      <select 
                        name="course" 
                        value={form.course} 
                        onChange={handleFormChange}
                      >
                        <option value="">Select course</option>
                        <option value="BSIT">BSIT - BS Information Technology</option>
                        <option value="BSCS">BSCS - BS Computer Science</option>
                        <option value="BSN">BSN - BS Nursing</option>
                        <option value="BSPharm">BSPharm - BS Pharmacy</option>
                        <option value="BSBA">BSBA - BS Business Administration</option>
                        <option value="BSA">BSA - BS Accountancy</option>
                        <option value="BSMA">BSMA - BS Management Accounting</option>
                        <option value="BSHM">BSHM - BS Hospitality Management</option>
                        <option value="BSTM">BSTM - BS Tourism Management</option>
                        <option value="BSCE">BSCE - BS Civil Engineering</option>
                        <option value="BSArch">BSArch - BS Architecture</option>
                        <option value="BSEE">BSEE - BS Electrical Engineering</option>
                        <option value="BSECE">BSECE - BS Electronics Engineering</option>
                        <option value="BSME">BSME - BS Mechanical Engineering</option>
                        <option value="BSED">BSED - BS Secondary Education</option>
                        <option value="BEED">BEED - BS Elementary Education</option>
                        <option value="BPEd">BPEd - Bachelor of Physical Education</option>
                        <option value="AB-Psych">AB-Psych - AB Psychology</option>
                        <option value="AB-PolSci">AB-PolSci - AB Political Science</option>
                        <option value="BSCrim">BSCrim - BS Criminology</option>
                        <option value="BSND">BSND - BS Nutrition and Dietetics</option>
                        <option value="BSMT">BSMT - BS Medical Technology</option>
                        <option value="BSPT">BSPT - BS Physical Therapy</option>
                        <option value="BSRT">BSRT - BS Radiologic Technology</option>
                        <option value="BSMidwifery">BSMidwifery - BS Midwifery</option>
                        <option value="BSPharma">BSPharma - BS Pharmaceutical Sciences</option>
                        <option value="BSDS">BSDS - BS Data Science</option>
                      </select>
                    </div>
                    <div className="patients-form-group">
                      <label>Year Level</label>
                      <select 
                        name="yearLevel" 
                        value={form.yearLevel} 
                        onChange={handleFormChange}
                      >
                        <option value="">Select year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="5">5th Year</option>
                      </select>
                    </div>
                    <div className="patients-form-group">
                      <label>Section</label>
                      <input
                        type="text"
                        name="section"
                        placeholder="e.g., A, B, C"
                        value={form.section}
                        onChange={handleFormChange}
                        maxLength="1"
                      />
                    </div>
                  </div>
                  <p className="form-note">
                    <small>For walk-in student patients only. If patient has an account, this will be auto-populated from their registration.</small>
                  </p>
                </div>
                )}

                {form.patientType === 'faculty' && (
                  <div className="form-section">
                    <h3 className="form-section-title">Department (Faculty)</h3>
                    <div className="patients-form-grid">
                      <div className="patients-form-group patients-form-group-full">
                        <label>Department <span className="required">*</span></label>
                        <select 
                          name="department" 
                          value={form.department} 
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Select department</option>
                          <option value="College of Accountancy">College of Accountancy</option>
                          <option value="College of Hospitality and Tourism Management">College of Hospitality and Tourism Management</option>
                          <option value="School of Business and Public Administration">School of Business and Public Administration</option>
                          <option value="Institute of Theology and Religious Studies">Institute of Theology and Religious Studies</option>
                          <option value="School of Education">School of Education</option>
                          <option value="College of Nursing and Pharmacy">College of Nursing and Pharmacy</option>
                          <option value="School of Arts and Sciences">School of Arts and Sciences</option>
                          <option value="College of Engineering and Architecture">College of Engineering and Architecture</option>
                          <option value="College of Information Technology">College of Information Technology</option>
                        </select>
                      </div>
                    </div>
                    <p className="form-note">
                      <small>Select the academic department this faculty member belongs to.</small>
                    </p>
                  </div>
                )}

                {(form.patientType === 'staff' || form.patientType === 'visitor') && (
                  <div className="form-section">
                    <p className="form-note" style={{ textAlign: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                      <small><strong>Staff/Visitor:</strong> No additional academic information required. Please continue with Family and Emergency Contact information below.</small>
                    </p>
                  </div>
                )}

                <div className="form-section">
                  <h3 className="form-section-title">Family Information</h3>
                  <div className="patients-form-grid">
                    <div className="patients-form-group">
                      <label>Name of Father</label>
                      <input
                        type="text"
                        name="fatherName"
                        placeholder="Enter father's name"
                        value={form.fatherName}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="patients-form-group">
                      <label>Name of Mother</label>
                      <input
                        type="text"
                        name="motherName"
                        placeholder="Enter mother's name"
                        value={form.motherName}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="patients-form-group">
                      <label>Name of Spouse (if any)</label>
                      <input
                        type="text"
                        name="spouseName"
                        placeholder="Enter spouse's name"
                        value={form.spouseName}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="form-section-title">In case of emergency please notify:</h3>
                  <div className="patients-form-grid">
                    <div className="patients-form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="emergencyName"
                        placeholder="Enter emergency contact name"
                        value={form.emergencyName}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="patients-form-group">
                      <label>Relationship</label>
                      <input
                        type="text"
                        name="emergencyRelationship"
                        placeholder="e.g., Parent, Sibling"
                        value={form.emergencyRelationship}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="patients-form-group patients-form-group-full">
                      <label>Address</label>
                      <input
                        type="text"
                        name="emergencyAddress"
                        placeholder="Enter emergency contact address"
                        value={form.emergencyAddress}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div className="patients-form-group">
                      <label>Contact Number</label>
                      <input
                        type="text"
                        name="emergencyCel"
                        placeholder="Enter contact number"
                        value={form.emergencyCel}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                </div>
                  </>
                )}

                <div className="patients-modal-actions">
                  <button type="button" className="patients-btn-cancel" onClick={() => setShowForm(false)} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="patients-btn-save" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Patient Details Modal */}
        {selectedPatient && (
          <div className="patients-modal-overlay" onClick={() => setSelectedPatient(null)}>
            <div className="patients-modal patients-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="patients-modal-header">
                <h2>Patient Details</h2>
                <button className="patients-modal-close" onClick={() => setSelectedPatient(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="patient-details">
                <div className="patient-details-header">
                  <div className="patient-details-avatar">
                    <FaUser />
                  </div>
                  <div className="patient-details-info">
                    <h2>{selectedPatient.fullName || selectedPatient.name}</h2>
                  </div>
                </div>

                <div className="patient-details-grid">
                  <div className="patient-details-section">
                    <h3><FaUser /> Personal Information</h3>
                    <div className="patient-details-row">
                      <span className="detail-label">Date of Birth:</span>
                      <span className="detail-value">
                        {selectedPatient.dateOfBirth 
                          ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() 
                          : selectedPatient.birthDate 
                          ? new Date(selectedPatient.birthDate).toLocaleDateString()
                          : selectedPatient.dob || 'N/A'}
                      </span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Gender:</span>
                      <span className="detail-value">{selectedPatient.sex || selectedPatient.gender || 'N/A'}</span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Department:</span>
                      <span className="detail-value">
                        {/* Check userId first (registered), then patient's own (walk-in) */}
                        {selectedPatient.userId?.department || selectedPatient.department || 'N/A'}
                      </span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Course/Year/Section:</span>
                      <span className="detail-value">
                        {/* Check userId first (registered users), then patient's own fields (walk-ins) */}
                        {selectedPatient.userId?.course && selectedPatient.userId?.yearLevel
                          ? `${selectedPatient.userId.course} ${selectedPatient.userId.yearLevel}${selectedPatient.userId.section ? selectedPatient.userId.section : ''}`
                          : selectedPatient.course && selectedPatient.yearLevel
                          ? `${selectedPatient.course} ${selectedPatient.yearLevel}${selectedPatient.section ? selectedPatient.section : ''}`
                          : selectedPatient.userId?.courseYear || selectedPatient.courseYearSection || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="patient-details-section">
                    <h3><FaPhone /> Contact Information</h3>
                    <div className="patient-details-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedPatient.contactNumber || selectedPatient.contact || 'N/A'}</span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedPatient.email || 'N/A'}</span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{selectedPatient.address || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="patient-details-section">
                    <h3><FaPhone /> Emergency Contact</h3>
                    <div className="patient-details-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">
                        {selectedPatient.emergencyContact?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Relationship:</span>
                      <span className="detail-value">
                        {selectedPatient.emergencyContact?.relationship || 'N/A'}
                      </span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">
                        {selectedPatient.emergencyContact?.phone || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="patient-details-section">
                    <h3><FaAllergies /> Medical Information</h3>
                    <div className="patient-details-row">
                      <span className="detail-label">Allergies:</span>
                      <span className="detail-value">
                        {Array.isArray(selectedPatient.allergies) && selectedPatient.allergies.length > 0
                          ? selectedPatient.allergies.join(', ')
                          : 'None reported'}
                      </span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Medical History:</span>
                      <span className="detail-value">
                        {Array.isArray(selectedPatient.medicalHistory) && selectedPatient.medicalHistory.length > 0
                          ? selectedPatient.medicalHistory.join(', ')
                          : 'None recorded'}
                      </span>
                    </div>
                    <div className="patient-details-row">
                      <span className="detail-label">Current Medications:</span>
                      <span className="detail-value">
                        {Array.isArray(selectedPatient.medications) && selectedPatient.medications.length > 0
                          ? selectedPatient.medications.join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedPatient.notes && (
                  <div className="patient-details-notes">
                    <h3><FaNotesMedical /> Additional Notes</h3>
                    <p>{selectedPatient.notes}</p>
                  </div>
                )}
              </div>
              <div className="patients-modal-footer">
                <button className="patients-btn patients-btn-secondary" onClick={() => setSelectedPatient(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archive Patient Modal */}
        {showArchiveModal && patientToArchive && (
          <div className="patients-modal-overlay" onClick={() => setShowArchiveModal(false)}>
            <div className="patients-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div className="patients-modal-header">
                <h2>Archive Patient: {patientToArchive.fullName}</h2>
                <button className="patients-modal-close" onClick={() => setShowArchiveModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="patients-modal-form" style={{ padding: '20px' }}>
                <div className="patients-form-group">
                  <label>Reason for Archiving: <span className="required">*</span></label>
                  <select 
                    value={archiveReason} 
                    onChange={(e) => setArchiveReason(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select a reason</option>
                    <option value="graduated">Student Graduated</option>
                    <option value="duplicate">Duplicate Record</option>
                    <option value="inactive">Inactive/Long Period</option>
                    <option value="entry_error">Entry Error</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="patients-form-group">
                  <label>Additional Notes (Optional):</label>
                  <textarea
                    value={archiveNotes}
                    onChange={(e) => setArchiveNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    rows="4"
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                  />
                </div>
                <div className="patients-modal-actions">
                  <button 
                    type="button" 
                    className="patients-btn-cancel" 
                    onClick={() => setShowArchiveModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="patients-btn-save" 
                    onClick={confirmArchive}
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;