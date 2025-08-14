import React from 'react';
import { MessageSquareText, Plus } from 'lucide-react';

const ProjectUpdates = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Updates</h1>
          <p className="text-gray-600">Share project progress and collaborate with team</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
          <Plus className="w-4 h-4" />
          New Update
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <MessageSquareText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Project Updates Coming Soon</h3>
          <p className="text-gray-600">
            This feature will allow you to post project updates, share progress with team members, and collaborate on ongoing event planning projects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectUpdates;