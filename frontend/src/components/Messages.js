import React from 'react';
import { MessageCircle, Send, Search, Plus } from 'lucide-react';

const Messages = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="mt-1 text-sm text-gray-600">
                Communicate with vendors, clients, and team members
              </p>
            </div>
            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Messages - Coming Soon</h3>
              <p className="text-gray-600 max-w-md">
                Real-time messaging with vendors, clients, and team members will be available here.
                Stay tuned for this exciting feature!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;