import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, DollarSign, Star, Filter, Search, Heart, MapPin, Phone, Mail } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VendorMarketplace = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    service_type: '',
    location: '',
    min_budget: '',
    max_budget: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const serviceTypes = [
    'All Services',
    'Catering',
    'Decoration',
    'Photography',
    'Videography',
    'Music/DJ',
    'Entertainment',
    'Transportation',
    'Security',
    'Cleaning',
    'Lighting',
    'Flowers',
    'Makeup Artist',
    'Wedding Planner'
  ];

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vendors, filters]);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API}/vendors`);
      // Add sample vendors if none exist
      const sampleVendors = response.data.length === 0 ? generateSampleVendors() : response.data;
      setVendors(sampleVendors);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      // Use sample data on error
      setVendors(generateSampleVendors());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleVendors = () => [
    {
      id: '1',
      name: 'Elite Catering Services',
      service_type: 'Catering',
      description: 'Premium catering for all types of events with customizable menus',
      location: 'New York, NY',
      price_range: { min: 50, max: 150 },
      rating: 4.8,
      portfolio: ['https://images.unsplash.com/photo-1555244162-803834f70033?w=400&h=300&fit=crop'],
      contact_info: { phone: '(555) 123-4567', email: 'info@elitecatering.com' },
      availability: ['weekdays', 'weekends']
    },
    {
      id: '2',
      name: 'Elegant Decorations',
      service_type: 'Decoration',
      description: 'Beautiful event decorations that transform any space into magic',
      location: 'Los Angeles, CA',
      price_range: { min: 800, max: 5000 },
      rating: 4.9,
      portfolio: ['https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=300&fit=crop'],
      contact_info: { phone: '(555) 987-6543', email: 'hello@elegantdecorations.com' },
      availability: ['weekends', 'holidays']
    },
    {
      id: '3',
      name: 'Capture Moments Photography',
      service_type: 'Photography',
      description: 'Professional wedding and event photography with artistic vision',
      location: 'Chicago, IL',
      price_range: { min: 1200, max: 3500 },
      rating: 4.7,
      portfolio: ['https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop'],
      contact_info: { phone: '(555) 456-7890', email: 'book@capturemoments.com' },
      availability: ['weekends', 'weekdays']
    },
    {
      id: '4',
      name: 'Sound & Rhythm DJ Services',
      service_type: 'Music/DJ',
      description: 'Professional DJ services with extensive music library and equipment',
      location: 'Miami, FL',
      price_range: { min: 600, max: 2000 },
      rating: 4.6,
      portfolio: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'],
      contact_info: { phone: '(555) 321-0987', email: 'dj@soundrhythm.com' },
      availability: ['weekends', 'weekdays', 'holidays']
    },
    {
      id: '5',
      name: 'Bloom & Petals Florist',
      service_type: 'Flowers',
      description: 'Fresh flowers and beautiful arrangements for every occasion',
      location: 'Seattle, WA',
      price_range: { min: 300, max: 2500 },
      rating: 4.8,
      portfolio: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'],
      contact_info: { phone: '(555) 654-3210', email: 'orders@bloompetals.com' },
      availability: ['weekdays', 'weekends']
    },
    {
      id: '6',
      name: 'Luxury Transportation Co.',
      service_type: 'Transportation',
      description: 'Premium transportation services with luxury vehicles',
      location: 'San Francisco, CA',
      price_range: { min: 200, max: 800 },
      rating: 4.5,
      portfolio: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop'],
      contact_info: { phone: '(555) 111-2233', email: 'book@luxurytrans.com' },
      availability: ['weekdays', 'weekends', 'holidays']
    }
  ];

  const applyFilters = () => {
    let filtered = vendors;

    if (filters.search) {
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        vendor.service_type.toLowerCase().includes(filters.search.toLowerCase()) ||
        vendor.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.service_type && filters.service_type !== 'All Services') {
      filtered = filtered.filter(vendor => vendor.service_type === filters.service_type);
    }

    if (filters.location) {
      filtered = filtered.filter(vendor =>
        vendor.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.min_budget) {
      filtered = filtered.filter(vendor => vendor.price_range.max >= parseInt(filters.min_budget));
    }

    if (filters.max_budget) {
      filtered = filtered.filter(vendor => vendor.price_range.min <= parseInt(filters.max_budget));
    }

    setFilteredVendors(filtered);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const toggleFavorite = (vendorId) => {
    setFavorites(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getServiceIcon = (serviceType) => {
    const icons = {
      'Catering': '🍽️',
      'Decoration': '🎨',
      'Photography': '📸',
      'Videography': '🎥',
      'Music/DJ': '🎵',
      'Entertainment': '🎭',
      'Transportation': '🚗',
      'Security': '🛡️',
      'Cleaning': '🧹',
      'Lighting': '💡',
      'Flowers': '🌸',
      'Makeup Artist': '💄',
      'Wedding Planner': '📋'
    };
    return icons[serviceType] || '🔧';
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
          <h1 className="text-2xl font-bold text-gray-900">Vendor Marketplace</h1>
          <p className="mt-1 text-sm text-gray-500">
            Find the perfect vendors for your event
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search vendors..."
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            name="service_type"
            value={filters.service_type}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {serviceTypes.map(type => (
              <option key={type} value={type === 'All Services' ? '' : type}>{type}</option>
            ))}
          </select>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Location..."
              className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {showFilters && (
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="min_budget"
                  value={filters.min_budget}
                  onChange={handleFilterChange}
                  placeholder="Min budget"
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="max_budget"
                  value={filters.max_budget}
                  onChange={handleFilterChange}
                  placeholder="Max budget"
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
          {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <div key={vendor.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={vendor.portfolio[0]}
                alt={vendor.name}
                className="w-full h-48 object-cover"
              />
              <button
                onClick={() => toggleFavorite(vendor.id)}
                className={`absolute top-3 right-3 p-2 rounded-full ${
                  favorites.includes(vendor.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-400 hover:text-red-500'
                }`}
              >
                <Heart className="h-4 w-4" fill={favorites.includes(vendor.id) ? 'currentColor' : 'none'} />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-800">
                  <span className="mr-1">{getServiceIcon(vendor.service_type)}</span>
                  {vendor.service_type}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                  {vendor.name}
                </h3>
                <div className="flex items-center ml-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">{vendor.rating}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                {vendor.location}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {vendor.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  Budget Range
                </div>
                <div className="text-lg font-semibold text-purple-600">
                  {formatCurrency(vendor.price_range.min)} - {formatCurrency(vendor.price_range.max)}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {vendor.availability.map((availability, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 capitalize"
                    >
                      {availability}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {vendor.contact_info.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {vendor.contact_info.email}
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  Contact
                </button>
                <button className="flex-1 bg-white text-purple-600 text-sm font-medium py-2 px-4 rounded-lg border border-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  View Portfolio
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorMarketplace;