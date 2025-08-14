import React from 'react';
import { User, Edit } from 'lucide-react';

const EmployeeProfile = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
          <p className="text-gray-600">Manage your personal and professional information</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          <Edit className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Employee Profile Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to manage your personal information, emergency contacts, skills, certifications, and professional development goals.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;