import React, { useState, useCallback, useEffect } from 'react';
import { Menu } from 'lucide-react';
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
      <div className="flex">
        <Sidebar open={open} onOpenChange={onOpenChange} />
        <div className="flex-1 flex flex-col">
          {/* Top bar with hamburger */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-label={open ? "Collapse menu" : "Expand menu"}
                className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Rest of navbar content */}
              <Navbar />
            </div>
          </header>
          
          <main className="flex-1 transition-all duration-300 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;