import React from 'react';
import { BarChart3 } from 'lucide-react';

const VendorAnalytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Track your business performance and insights</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard Coming Soon</h3>
          <p className="text-gray-600">
            This feature will provide detailed analytics about your bookings, revenue, client satisfaction, and business growth.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;