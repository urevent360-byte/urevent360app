import React from 'react';
import { Heart, Star, Phone, Mail, MapPin } from 'lucide-react';

const PreferredVendors = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preferred Vendors</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your trusted professionals for exceptional events
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
            <div className="flex items-start">
              <Heart className="h-5 w-5 text-purple-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">How Preferred Vendors Work</h3>
                <p className="text-sm text-purple-800">
                  Vendors are automatically added to your preferred list after you rate them 4+ stars. 
                  This helps you quickly book trusted professionals for future events.
                </p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-center">
              <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Preferred Vendors Yet</h3>
              <p className="text-gray-600 max-w-md">
                Your preferred vendors will appear here after you rate them highly. 
                Start planning events and working with vendors to build your trusted network!
              </p>
              <div className="mt-4">
                <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Star className="h-4 w-4 mr-2" />
                  Browse Vendors
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferredVendors;