import React, { useState } from 'react';
import { AppointmentsAPI } from '../api';

const AppointmentForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    time: '',
    type: 'Consultation',
    consultationType: 'In-Person',
    reason: '',
    notes: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AppointmentsAPI.create(formData);
      if (response) {
        onSuccess?.(response);
        // Reset form
        setFormData({
          patientId: '',
          date: '',
          time: '',
          type: 'Consultation',
          consultationType: 'In-Person',
          reason: '',
          notes: ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Patient ID
        </label>
        <input
          type="text"
          name="patientId"
          value={formData.patientId}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Time
        </label>
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="Checkup">Checkup</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Emergency">Emergency</option>
          <option value="Consultation">Consultation</option>
        </select>
      </div>

      {formData.type === 'Consultation' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Consultation Type
          </label>
          <select
            name="consultationType"
            value={formData.consultationType}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="In-Person">In-Person</option>
            <option value="Online">Online</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Reason
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create Appointment'}
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;