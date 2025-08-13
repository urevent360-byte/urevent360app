import React from 'react';
import { MessageSquare } from 'lucide-react';

const VendorMessages = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Communicate with your clients</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Messaging System Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to communicate directly with clients, share files, and manage all your conversations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorMessages;