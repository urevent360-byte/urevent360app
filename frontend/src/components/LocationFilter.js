import React, { useState, useEffect } from 'react';
import { MapPin, Target, Slider } from 'lucide-react';

const LocationFilter = ({ 
  initialZipcode = '', 
  initialLocation = '', 
  initialRadius = 25,
  initialOnlyExact = false,
  onLocationChange,
  compact = false 
}) => {
  const [zipcode, setZipcode] = useState(initialZipcode);
  const [location, setLocation] = useState(initialLocation);
  const [searchRadius, setSearchRadius] = useState(initialRadius);
  const [onlyExactLocation, setOnlyExactLocation] = useState(initialOnlyExact);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Notify parent component of changes
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange({
        zipcode,
        location,
        searchRadius,
        onlyExactLocation
      });
    }
  }, [zipcode, location, searchRadius, onlyExactLocation, onLocationChange]);

  const handleZipcodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5); // Only digits, max 5
    setZipcode(value);
  };

  const getRadiusLabel = (radius) => {
    if (radius <= 10) return 'Very Local';
    if (radius <= 25) return 'Local Area';
    if (radius <= 50) return 'Regional';
    return 'Wide Area';
  };

  if (compact) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Target className="h-5 w-5 text-purple-600" />
          <h3 className="font-medium text-gray-900">Location Filter</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <input
              type="text"
              value={zipcode}
              onChange={handleZipcodeChange}
              placeholder="Zipcode"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City/Area"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">{searchRadius}mi</span>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={onlyExactLocation}
            />
          </div>
        </div>
        
        <div className="mt-3">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={onlyExactLocation}
              onChange={(e) => setOnlyExactLocation(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
            />
            <span className="ml-2 text-gray-700">Exact location only</span>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Location Preferences</h3>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-purple-600 hover:text-purple-800"
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic Location Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zipcode *
            </label>
            <input
              type="text"
              value={zipcode}
              onChange={handleZipcodeChange}
              placeholder="Enter zipcode (e.g., 90210)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {zipcode && zipcode.length !== 5 && (
              <p className="text-xs text-red-600 mt-1">Please enter a valid 5-digit zipcode</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City/Area
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or neighborhood"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Location Preference Options */}
        {zipcode && zipcode.length === 5 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">📍 Search Preferences</h4>
            
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="radio"
                  name="location_preference"
                  checked={onlyExactLocation}
                  onChange={() => setOnlyExactLocation(true)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 mt-0.5"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">
                    Only in {location || zipcode}
                  </span>
                  <p className="text-xs text-gray-600">
                    Show venues only in this exact area
                  </p>
                </div>
              </label>
              
              <label className="flex items-start">
                <input
                  type="radio"
                  name="location_preference"
                  checked={!onlyExactLocation}
                  onChange={() => setOnlyExactLocation(false)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 mt-0.5"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">
                    Within a specific range
                  </span>
                  <p className="text-xs text-gray-600">
                    Include nearby venues within a distance
                  </p>
                </div>
              </label>
            </div>

            {/* Search Radius Slider */}
            {!onlyExactLocation && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-900">
                    Search Range
                  </label>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600">
                      {searchRadius} miles
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      {getRadiusLabel(searchRadius)}
                    </span>
                  </div>
                </div>
                
                <div className="px-2">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #9333ea 0%, #9333ea ${(searchRadius - 5) / 95 * 100}%, #e5e7eb ${(searchRadius - 5) / 95 * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>5 mi</span>
                    <span>25 mi</span>
                    <span>50 mi</span>
                    <span>100+ mi</span>
                  </div>
                </div>
                
                {/* Range Recommendations */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className={`p-2 rounded-md ${searchRadius <= 15 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <div className="font-medium text-green-800">5-15 miles</div>
                    <div className="text-green-600">Local venues, easier logistics</div>
                  </div>
                  <div className={`p-2 rounded-md ${searchRadius > 15 && searchRadius <= 35 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="font-medium text-blue-800">15-35 miles</div>
                    <div className="text-blue-600">More options, moderate travel</div>
                  </div>
                  <div className={`p-2 rounded-md ${searchRadius > 35 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                    <div className="font-medium text-orange-800">35+ miles</div>
                    <div className="text-orange-600">Maximum variety, longer travel</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Options */}
        {showAdvanced && zipcode && zipcode.length === 5 && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">🔧 Advanced Options</h5>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Prioritize venues with parking
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include venues with public transportation access
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show venues with outdoor space
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationFilter;