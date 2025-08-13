import React from 'react';
import { Camera, Edit } from 'lucide-react';

const VendorProfile = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your business profile and portfolio</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <Edit className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Management Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to manage your business profile, upload portfolio images, and update your service offerings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;