import React from 'react';

const VendorLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white p-4">
        <h1 className="text-xl font-bold">Vendor Portal</h1>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default VendorLayout;