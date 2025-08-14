import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, MapPin, Users, DollarSign, Phone, Mail, Globe, 
  Star, Filter, X, Plus, Building, Navigation, Clock,
  CheckCircle, AlertCircle, Sliders
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VenueSelection = ({ eventId, currentEvent, onClose, onVenueSelected }) => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMode, setSearchMode] = useState('search'); // 'search' or 'manual'
  const [searchFilters, setSearchFilters] = useState({
    zip_code: '',
    city: '',
    radius: 25,
    venue_type: 'all',
    capacity_min: '',
    capacity_max: '',
    budget_min: '',
    budget_max: ''
  });
  const [manualVenue, setManualVenue] = useState({
    venue_name: '',
    venue_address: '',
    phone: '',
    email: '',
    website: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // If event has location, pre-fill search
    if (currentEvent?.location) {
      // Try to extract ZIP code from location
      const zipMatch = currentEvent.location.match(/\b\d{5}\b/);
      if (zipMatch) {
        setSearchFilters(prev => ({ ...prev, zip_code: zipMatch[0] }));
      } else {
        setSearchFilters(prev => ({ ...prev, city: currentEvent.location }));
      }
    }
    
    // Set capacity based on guest count
    if (currentEvent?.guest_count) {
      setSearchFilters(prev => ({ 
        ...prev, 
        capacity_min: currentEvent.guest_count,
        capacity_max: Math.ceil(currentEvent.guest_count * 1.2) // 20% buffer
      }));
    }
  }, [currentEvent]);

  const searchVenues = async () => {
    if (!searchFilters.zip_code && !searchFilters.city) {
      setError('Please enter a ZIP code or city name to search for venues');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      const response = await axios.get(`${API}/venues/search?${params}`);
      setVenues(response.data);
      
      if (response.data.length === 0) {
        setError('No venues found matching your criteria. Try expanding your search radius or adjusting filters.');
      }
    } catch (err) {
      setError('Failed to search venues. Please try again.');
      console.error('Venue search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = async (venue) => {
    if (venue.id) {
      // Existing venue from search
      const venueData = {
        venue_id: venue.id,
        venue_name: venue.name,
        venue_address: venue.location,
        venue_contact: venue.contact_info || {}
      };
      await submitVenueSelection(venueData);
    } else {
      // Manual venue entry
      setSelectedVenue(venue);
    }
  };

  const handleManualVenueSubmit = async () => {
    if (!manualVenue.venue_name.trim()) {
      setError('Please enter a venue name');
      return;
    }

    const venueData = {
      venue_id: null,
      venue_name: manualVenue.venue_name,
      venue_address: manualVenue.venue_address,
      venue_contact: {
        phone: manualVenue.phone,
        email: manualVenue.email,
        website: manualVenue.website
      }
    };
    
    await submitVenueSelection(venueData);
  };

  const submitVenueSelection = async (venueData) => {
    try {
      setSubmitting(true);
      const response = await axios.post(`${API}/events/${eventId}/select-venue`, venueData);
      onVenueSelected(response.data);
    } catch (err) {
      setError('Failed to select venue. Please try again.');
      console.error('Venue selection error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const venueTypes = [
    'all', 'banquet_hall', 'hotel', 'restaurant', 'outdoor', 'church', 'community_center', 'other'
  ];

  const radiusOptions = [10, 25, 50, 75, 100];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white mb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Select Venue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setSearchMode('search')}
            className={`px-4 py-2 rounded-lg font-medium ${
              searchMode === 'search'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search className="inline h-4 w-4 mr-2" />
            Search Venues
          </button>
          <button
            onClick={() => setSearchMode('manual')}
            className={`px-4 py-2 rounded-lg font-medium ${
              searchMode === 'manual'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Plus className="inline h-4 w-4 mr-2" />
            Enter Venue Manually
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {searchMode === 'search' ? (
          /* Venue Search Mode */
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={searchFilters.zip_code}
                    onChange={(e) => setSearchFilters({...searchFilters, zip_code: e.target.value})}
                    placeholder="e.g., 10001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or City Name
                  </label>
                  <input
                    type="text"
                    value={searchFilters.city}
                    onChange={(e) => setSearchFilters({...searchFilters, city: e.target.value})}
                    placeholder="e.g., New York"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Radius
                  </label>
                  <select
                    value={searchFilters.radius}
                    onChange={(e) => setSearchFilters({...searchFilters, radius: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {radiusOptions.map(radius => (
                      <option key={radius} value={radius}>{radius} miles</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </button>
                
                <button
                  onClick={searchVenues}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Searching...' : 'Search Venues'}
                </button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Venue Type
                      </label>
                      <select
                        value={searchFilters.venue_type}
                        onChange={(e) => setSearchFilters({...searchFilters, venue_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {venueTypes.map(type => (
                          <option key={type} value={type}>
                            {type === 'all' ? 'All Types' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Capacity
                      </label>
                      <input
                        type="number"
                        value={searchFilters.capacity_min}
                        onChange={(e) => setSearchFilters({...searchFilters, capacity_min: e.target.value})}
                        placeholder="Min guests"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Capacity
                      </label>
                      <input
                        type="number"
                        value={searchFilters.capacity_max}
                        onChange={(e) => setSearchFilters({...searchFilters, capacity_max: e.target.value})}
                        placeholder="Max guests"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Budget
                      </label>
                      <input
                        type="number"
                        value={searchFilters.budget_max}
                        onChange={(e) => setSearchFilters({...searchFilters, budget_max: e.target.value})}
                        placeholder="Per person"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Results */}
            {venues.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Found {venues.length} venue{venues.length !== 1 ? 's' : ''}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {venues.map((venue) => (
                    <div key={venue.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{venue.name}</h4>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{venue.location}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center text-sm text-yellow-600">
                            <Star className="h-4 w-4 mr-1" />
                            <span>{venue.rating || 4.5}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {venue.estimated_distance}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Capacity:</span>
                          <span className="font-medium">{venue.capacity} guests</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{venue.venue_type?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Price:</span>
                          <span className="font-medium">{formatCurrency(venue.price_per_person)}/person</span>
                        </div>
                      </div>

                      {venue.description && (
                        <p className="text-sm text-gray-600 mb-4">{venue.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {venue.contact_info?.phone && (
                            <div className="text-xs text-gray-500">
                              <Phone className="inline h-3 w-3 mr-1" />
                              Contact available
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleVenueSelect(venue)}
                          disabled={submitting}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {submitting ? 'Selecting...' : 'Select Venue'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Manual Venue Entry Mode */
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Enter Your Venue Details</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    If you already have a venue booked, enter the details below.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  value={manualVenue.venue_name}
                  onChange={(e) => setManualVenue({...manualVenue, venue_name: e.target.value})}
                  placeholder="e.g., Grand Ballroom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={manualVenue.venue_address}
                  onChange={(e) => setManualVenue({...manualVenue, venue_address: e.target.value})}
                  placeholder="Full address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={manualVenue.phone}
                  onChange={(e) => setManualVenue({...manualVenue, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={manualVenue.email}
                  onChange={(e) => setManualVenue({...manualVenue, email: e.target.value})}
                  placeholder="contact@venue.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={manualVenue.website}
                  onChange={(e) => setManualVenue({...manualVenue, website: e.target.value})}
                  placeholder="https://www.venue.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleManualVenueSubmit}
                disabled={submitting || !manualVenue.venue_name.trim()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding Venue...' : 'Add Venue'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueSelection;