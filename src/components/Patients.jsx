import React, { useEffect, useState } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Patients.css";
import { FaEnvelope } from "react-icons/fa";
import { PatientsAPI } from "../api";
import Swal from "sweetalert2";

const Patients = ({ setActivePage, activePage, patients, setPatients, sidebarOpen, setSidebarOpen, onLogout }) => {
  // Form state for adding new patient
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    schoolId: "",
    dob: "",
    gender: "",
    role: "Student",
    courseYear: "",
    contact: "",
    address: "",
    guardian: "",
    guardianContact: "",
    allergies: "",
    notes: "",
    emailUpdates: false,
  });

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    // initial load
    PatientsAPI.list().then(setPatients).catch(err => {
      console.error(err);
      Swal.fire({ title: "Failed to load patients", text: err.message, icon: "error" });
    });
  }, [setPatients]);

  async function handleAddPatient(e) {
    e.preventDefault();
    if (!form.name || !form.schoolId || !form.dob || !form.gender) return;
    try {
      const payload = {
        studentId: form.schoolId.trim(),
        fullName: form.name.trim(),
        gender: form.gender,
        dateOfBirth: form.dob,
        email: `${form.schoolId.trim()}@student.edu`, // Generate a default email
        contactNumber: form.contact || "",
        address: form.address || "",
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        emergencyContact: {
          name: form.guardian || "",
          relationship: "Guardian",
          phone: form.guardianContact || "",
        },
        medicalHistory: [],
        medications: [],
        role: form.role,
        courseYear: form.courseYear || "",
        notes: form.notes || "",
      };
      const created = await PatientsAPI.create(payload);
      setPatients(prev => [created, ...prev]);
      setForm({
        name: "",
        schoolId: "",
        dob: "",
        gender: "",
        role: "Student",
        courseYear: "",
        contact: "",
        address: "",
        guardian: "",
        guardianContact: "",
        allergies: "",
        notes: "",
        emailUpdates: false,
      });
      Swal.fire({ title: "Patient added", icon: "success", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Failed to add patient", text: err.message, icon: "error" });
    }
  }

  return (
    <div>
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <div className="clinic-content">
        <div className="clinic-title">PATIENTS</div>
        <input
          className="patients-search"
          placeholder="Search by Name, School ID, Course"
        />

        <div className="patients-table-card">
          <div className="patients-table-header">
            <span>PATIENT TABLE</span>
            <span className="patients-view-link" onClick={() => setShowFullList(true)}>View Full List &gt;&gt;</span>
          </div>
          <div className="patients-table">
            <div className="patients-table-row patients-table-row-header">
              <div>Name</div>
              <div>School ID</div>
              <div>Date of Birth</div>
              <div>Gender</div>
              <div>Course/Year</div>
              <div>Contact</div>
              <div>Allergies/Medical History</div>
              <div>View</div>
            </div>
            {/* Patient rows */}
            {patients.map((p) => (
              <div className="patients-table-row" key={p._id || p.id}>
                <div>{p.fullName || p.name}</div>
                <div>{p.schoolId}</div>
                <div>{p.birthDate ? new Date(p.birthDate).toLocaleDateString() : p.dob}</div>
                <div>{p.sex || p.gender}</div>
                <div>{p.courseYear || '-'}</div>
                <div>{p.contactNumber || p.contact}</div>
                <div>{Array.isArray(p.allergies) ? p.allergies.join(', ') : p.allergies}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="patients-form-submit" onClick={() => setShowFullList(true)} style={{ minHeight: 36 }}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="patients-actions-row">
          <button className="patients-action-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'HIDE NEW PATIENT' : 'ADD NEW PATIENT'}
          </button>
          <button className="patients-action-btn">BULK UPLOAD</button>
          <button className="patients-action-btn">EXPORT TO PDF/EXCEL</button>
        </div>

        {showForm && (
        <div className="patients-form-card">
          <div className="patients-form-title">NEW PATIENT</div>
          <form className="patients-form" onSubmit={handleAddPatient}>
            <div className="patients-form-row">
              <input className="patients-input" name="name" placeholder="Student Name" value={form.name} onChange={handleFormChange} required />
              <input className="patients-input" name="schoolId" placeholder="School ID / Student Number" value={form.schoolId} onChange={handleFormChange} required />
              <input className="patients-input" name="dob" type="date" placeholder="mm/dd/yyyy" value={form.dob} onChange={handleFormChange} />
            </div>
            <div className="patients-form-row">
              <select className="patients-input" name="gender" value={form.gender} onChange={handleFormChange}>
                <option value="">Sex / Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select className="patients-input" name="role" value={form.role} onChange={handleFormChange}>
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
              </select>
            </div>
            <div className="patients-form-row">
              <input className="patients-input" name="courseYear" placeholder="Course / Year Level" value={form.courseYear} onChange={handleFormChange} />
              <input className="patients-input" name="contact" placeholder="Contact Information (phone/email)" value={form.contact} onChange={handleFormChange} />
              <input className="patients-input" name="address" placeholder="Address (optional)" value={form.address} onChange={handleFormChange} />
            </div>
            <div className="patients-form-row">
              <input className="patients-input" name="guardian" placeholder="Guardian/Parent Name (optional)" value={form.guardian} onChange={handleFormChange} />
              <input className="patients-input" name="guardianContact" placeholder="Guardian Contact (optional)" value={form.guardianContact} onChange={handleFormChange} />
              <input className="patients-input" name="allergies" placeholder="Allergies / Medical History (optional)" value={form.allergies} onChange={handleFormChange} />
            </div>
            <div className="patients-form-row">
              <input className="patients-input" name="notes" placeholder="Other Notes (optional)" value={form.notes} onChange={handleFormChange} />
            </div>
            <div className="patients-form-row-checkbox">
              <label className="patients-checkbox-label">
                <input
                  type="checkbox"
                  name="emailUpdates"
                  checked={form.emailUpdates}
                  onChange={(e) => setForm({...form, emailUpdates: e.target.checked})}
                  className="patients-checkbox"
                />
                <FaEnvelope /> I would like to receive email updates and notifications from the School Clinic.
              </label>
            </div>
            <div className="patients-form-row">
              <button className="patients-form-submit" type="submit">
                ADD NEW PATIENT
              </button>
            </div>
          </form>
        </div>
        )}

        {showFullList && (
          <div className="patients-form-card">
            <div className="patients-form-title">FULL PATIENT LIST</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ textAlign: 'left', padding: 10 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>School ID</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Date of Birth</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Gender</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Course/Year</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Contact</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Address</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Blood Type</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Allergies</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Emergency Contact</th>
                    <th style={{ textAlign: 'left', padding: 10 }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p._id || p.id}>
                      <td style={{ padding: 10 }}>{p.fullName || p.name}</td>
                      <td style={{ padding: 10 }}>{p.schoolId}</td>
                      <td style={{ padding: 10 }}>{p.birthDate ? new Date(p.birthDate).toLocaleDateString() : ''}</td>
                      <td style={{ padding: 10 }}>{p.sex}</td>
                      <td style={{ padding: 10 }}>{p.courseYear || ''}</td>
                      <td style={{ padding: 10 }}>{p.contactNumber || ''}</td>
                      <td style={{ padding: 10 }}>{p.address || ''}</td>
                      <td style={{ padding: 10 }}>{p.bloodType || ''}</td>
                      <td style={{ padding: 10 }}>{Array.isArray(p.allergies) ? p.allergies.join(', ') : ''}</td>
                      <td style={{ padding: 10 }}>{p.emergencyContact ? `${p.emergencyContact.name || ''} ${p.emergencyContact.phone || ''}` : ''}</td>
                      <td style={{ padding: 10 }}>{p.notes || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button className="patients-form-submit" onClick={() => setShowFullList(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;