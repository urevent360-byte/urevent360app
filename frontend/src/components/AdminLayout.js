import React from 'react';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white p-4">
        <h1 className="text-xl font-bold">Admin Console</h1>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;