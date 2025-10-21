import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./EHR.css";

// Helper to get JWT token
const getToken = () => localStorage.getItem("token") || "";

function EHR({ setActivePage, activePage, sidebarOpen, setSidebarOpen, onLogout }) {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // EHR record form state
  const [newRecord, setNewRecord] = useState({
    date: "",
    complaint: "",
    vitals: {
      bp: "",
      temp: "",
      pulse: "",
    },
    diagnosis: "",
    treatment: "",
    prescriptions: "",
    tests: [],
    followUp: "",
    staff: "",
    notes: "",
  });

  // --- Fetch patients from backend on mount ---
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log('Fetching patients...');
        const token = getToken();
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const response = await fetch("https://uacs-be.vercel.app/api/patients", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Successfully fetched ${data.length} patients`);
        setPatients(data || []);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setPatients([]);
      }
    };

    fetchPatients();
  }, []);

  // --- Fetch health record for selected patient ---
  function fetchPatientRecord(patientId) {
    fetch(`/api/records/${patientId}`, {
      headers: {
        "Authorization": `Bearer ${getToken()}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("No record found for patient");
        return res.json();
      })
      .then(record => {
        setSelectedPatient(prev => ({
          ...prev,
          history: record.visits || []
        }));
      })
      .catch(err => {
        setSelectedPatient(prev => ({ ...prev, history: [] }));
        // Optionally display message if not found
      });
  }

  // --- Handle patient selection ---
  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setShowForm(false);
    fetchPatientRecord(patient._id || patient.id);
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
    if (["bp", "temp", "pulse"].includes(name)) {
      setNewRecord({
        ...newRecord,
        vitals: { ...newRecord.vitals, [name]: value },
      });
    } else {
      setNewRecord({ ...newRecord, [name]: value });
    }
  }

  // --- Add a new medical record via backend ---
  function handleAddRecord() {
    if (!selectedPatient) return;

    if (
      !newRecord.date ||
      !newRecord.complaint ||
      !newRecord.diagnosis ||
      !newRecord.treatment
    ) {
      alert("Please fill in all required fields for the medical record.");
      return;
    }

    fetch(`/api/records/${selectedPatient._id || selectedPatient.id}/visits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getToken()}`
      },
      body: JSON.stringify(newRecord)
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to add record");
        return res.json();
      })
      .then(record => {
        // Update history from backend response
        setSelectedPatient({
          ...selectedPatient,
          history: record.visits || []
        });

        // Optionally update patients array
        setPatients(patients.map(p =>
          (p._id || p.id) === (selectedPatient._id || selectedPatient.id) ?
            { ...p, history: record.visits || [] } :
            p
        ));

        // Reset form
        setNewRecord({
          date: "",
          complaint: "",
          vitals: { bp: "", temp: "", pulse: "" },
          diagnosis: "",
          treatment: "",
          prescriptions: "",
          tests: [],
          followUp: "",
          staff: "",
          notes: "",
        });
        setShowForm(false);
      })
      .catch(err => alert(err.message));
  }

  function handleExportPDF() {
    alert("Export to PDF functionality will go here.");
  }

  // --- Filter patients by search ---
  const filteredPatients = patients.filter(p =>
    ((p.fullName || p.name || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <div className="clinic-content">
        <h1 className="ehr-title">Electronic Health Records</h1>

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
            <h2>Patients</h2>
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
                  {p.fullName || p.name}
                </div>
              ))
            )}
          </div>

          <div className="ehr-records">
            <div className="ehr-actions">
              <button className="ehr-btn" onClick={() => setShowForm(true)}>
                Add Record
              </button>
              <button className="ehr-btn" onClick={handleExportPDF}>
                Export as PDF
              </button>
            </div>
            {selectedPatient ? (
              <>
                <h2>{(selectedPatient.fullName || selectedPatient.name) + "'s"} Medical History</h2>
                {(!selectedPatient.history || selectedPatient.history.length === 0) ? (
                  <p className="ehr-empty">No medical history available.</p>
                ) : (
                  selectedPatient.history.map((rec, index) => (
                    <div key={index} className="ehr-record">
                      <h3>Visit on {rec.date}</h3>
                      <p><strong>Complaint:</strong> {rec.complaint}</p>
                      <p>
                        <strong>Vitals:</strong>
                        {` BP: ${rec.vitals?.bp || "-"}, Temp: ${rec.vitals?.temp || "-"}, Pulse: ${rec.vitals?.pulse || "-"}`}
                      </p>
                      <p><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                      <p><strong>Treatment:</strong> {rec.treatment}</p>
                      <p><strong>Prescriptions:</strong> {rec.prescriptions}</p>
                      {rec.tests.length > 0 && (
                        <div>
                          <strong>Test Results:</strong>
                          <ul>
                            {rec.tests.map((file, idx) => (
                              <li key={idx}>{file}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p><strong>Follow-up:</strong> {rec.followUp}</p>
                      <p><strong>Attending Nurse/Doctor:</strong> {rec.staff}</p>
                      <p><strong>Notes:</strong> {rec.notes}</p>
                    </div>
                  ))
                )}
              </>
            ) : (
              <p className="ehr-empty">Select a patient to view and add records.</p>
            )}
          </div>
        </div>

        {/* Add Record Modal */}
        {showForm && (
          <div className="ehr-modal">
            <div className="ehr-modal-content">
              <h2>Add New Record</h2>
              <input
                type="date"
                name="date"
                placeholder="Visit Date"
                value={newRecord.date}
                onChange={handleRecordChange}
                required
              />
              <input
                type="text"
                name="complaint"
                placeholder="Complaint / Reason for Visit"
                value={newRecord.complaint}
                onChange={handleRecordChange}
                required
              />
              <div className="ehr-vitals-row">
                <input
                  type="text"
                  name="bp"
                  placeholder="Blood Pressure"
                  value={newRecord.vitals.bp}
                  onChange={handleRecordChange}
                />
                <input
                  type="text"
                  name="temp"
                  placeholder="Temperature"
                  value={newRecord.vitals.temp}
                  onChange={handleRecordChange}
                />
                <input
                  type="text"
                  name="pulse"
                  placeholder="Pulse"
                  value={newRecord.vitals.pulse}
                  onChange={handleRecordChange}
                />
              </div>
              <textarea
                type="text"
                name="diagnosis"
                placeholder="Diagnosis"
                value={newRecord.diagnosis}
                onChange={handleRecordChange}
                rows="2"
                required
              />
              <textarea
                type="text"
                name="treatment"
                placeholder="Treatment"
                value={newRecord.treatment}
                onChange={handleRecordChange}
                rows="2"
                required
              />
              <textarea
                type="text"
                name="prescriptions"
                placeholder="Prescriptions"
                value={newRecord.prescriptions}
                onChange={handleRecordChange}
                rows="2"
              />
              <textarea
                type="text"
                name="followUp"
                placeholder="Follow-up / Next Steps"
                value={newRecord.followUp}
                onChange={handleRecordChange}
                rows="2"
              />
              <input
                type="text"
                name="staff"
                placeholder="Attending Nurse/Doctor"
                value={newRecord.staff}
                onChange={handleRecordChange}
              />
              <textarea
                type="text"
                name="notes"
                placeholder="Additional Notes (optional)"
                value={newRecord.notes}
                onChange={handleRecordChange}
                rows="3"
              />
              <input type="file" multiple onChange={handleFileUpload} />
              <div className="ehr-modal-actions">
                <button className="ehr-btn" onClick={handleAddRecord}>
                  Save
                </button>
                <button className="ehr-btn" onClick={() => setShowForm(false)}>
                  Cancel
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