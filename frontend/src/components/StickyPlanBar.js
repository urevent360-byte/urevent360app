import React from 'react';
import { PlayCircle } from 'lucide-react';

const StickyPlanBar = ({ eventId, onOpenPlanner }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur-md p-3 md:hidden shadow-lg">
      <button
        onClick={onOpenPlanner}
        className="w-full inline-flex items-center justify-center gap-3 rounded-xl px-4 py-4
                   text-base font-bold text-white shadow-lg
                   bg-gradient-to-r from-violet-600 to-purple-600
                   hover:from-violet-700 hover:to-purple-700
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400
                   min-h-[52px] transition-all duration-200 active:scale-95"
        aria-label="Open Interactive Event Planner"
      >
        <PlayCircle className="h-6 w-6" />
        <span>Start Planning</span>
      </button>
    </div>
  );
};

export default StickyPlanBar;