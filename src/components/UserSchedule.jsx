import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserPortalLayout from './UserPortalLayout';
import './UserSchedule.css';

const API_URL = 'https://uacs-be.vercel.app/api';

const UserSchedule = ({ user, onLogout }) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <UserPortalLayout user={user} onLogout={onLogout} currentPage="schedule">
        <div className="loading-container">Loading clinic schedule...</div>
      </UserPortalLayout>
    );
  }

  return (
    <UserPortalLayout user={user} onLogout={onLogout}>
      <div className="user-schedule">
      <div className="user-schedule-header">
        <h1>Medical and Dental Clinic Schedule</h1>
        <p>View the current clinic staff and doctor schedules</p>
        {schedule?.lastUpdated && (
          <p style={{ fontSize: '12px', marginTop: '5px' }}>
            Last updated: {new Date(schedule.lastUpdated).toLocaleDateString()} at{' '}
            {new Date(schedule.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="user-schedule-sections">
        {/* Staff Schedule Section */}
        <div className="user-schedule-section">
          <div className="user-section-header">
            <h2>Medical and Dental Clinic Staff Schedule</h2>
          </div>

          {/* Physicians */}
          <div className="user-subsection">
            <h3>University Physicians</h3>
            {schedule?.staffSchedules?.filter(s => s.role === 'physician').length > 0 ? (
              <table className="user-schedule-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Day of Duty</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.staffSchedules
                    .filter(s => s.role === 'physician')
                    .map((staff, index) => (
                      <tr key={staff._id || index}>
                        <td><strong>{staff.name}</strong></td>
                        <td>{staff.dayOfDuty || 'Not specified'}</td>
                        <td>{staff.time || 'Not specified'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="no-schedule">No physician schedules available at this time</div>
            )}
          </div>

          {/* Nurses */}
          <div className="user-subsection">
            <h3>University Nurses</h3>
            {schedule?.staffSchedules?.filter(s => s.role === 'nurse').length > 0 ? (
              <table className="user-schedule-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.staffSchedules
                    .filter(s => s.role === 'nurse')
                    .map((staff, index) => (
                      <tr key={staff._id || index}>
                        <td><strong>{staff.name}</strong></td>
                        <td>{staff.designation || 'Not specified'}</td>
                        <td>
                          <div className="schedule-text">
                            {staff.schedule || 'Not specified'}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="no-schedule">No nurse schedules available at this time</div>
            )}
          </div>
        </div>

        {/* Doctor Examination Schedule Section */}
        <div className="user-schedule-section">
          <div className="user-section-header">
            <h2>Medical and Dental Examinations Schedule</h2>
          </div>

          {/* Physicians */}
          <div className="user-subsection">
            <h3>Physicians</h3>
            {schedule?.doctorSchedules?.filter(d => d.type === 'physician').length > 0 ? (
              <table className="user-schedule-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Regular Schedule</th>
                    <th>Medical Examination Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.doctorSchedules
                    .filter(d => d.type === 'physician')
                    .map((doctor, index) => (
                      <tr key={doctor._id || index}>
                        <td><strong>{doctor.name}</strong></td>
                        <td>
                          <div className="schedule-text">
                            {doctor.regularSchedule || 'Not specified'}
                          </div>
                        </td>
                        <td>
                          <div className="schedule-text">
                            {doctor.medicalExaminationSchedule || 'Not specified'}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="no-schedule">No physician examination schedules available at this time</div>
            )}
          </div>

          {/* Dentists */}
          <div className="user-subsection">
            <h3>Dentists</h3>
            {schedule?.doctorSchedules?.filter(d => d.type === 'dentist').length > 0 ? (
              <table className="user-schedule-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Regular Schedule</th>
                    <th>Medical Examination Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.doctorSchedules
                    .filter(d => d.type === 'dentist')
                    .map((doctor, index) => (
                      <tr key={doctor._id || index}>
                        <td><strong>{doctor.name}</strong></td>
                        <td>
                          <div className="schedule-text">
                            {doctor.regularSchedule || 'Not specified'}
                          </div>
                        </td>
                        <td>
                          <div className="schedule-text">
                            {doctor.medicalExaminationSchedule || 'Not specified'}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div className="no-schedule">No dentist examination schedules available at this time</div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="user-schedule-section" style={{ background: '#f0f8ff', borderLeft: '4px solid #00539C' }}>
          <p style={{ margin: 0, color: '#00539C' }}>
            <strong>Note:</strong> Schedules are subject to change. Please contact the clinic for the most up-to-date information or if you have any questions about appointments.
          </p>
        </div>
      </div>
    </div>
    </UserPortalLayout>
  );
};

export default UserSchedule;
