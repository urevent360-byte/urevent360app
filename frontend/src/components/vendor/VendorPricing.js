import React from 'react';
import { DollarSign, Edit } from 'lucide-react';

const VendorPricing = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
          <p className="text-gray-600">Manage your service pricing and packages</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <Edit className="w-4 h-4" />
          Update Pricing
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Pricing Management Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to set and manage pricing for your services, create packages, and handle custom quotes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorPricing;