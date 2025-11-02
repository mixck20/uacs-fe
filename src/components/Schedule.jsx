import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import ClinicNavbar from './ClinicNavbar';
import './Schedule.css';

const API_URL = 'https://uacs-be.vercel.app/api';

const Schedule = ({ setActivePage, activePage, sidebarOpen, setSidebarOpen, onLogout, user }) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'physician',
    designation: '',
    dayOfDuty: '',
    startTime: '',
    endTime: '',
    time: '',
    schedule: ''
  });
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    type: 'physician',
    regularSchedule: '',
    medicalExaminationSchedule: ''
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please enter staff name',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Combine startTime and endTime for physicians/dentists
      const staffData = { ...newStaff };
      if (newStaff.role === 'physician' || newStaff.role === 'dentist') {
        if (newStaff.startTime && newStaff.endTime) {
          staffData.time = `${newStaff.startTime} - ${newStaff.endTime}`;
        }
      }
      
      const response = await axios.post(`${API_URL}/schedule/staff`, staffData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Staff added successfully:', response.data);
      setShowStaffModal(false);
      setNewStaff({
        name: '',
        role: 'physician',
        designation: '',
        dayOfDuty: '',
        startTime: '',
        endTime: '',
        time: '',
        schedule: ''
      });
      fetchSchedule();
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Staff schedule added successfully!',
        confirmButtonColor: '#e51d5e'
      });
    } catch (error) {
      console.error('Error adding staff:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error adding staff schedule';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleUpdateStaff = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/schedule/staff/${id}`, editingStaff, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingStaff(null);
      fetchSchedule();
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Staff schedule updated successfully',
        confirmButtonColor: '#e51d5e',
        timer: 2000
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error updating staff schedule',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleDeleteStaff = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Staff Schedule?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e51d5e',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/schedule/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchedule();
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Staff schedule has been deleted',
        confirmButtonColor: '#e51d5e',
        timer: 2000
      });
    } catch (error) {
      console.error('Error deleting staff:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error deleting staff schedule',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please enter doctor name',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/schedule/doctor`, newDoctor, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Doctor added successfully:', response.data);
      setShowDoctorModal(false);
      setNewDoctor({
        name: '',
        type: 'physician',
        regularSchedule: '',
        medicalExaminationSchedule: ''
      });
      fetchSchedule();
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Doctor schedule added successfully!',
        confirmButtonColor: '#e51d5e'
      });
    } catch (error) {
      console.error('Error adding doctor:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error adding doctor schedule';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleUpdateDoctor = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/schedule/doctor/${id}`, editingDoctor, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingDoctor(null);
      fetchSchedule();
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Doctor schedule updated successfully',
        confirmButtonColor: '#e51d5e',
        timer: 2000
      });
    } catch (error) {
      console.error('Error updating doctor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error updating doctor schedule',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const handleDeleteDoctor = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Doctor Schedule?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e51d5e',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/schedule/doctor/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSchedule();
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Doctor schedule has been deleted',
        confirmButtonColor: '#e51d5e',
        timer: 2000
      });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error deleting doctor schedule',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  if (loading) {
    return (
      <div className="clinic-container">
        <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={user} />
        <div className="clinic-content">
          <div className="loading-message">Loading schedule...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <div className="clinic-content">
        <div className="schedule-header">
          <div className="header-content">
            <h1 className="schedule-title">Medical and Dental Clinic Schedule Management</h1>
            {schedule?.lastUpdated && (
              <p className="schedule-subtitle">
                Last updated: {new Date(schedule.lastUpdated).toLocaleString()}
                {schedule.updatedBy && ` by ${schedule.updatedBy.name}`}
              </p>
            )}
          </div>
        </div>

      <div className="schedule-sections">
        {/* Staff Schedule Section */}
        <div className="schedule-section">
          <div className="section-header">
            <h2>Medical and Dental Clinic Staff Schedule</h2>
            <button className="add-btn" onClick={() => setShowStaffModal(true)}>
              + Add Staff
            </button>
          </div>

          {/* Physicians */}
          <h3 className="subsection-title">University Physicians</h3>
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Day of Duty</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule?.staffSchedules?.filter(s => s.role === 'physician').length > 0 ? (
                schedule.staffSchedules
                  .filter(s => s.role === 'physician')
                  .map((staff) => (
                    <tr key={staff._id}>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <input
                            type="text"
                            className="edit-input"
                            value={editingStaff.name}
                            onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                          />
                        ) : (
                          staff.name
                        )}
                      </td>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <input
                            type="text"
                            className="edit-input"
                            value={editingStaff.dayOfDuty}
                            onChange={(e) => setEditingStaff({ ...editingStaff, dayOfDuty: e.target.value })}
                          />
                        ) : (
                          staff.dayOfDuty
                        )}
                      </td>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <input
                            type="text"
                            className="edit-input"
                            value={editingStaff.time}
                            onChange={(e) => setEditingStaff({ ...editingStaff, time: e.target.value })}
                          />
                        ) : (
                          staff.time
                        )}
                      </td>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <div className="action-buttons">
                            <button className="save-btn" onClick={() => handleUpdateStaff(staff._id)}>
                              Save
                            </button>
                            <button className="cancel-btn" onClick={() => setEditingStaff(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => setEditingStaff(staff)}>
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteStaff(staff._id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No physicians added yet</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Nurses */}
          <h3 className="subsection-title">University Nurses</h3>
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Schedule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule?.staffSchedules?.filter(s => s.role === 'nurse').length > 0 ? (
                schedule.staffSchedules
                  .filter(s => s.role === 'nurse')
                  .map((staff) => (
                    <tr key={staff._id}>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <input
                            type="text"
                            className="edit-input"
                            value={editingStaff.name}
                            onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                          />
                        ) : (
                          staff.name
                        )}
                      </td>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <input
                            type="text"
                            className="edit-input"
                            value={editingStaff.designation}
                            onChange={(e) => setEditingStaff({ ...editingStaff, designation: e.target.value })}
                          />
                        ) : (
                          staff.designation
                        )}
                      </td>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <textarea
                            className="edit-textarea"
                            value={editingStaff.schedule}
                            onChange={(e) => setEditingStaff({ ...editingStaff, schedule: e.target.value })}
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-line' }}>{staff.schedule}</div>
                        )}
                      </td>
                      <td>
                        {editingStaff?._id === staff._id ? (
                          <div className="action-buttons">
                            <button className="save-btn" onClick={() => handleUpdateStaff(staff._id)}>
                              Save
                            </button>
                            <button className="cancel-btn" onClick={() => setEditingStaff(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => setEditingStaff(staff)}>
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteStaff(staff._id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No nurses added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Doctor Examination Schedule Section */}
        <div className="schedule-section">
          <div className="section-header">
            <h2>Medical and Dental Examinations Schedule</h2>
            <button className="add-btn" onClick={() => setShowDoctorModal(true)}>
              + Add Doctor
            </button>
          </div>

          {/* Physicians */}
          <h3 className="subsection-title">Physicians</h3>
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Regular Schedule</th>
                <th>Medical Examination Schedule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule?.doctorSchedules?.filter(d => d.type === 'physician').length > 0 ? (
                schedule.doctorSchedules
                  .filter(d => d.type === 'physician')
                  .map((doctor) => (
                    <tr key={doctor._id}>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <input
                            type="text"
                            className="edit-input"
                            value={editingDoctor.name}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                          />
                        ) : (
                          doctor.name
                        )}
                      </td>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <textarea
                            className="edit-textarea"
                            value={editingDoctor.regularSchedule}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, regularSchedule: e.target.value })}
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-line' }}>{doctor.regularSchedule}</div>
                        )}
                      </td>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <textarea
                            className="edit-textarea"
                            value={editingDoctor.medicalExaminationSchedule}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, medicalExaminationSchedule: e.target.value })}
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-line' }}>{doctor.medicalExaminationSchedule}</div>
                        )}
                      </td>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <div className="action-buttons">
                            <button className="save-btn" onClick={() => handleUpdateDoctor(doctor._id)}>
                              Save
                            </button>
                            <button className="cancel-btn" onClick={() => setEditingDoctor(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => setEditingDoctor(doctor)}>
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteDoctor(doctor._id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No physicians added yet</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Dentists */}
          <h3 className="subsection-title">Dentists</h3>
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Regular Schedule</th>
                <th>Medical Examination Schedule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule?.doctorSchedules?.filter(d => d.type === 'dentist').length > 0 ? (
                schedule.doctorSchedules
                  .filter(d => d.type === 'dentist')
                  .map((doctor) => (
                    <tr key={doctor._id}>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <input
                            type="text"
                            className="edit-input"
                            value={editingDoctor.name}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                          />
                        ) : (
                          doctor.name
                        )}
                      </td>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <textarea
                            className="edit-textarea"
                            value={editingDoctor.regularSchedule}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, regularSchedule: e.target.value })}
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-line' }}>{doctor.regularSchedule}</div>
                        )}
                      </td>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <textarea
                            className="edit-textarea"
                            value={editingDoctor.medicalExaminationSchedule}
                            onChange={(e) => setEditingDoctor({ ...editingDoctor, medicalExaminationSchedule: e.target.value })}
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-line' }}>{doctor.medicalExaminationSchedule}</div>
                        )}
                      </td>
                      <td>
                        {editingDoctor?._id === doctor._id ? (
                          <div className="action-buttons">
                            <button className="save-btn" onClick={() => handleUpdateDoctor(doctor._id)}>
                              Save
                            </button>
                            <button className="cancel-btn" onClick={() => setEditingDoctor(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button className="edit-btn" onClick={() => setEditingDoctor(doctor)}>
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDeleteDoctor(doctor._id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No dentists added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showStaffModal && (
        <div className="modal-overlay" onClick={() => setShowStaffModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Staff Schedule</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              >
                <option value="physician">Physician</option>
                <option value="nurse">Nurse</option>
              </select>
            </div>
            {newStaff.role === 'physician' ? (
              <>
                <div className="form-group">
                  <label>Day of Duty</label>
                  <select
                    value={newStaff.dayOfDuty}
                    onChange={(e) => setNewStaff({ ...newStaff, dayOfDuty: e.target.value })}
                  >
                    <option value="">Select day(s)</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Monday and Tuesday">Monday and Tuesday</option>
                    <option value="Wednesday and Thursday">Wednesday and Thursday</option>
                    <option value="Monday - Friday">Monday - Friday</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newStaff.startTime || ''}
                    onChange={(e) => setNewStaff({ ...newStaff, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newStaff.endTime || ''}
                    onChange={(e) => setNewStaff({ ...newStaff, endTime: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Designation</label>
                  <select
                    value={newStaff.designation}
                    onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                  >
                    <option value="">Select designation</option>
                    <option value="Grade School Clinic">Grade School Clinic</option>
                    <option value="High School Clinic">High School Clinic</option>
                    <option value="College Clinic">College Clinic</option>
                    <option value="Main Clinic">Main Clinic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Schedule</label>
                  <select
                    value={newStaff.schedule}
                    onChange={(e) => setNewStaff({ ...newStaff, schedule: e.target.value })}
                  >
                    <option value="">Select schedule</option>
                    <option value="Monday - Friday&#10;7:30 AM - 4:30 PM">Monday - Friday, 7:30 AM - 4:30 PM</option>
                    <option value="Monday - Friday&#10;8:00 AM - 5:00 PM">Monday - Friday, 8:00 AM - 5:00 PM</option>
                    <option value="Monday - Friday&#10;7:00 AM - 3:00 PM">Monday - Friday, 7:00 AM - 3:00 PM</option>
                  </select>
                </div>
              </>
            )}
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowStaffModal(false)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleAddStaff} disabled={!newStaff.name}>
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showDoctorModal && (
        <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Doctor Schedule</h3>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Type *</label>
              <select
                value={newDoctor.type}
                onChange={(e) => setNewDoctor({ ...newDoctor, type: e.target.value })}
              >
                <option value="physician">Physician</option>
                <option value="dentist">Dentist</option>
              </select>
            </div>
            <div className="form-group">
              <label>Regular Schedule</label>
              <select
                value={newDoctor.regularSchedule}
                onChange={(e) => setNewDoctor({ ...newDoctor, regularSchedule: e.target.value })}
              >
                <option value="">Select schedule</option>
                <option value="Monday&#10;8:00 AM - 12:00 PM">Monday, 8:00 AM - 12:00 PM</option>
                <option value="Tuesday&#10;8:00 AM - 12:00 PM">Tuesday, 8:00 AM - 12:00 PM</option>
                <option value="Wednesday&#10;8:00 AM - 12:00 PM">Wednesday, 8:00 AM - 12:00 PM</option>
                <option value="Thursday&#10;8:00 AM - 12:00 PM">Thursday, 8:00 AM - 12:00 PM</option>
                <option value="Friday&#10;8:00 AM - 12:00 PM">Friday, 8:00 AM - 12:00 PM</option>
                <option value="Monday&#10;1:00 PM - 5:00 PM">Monday, 1:00 PM - 5:00 PM</option>
                <option value="Wednesday&#10;8:00 AM - 1:00 PM">Wednesday, 8:00 AM - 1:00 PM</option>
              </select>
            </div>
            <div className="form-group">
              <label>Medical Examination Schedule</label>
              <select
                value={newDoctor.medicalExaminationSchedule}
                onChange={(e) => setNewDoctor({ ...newDoctor, medicalExaminationSchedule: e.target.value })}
              >
                <option value="">Select schedule</option>
                <option value="Monday (walk in)&#10;9:00 AM - 12:00 PM">Monday (walk in), 9:00 AM - 12:00 PM</option>
                <option value="Tuesday (walk in)&#10;9:00 AM - 12:00 PM">Tuesday (walk in), 9:00 AM - 12:00 PM</option>
                <option value="Wednesday (walk in)&#10;9:00 AM - 2:00 PM">Wednesday (walk in), 9:00 AM - 2:00 PM</option>
                <option value="Thursday (walk in)&#10;9:00 AM - 12:00 PM">Thursday (walk in), 9:00 AM - 12:00 PM</option>
                <option value="Friday (walk in)&#10;9:00 AM - 12:00 PM">Friday (walk in), 9:00 AM - 12:00 PM</option>
              </select>
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowDoctorModal(false)}>
                Cancel
              </button>
              <button className="submit-btn" onClick={handleAddDoctor} disabled={!newDoctor.name}>
                Add Doctor
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Schedule;
