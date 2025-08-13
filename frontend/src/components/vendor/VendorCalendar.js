import React from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';

const VendorCalendar = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">Manage your availability and bookings</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <Plus className="w-4 h-4" />
          Block Time
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to manage your availability and view upcoming bookings in a calendar format.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorCalendar;