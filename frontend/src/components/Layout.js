import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const LS_KEY = "sb:open";
const DEFAULT_OPEN = false; // collapsed by default

const Layout = ({ children }) => {
  const [open, setOpen] = useState(DEFAULT_OPEN);
  const onOpenChange = useCallback((v) => setOpen(v), []);

  // Read saved preference once (stays collapsed if none saved)
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved !== null) setOpen(saved === "1");
  }, []);

  // Persist when user toggles
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, open ? "1" : "0");
  }, [open]);

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