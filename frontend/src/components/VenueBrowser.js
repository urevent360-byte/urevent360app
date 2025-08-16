import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Users, DollarSign, Star, Filter, Search, Heart } from 'lucide-react';
import LocationFilter from './LocationFilter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VenueBrowser = () => {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    zipcode: '',
    search_radius: 25,
    only_exact_location: false,
    venue_type: '',
    min_capacity: '',
    max_price: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const venueTypes = [
    'All Types',
    'Hotel',
    'Restaurant', 
    'Outdoor',
    'Banquet Hall',
    'Beach',
    'Garden',
    'Community Center',
    'Private Residence'
  ];

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [venues, filters]);

  const fetchVenues = async () => {
    try {
      const response = await axios.get(`${API}/venues`);
      // Add sample venues if none exist
      const sampleVenues = response.data.length === 0 ? generateSampleVenues() : response.data;
      setVenues(sampleVenues);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      // Use sample data on error
      setVenues(generateSampleVenues());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleVenues = () => [
    {
      id: '1',
      name: 'Grand Ballroom Hotel',
      description: 'Elegant ballroom perfect for weddings and corporate events',
      location: 'Downtown, New York',
      venue_type: 'Hotel',
      capacity: 300,
      price_per_person: 150,
      amenities: ['Parking', 'Catering', 'AV Equipment', 'Bridal Suite'],
      rating: 4.8,
      images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop'],
      contact_info: { phone: '(555) 123-4567', email: 'events@grandballroom.com' }
    },
    {
      id: '2',
      name: 'Sunset Garden Venue',
      description: 'Beautiful outdoor garden with mountain views',
      location: 'Hillside, California',
      venue_type: 'Garden',
      capacity: 150,
      price_per_person: 120,
      amenities: ['Garden Setting', 'Mountain Views', 'Parking', 'Outdoor Kitchen'],
      rating: 4.9,
      images: ['https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop'],
      contact_info: { phone: '(555) 987-6543', email: 'bookings@sunsetgarden.com' }
    },
    {
      id: '3',
      name: 'Oceanview Pavilion',
      description: 'Beachfront venue with panoramic ocean views',
      location: 'Miami Beach, Florida',
      venue_type: 'Beach',
      capacity: 200,
      price_per_person: 180,
      amenities: ['Ocean Views', 'Beach Access', 'Catering Kitchen', 'Parking'],
      rating: 4.7,
      images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'],
      contact_info: { phone: '(555) 456-7890', email: 'events@oceanview.com' }
    },
    {
      id: '4',
      name: 'Metropolitan Conference Center',
      description: 'Modern facility ideal for corporate events and conferences',
      location: 'Business District, Chicago',
      venue_type: 'Conference Center',
      capacity: 500,
      price_per_person: 95,
      amenities: ['AV Equipment', 'WiFi', 'Catering', 'Parking', 'Business Center'],
      rating: 4.5,
      images: ['https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop'],
      contact_info: { phone: '(555) 321-0987', email: 'corporate@metroconf.com' }
    }
  ];

  const applyFilters = () => {
    let filtered = venues;

    if (filters.search) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        venue.location.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Location-based filtering
    if (filters.zipcode && filters.zipcode.length === 5) {
      if (filters.only_exact_location) {
        // Exact location match - filter by zipcode or city name
        filtered = filtered.filter(venue => {
          const venueLocation = venue.location.toLowerCase();
          const userLocation = filters.location.toLowerCase();
          return venueLocation.includes(filters.zipcode) || 
                 (userLocation && venueLocation.includes(userLocation));
        });
      } else {
        // Range-based filtering - in a real app this would use actual distance calculation
        // For now, we'll simulate it based on location text matching with some flexibility
        const searchRadius = filters.search_radius;
        filtered = filtered.filter(venue => {
          const venueLocation = venue.location.toLowerCase();
          const userLocation = filters.location.toLowerCase();
          
          // Simple mock distance logic based on location text
          // In production, this would use actual latitude/longitude calculations
          if (venueLocation.includes(filters.zipcode) || 
              (userLocation && venueLocation.includes(userLocation))) {
            return true; // Exact match
          }
          
          // For demo purposes, include venues in same state/region for larger radius
          if (searchRadius > 25) {
            const userState = extractState(filters.location);
            const venueState = extractState(venue.location);
            return userState && venueState && userState === venueState;
          }
          
          return false;
        });
      }
    } else if (filters.location) {
      // Fallback to simple location matching if no zipcode
      filtered = filtered.filter(venue =>
        venue.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.venue_type && filters.venue_type !== 'All Types') {
      filtered = filtered.filter(venue => venue.venue_type === filters.venue_type);
    }

    if (filters.min_capacity) {
      filtered = filtered.filter(venue => venue.capacity >= parseInt(filters.min_capacity));
    }

    if (filters.max_price) {
      filtered = filtered.filter(venue => venue.price_per_person <= parseFloat(filters.max_price));
    }

    setFilteredVenues(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (locationData) => {
    setFilters(prev => ({
      ...prev,
      zipcode: locationData.zipcode,
      location: locationData.location,
      search_radius: locationData.searchRadius,
      only_exact_location: locationData.onlyExactLocation
    }));
  };

  const extractState = (location) => {
    // Simple state extraction from location string
    const parts = location.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : null;
  };

  const toggleFavorite = (venueId) => {
    setFavorites(prev =>
      prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Venues</h1>
          <p className="mt-1 text-sm text-gray-500">
            Discover the perfect venue for your event
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Location Filter */}
        <LocationFilter
          initialZipcode={filters.zipcode}
          initialLocation={filters.location}
          initialRadius={filters.search_radius}
          initialOnlyExact={filters.only_exact_location}
          onLocationChange={handleLocationChange}
          compact={true}
        />
        
        {/* Other Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search venues..."
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              name="venue_type"
              value={filters.venue_type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {venueTypes.map(type => (
                <option key={type} value={type === 'All Types' ? '' : type}>{type}</option>
              ))}
            </select>
          </div>

        {showFilters && (
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Capacity
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="min_capacity"
                  value={filters.min_capacity}
                  onChange={handleFilterChange}
                  placeholder="Min guests"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Price per Person
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="max_price"
                  value={filters.max_price}
                  onChange={handleFilterChange}
                  placeholder="Max price"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Venue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => (
          <div key={venue.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={venue.images[0]}
                alt={venue.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => toggleFavorite(venue.id)}
                className={`absolute top-3 right-3 p-2 rounded-full ${
                  favorites.includes(venue.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className="h-4 w-4" fill={favorites.includes(venue.id) ? 'currentColor' : 'none'} />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800">
                  {venue.venue_type}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {venue.name}
                </h3>
                <div className="flex items-center ml-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">{venue.rating}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {venue.location}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {venue.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-1" />
                  Up to {venue.capacity} guests
                </div>
                <div className="text-lg font-semibold text-purple-600">
                  {formatCurrency(venue.price_per_person)}/person
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {venue.amenities.slice(0, 3).map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      {amenity}
                    </span>
                  ))}
                  {venue.amenities.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                      +{venue.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  Book Now
                </button>
                <button className="flex-1 bg-white text-purple-600 text-sm font-medium py-2 px-4 rounded-lg border border-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVenues.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No venues found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default VenueBrowser;