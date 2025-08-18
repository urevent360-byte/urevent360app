import React from 'react';

const EmployeeLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-600 text-white p-4">
        <h1 className="text-xl font-bold">Employee Portal</h1>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default EmployeeLayout;