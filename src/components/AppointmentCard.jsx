import React from 'react';

const AppointmentCard = ({ appointment }) => {
  const isOnlineConsultation = appointment.type === 'Consultation' && 
                              appointment.consultationType === 'Online';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{appointment.type}</h3>
          <p className="text-gray-600">Patient ID: {appointment.patientId}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{appointment.date}</p>
          <p className="text-sm text-gray-500">{appointment.time}</p>
        </div>
      </div>

      {isOnlineConsultation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm font-medium text-blue-800 mb-1">Online Consultation</p>
          {appointment.meetLink ? (
            <a 
              href={appointment.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              Join Google Meet
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <p className="text-sm text-gray-600">Meet link will be generated soon...</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-gray-500">Reason</p>
          <p className="text-gray-700">{appointment.reason}</p>
        </div>
        {appointment.notes && (
          <div>
            <p className="text-sm font-medium text-gray-500">Notes</p>
            <p className="text-gray-700">{appointment.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Status: <span className="font-medium">{appointment.status || 'Scheduled'}</span>
        </p>
        {appointment.consultationType && (
          <p className="text-sm text-gray-500">
            Type: <span className="font-medium">{appointment.consultationType}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;