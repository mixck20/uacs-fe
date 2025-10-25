import React, { useState, useEffect } from 'react';
import { AppointmentsAPI } from '../api';
import AppointmentCard from '../components/AppointmentCard';

const ClinicAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await AppointmentsAPI.list();
      setAppointments(response);
    } catch (err) {
      setError('Failed to load appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAppointments = () => {
    fetchAppointments();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <span className="block sm:inline">{error}</span>
        <button
          onClick={refreshAppointments}
          className="text-indigo-600 hover:text-indigo-800 ml-4"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clinic Appointments</h1>
        <button
          onClick={refreshAppointments}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicAppointments;