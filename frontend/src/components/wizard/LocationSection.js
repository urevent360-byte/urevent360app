import React, { useState, useEffect } from 'react';
import { MapPin, Search } from 'lucide-react';

const LocationSection = ({ value, onChange }) => {
  const [state, setState] = useState({
    city: '',
    zipcode: '',
    zipOnly: false,
    radiusMiles: 25,
    ...value,
  });

  useEffect(() => {
    onChange(state);
  }, [state, onChange]);

  const updateState = (updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  return (
    <section className="space-y-4">
      {/* City/Location Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City/Location *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="City or location"
            value={state.city || ''}
            onChange={(e) => updateState({ city: e.target.value })}
          />
        </div>
      </div>

      {/* ZIP Code Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ZIP Code (Optional)
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={state.zipcode || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ''); // Only allow digits
              if (value.length <= 10) {
                updateState({ zipcode: value });
              }
            }}
            inputMode="numeric"
            maxLength={10}
            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., 32822"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter ZIP code for precise venue location search
        </p>
      </div>

      {/* ZIP-Only Toggle */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!state.zipOnly}
            onChange={(e) => updateState({ zipOnly: e.target.checked })}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded mt-0.5"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              Search only within this ZIP code
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Limit venue search to this specific ZIP code area only
            </p>
          </div>
        </label>
      </div>

      {/* Radius Slider */}
      <fieldset className={`space-y-3 ${state.zipOnly ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="block text-sm font-medium text-gray-700">
          Search radius: {state.radiusMiles || 25} miles
        </label>
        <div className="relative">
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={state.radiusMiles || 25}
            onChange={(e) => updateState({ radiusMiles: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            disabled={state.zipOnly}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 mi</span>
            <span>25 mi</span>
            <span>50 mi</span>
            <span>100 mi</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Search for venues within this radius {state.zipcode ? `from ZIP ${state.zipcode}` : 'from the selected location'}
        </p>
      </fieldset>

      {/* Search Area Preview */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-2">
          <Search className="h-4 w-4 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Search Area Preview</p>
            <p className="text-xs text-blue-700">
              {state.zipOnly
                ? `ZIP-only ${state.zipcode || '—'}`
                : `${state.radiusMiles || 25} miles around ${state.zipcode || state.city || 'selected location'}`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationSection;