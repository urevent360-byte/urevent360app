import React from 'react';
import { Link } from 'react-router-dom';

const StickyPlanBar = ({ eventId }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/90 backdrop-blur p-3 md:hidden">
      <Link
        to={`/events/${eventId}/plan`}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3
                   text-base font-semibold text-white shadow
                   bg-gradient-to-r from-indigo-600 to-fuchsia-600
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-400
                   min-h-[44px]"
        aria-label="Open Step-by-Step Mode"
      >
        <span>Open Step-by-Step Mode</span>
      </Link>
    </div>
  );
};

export default StickyPlanBar;