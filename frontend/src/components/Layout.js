import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  const [open, setOpen] = useState(true);
  const onOpenChange = useCallback((v) => setOpen(v), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar open={open} onOpenChange={onOpenChange} />
        <main className={`flex-1 ${open ? "ml-64" : "ml-16"} transition-all duration-300 p-6`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;