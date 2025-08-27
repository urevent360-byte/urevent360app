import React from 'react';
import { PlayCircle, ArrowRight, Sparkles } from 'lucide-react';

const StepByStepCTA = ({ eventId, event, onOpenPlanner }) => {
  return (
    <div className="flex items-center justify-between gap-4 p-6 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-600" />
          Ready to Start Planning?
        </h3>
        <p className="text-gray-700 mb-1">
          Find vendors, compare prices, and build your perfect event with our interactive planner
        </p>
        <p className="text-sm text-violet-600 font-medium">
          ✨ Smart recommendations • 🛒 Live budget tracking • 📋 Questionnaire-synced matching
        </p>
      </div>

      <button
        onClick={onOpenPlanner}
        aria-label="Open Interactive Event Planner"
        className="flex items-center gap-3 rounded-2xl px-8 py-5 text-lg font-bold
                   text-white shadow-lg transition-all duration-300 transform
                   bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600
                   hover:-translate-y-1 hover:shadow-2xl hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700
                   focus:outline-none focus:ring-4 focus:ring-violet-300 focus:ring-offset-2
                   active:scale-95 group relative overflow-hidden"
        data-analytics="OpenInteractivePlanner"
        title="Open interactive event planner to start your planning session"
      >
        {/* Animated background shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {/* Main play icon - larger and more prominent */}
        <PlayCircle className="h-8 w-8 drop-shadow-sm relative z-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span>Start Planning</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
          <div className="text-sm font-medium opacity-90">Interactive Mode</div>
        </div>
      </button>
    </div>
  );
};

export default StepByStepCTA;