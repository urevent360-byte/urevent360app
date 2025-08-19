import React from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Track your event planning performance and business metrics
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quick Stats Preview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm text-blue-600 font-medium">Events Planned</p>
                  <p className="text-2xl font-bold text-blue-900">--</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">--</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm text-purple-600 font-medium">Active Clients</p>
                  <p className="text-2xl font-bold text-purple-900">--</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm text-orange-600 font-medium">Growth Rate</p>
                  <p className="text-2xl font-bold text-orange-900">--</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Message */}
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics - Coming Soon</h3>
              <p className="text-gray-600 max-w-md">
                Comprehensive analytics including event performance, vendor ratings, 
                budget optimization, and business growth metrics will be available here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;