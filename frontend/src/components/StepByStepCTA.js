import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';

const StepByStepCTA = ({ eventId }) => {
  return (
    <div className="flex items-center justify-between gap-3 mb-6">
      <div className="text-sm text-gray-600">
        Ready to plan your vendors, venue, and budget?
      </div>

      <Link
        to={`/events/${eventId}/plan`}
        aria-label="Open Step-by-Step Mode"
        className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 text-lg font-semibold
                   text-white shadow-lg transition transform
                   bg-gradient-to-r from-indigo-600 to-fuchsia-600
                   hover:-translate-y-0.5 hover:shadow-xl
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-400"
        data-analytics="OpenStepByStep"
      >
        {/* list-check icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path 
            d="M9 11l-2 2-1-1M9 7l-2 2-1-1M11 7h8M11 11h8M11 15h8" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span>Open Step-by-Step Mode</span>
      </Link>
    </div>
  );
};

export default StepByStepCTA;