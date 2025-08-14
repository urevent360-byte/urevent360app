import React from 'react';
import { Target, Plus } from 'lucide-react';

const SalesTracking = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Tracking</h1>
          <p className="text-gray-600">Track your sales performance and targets</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          <Plus className="w-4 h-4" />
          Log Sale
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Tracking Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to track sales targets, log achievements, monitor commission earnings, and analyze your sales performance over time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesTracking;