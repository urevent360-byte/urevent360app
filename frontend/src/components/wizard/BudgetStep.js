import React, { useState, useEffect } from 'react';
import { DollarSign, Info, TrendingUp } from 'lucide-react';

const BudgetStep = ({ value, onChange }) => {
  const [targetBudget, setTargetBudget] = useState(value?.target || '');
  const [currency, setCurrency] = useState(value?.currency || 'USD');

  useEffect(() => {
    onChange({
      target: targetBudget ? Number(targetBudget) : undefined,
      currency
    });
  }, [targetBudget, currency, onChange]);

  const budgetRanges = [
    { range: '$1,000 - $5,000', value: 3000, desc: 'Intimate gatherings' },
    { range: '$5,000 - $15,000', value: 10000, desc: 'Small celebrations' },
    { range: '$15,000 - $30,000', value: 22500, desc: 'Medium events' },
    { range: '$30,000 - $50,000', value: 40000, desc: 'Large celebrations' },
    { range: '$50,000+', value: 75000, desc: 'Premium events' }
  ];

  const handleQuickSelect = (value) => {
    setTargetBudget(value.toString());
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Budget (USD)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="number"
            min={0}
            step={100}
            value={targetBudget}
            onChange={(e) => setTargetBudget(e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            placeholder="e.g., 15000"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This will help us recommend vendors within your budget range
        </p>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Budget Information</p>
            <p className="text-xs text-amber-700 mt-1">
              Setting a target budget helps us match you with appropriate vendors and venues. 
              You can adjust this later in the Step-by-Step planning mode.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Budget Ranges</h4>
        <div className="grid grid-cols-1 gap-3">
          {budgetRanges.map((range, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleQuickSelect(range.value)}
              className={`p-3 text-left border rounded-lg transition-all hover:border-purple-300 hover:bg-purple-50 ${
                Number(targetBudget) === range.value
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{range.range}</p>
                  <p className="text-sm text-gray-600">{range.desc}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {targetBudget && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start space-x-2">
            <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Budget Set</p>
              <p className="text-xs text-green-700 mt-1">
                Target budget: ${Number(targetBudget).toLocaleString()} USD
              </p>
              <p className="text-xs text-green-600 mt-1">
                This budget will be used to initialize your Budget Tracker in the planning workspace.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetStep;