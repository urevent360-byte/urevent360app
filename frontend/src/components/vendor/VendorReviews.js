import React from 'react';
import { Star } from 'lucide-react';

const VendorReviews = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600">View and respond to client reviews</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reviews Management Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to view all your reviews, respond to feedback, and track your rating trends.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorReviews;