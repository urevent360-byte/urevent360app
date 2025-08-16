import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { 
  Heart, Star, Phone, Mail, MapPin, DollarSign, Calendar, 
  Search, Filter, X, Ban, Check, Plus, Eye, MessageCircle,
  Award, TrendingUp, Clock, Users, ExternalLink
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PreferredVendors = () => {
  const { user } = useContext(AuthContext);
  const [preferredVendors, setPreferredVendors] = useState([]);
  const [blockedVendors, setBlockedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showBlocked, setShowBlocked] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPreferredVendors();
  }, []);

  const fetchPreferredVendors = async () => {
    setLoading(true);
    try {
      const [preferredRes, blockedRes] = await Promise.all([
        axios.get(`${API}/users/preferred-vendors`),
        axios.get(`${API}/users/blocked-vendors`)
      ]);
      
      setPreferredVendors(preferredRes.data.vendors || mockPreferredVendors);
      setBlockedVendors(blockedRes.data.vendors || mockBlockedVendors);
    } catch (error) {
      console.error('Failed to fetch preferred vendors:', error);
      // Use mock data on error
      setPreferredVendors(mockPreferredVendors);
      setBlockedVendors(mockBlockedVendors);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const mockPreferredVendors = [
    {
      id: 'vendor_123',
      name: 'Elegant Catering Co.',
      service_type: 'Catering',
      rating: 4.9,
      events_count: 5,
      total_spent: 12500,
      last_hired: '2024-10-15T00:00:00Z',
      contact: {
        phone: '+1-555-0123',
        email: 'info@elegantcatering.com',
        location: 'New York, NY'
      },
      specialties: ['Wedding Catering', 'Corporate Events', 'Fine Dining'],
      notes: 'Excellent service, professional staff, amazing food quality.',
      added_date: '2023-01-15T00:00:00Z',
      average_cost: 2500,
      image_url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=300&h=200&fit=crop'
    },
    {
      id: 'vendor_456',
      name: 'Premier Photography',
      service_type: 'Photography',
      rating: 4.8,
      events_count: 3,
      total_spent: 4200,
      last_hired: '2024-09-20T00:00:00Z',
      contact: {
        phone: '+1-555-0456',
        email: 'contact@premierphotography.com',
        location: 'Brooklyn, NY'
      },
      specialties: ['Wedding Photography', 'Event Coverage', 'Portrait Photography'],
      notes: 'Creative shots, punctual, great to work with.',
      added_date: '2023-03-20T00:00:00Z',
      average_cost: 1400,
      image_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=200&fit=crop'
    },
    {
      id: 'vendor_789',
      name: 'Royal Decorations',
      service_type: 'Decoration',
      rating: 4.7,
      events_count: 4,
      total_spent: 6800,
      last_hired: '2024-08-10T00:00:00Z',
      contact: {
        phone: '+1-555-0789',
        email: 'info@royaldecorations.com',
        location: 'Manhattan, NY'
      },
      specialties: ['Wedding Decor', 'Corporate Events', 'Theme Parties'],
      notes: 'Beautiful setups, attention to detail, reliable.',
      added_date: '2023-02-10T00:00:00Z',
      average_cost: 1700,
      image_url: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=300&h=200&fit=crop'
    }
  ];

  const mockBlockedVendors = [
    {
      id: 'vendor_999',
      name: 'Unreliable Vendors Inc.',
      service_type: 'DJ & Music',
      rating: 2.1,
      blocked_date: '2024-06-15T00:00:00Z',
      reason: 'Poor service quality, arrived late, unprofessional behavior',
      events_count: 1
    }
  ];

  const serviceTypes = ['all', 'Catering', 'Photography', 'Decoration', 'DJ & Music', 'Event Planning', 'Venue', 'Waitstaff'];

  const removeFromPreferred = async (vendorId) => {
    if (!window.confirm('Are you sure you want to remove this vendor from your preferred list?')) {
      return;
    }

    try {
      await axios.delete(`${API}/users/preferred-vendors/${vendorId}`);
      setPreferredVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
      setMessage('Vendor removed from preferred list.');
    } catch (error) {
      console.error('Failed to remove vendor:', error);
      setMessage('Failed to remove vendor. Please try again.');
    }
  };

  const blockVendor = async (vendor) => {
    const reason = window.prompt('Please provide a reason for blocking this vendor:');
    if (!reason) return;

    try {
      await axios.post(`${API}/users/blocked-vendors`, {
        vendor_id: vendor.id,
        reason: reason
      });
      
      // Remove from preferred and add to blocked
      setPreferredVendors(prev => prev.filter(v => v.id !== vendor.id));
      setBlockedVendors(prev => [...prev, { ...vendor, reason, blocked_date: new Date().toISOString() }]);
      setMessage('Vendor has been blocked successfully.');
    } catch (error) {
      console.error('Failed to block vendor:', error);
      setMessage('Failed to block vendor. Please try again.');
    }
  };

  const unblockVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to unblock this vendor?')) {
      return;
    }

    try {
      await axios.delete(`${API}/users/blocked-vendors/${vendorId}`);
      setBlockedVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
      setMessage('Vendor has been unblocked.');
    } catch (error) {
      console.error('Failed to unblock vendor:', error);
      setMessage('Failed to unblock vendor. Please try again.');
    }
  };

  const hireAgain = (vendor) => {
    // Navigate to vendor marketplace with this vendor pre-selected or contacted
    window.location.href = `/vendors?vendor=${vendor.id}&action=hire`;
  };

  const filteredVendors = preferredVendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.service_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = serviceFilter === 'all' || vendor.service_type === serviceFilter;
    const matchesRating = ratingFilter === 'all' || 
                         (ratingFilter === '4+' && vendor.rating >= 4) ||
                         (ratingFilter === '3+' && vendor.rating >= 3);
    
    return matchesSearch && matchesService && matchesRating;
  });

  const sortedVendors = [...filteredVendors].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'recent':
        return new Date(b.last_hired) - new Date(a.last_hired);
      case 'events':
        return b.events_count - a.events_count;
      case 'spent':
        return b.total_spent - a.total_spent;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const displayVendors = showBlocked ? blockedVendors : sortedVendors;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Heart className="h-8 w-8 mr-3 text-red-500" />
              Preferred Vendors
            </h1>
            <p className="text-gray-600 mt-2">
              Your trusted vendors for seamless event planning. Rate, manage, and hire again with confidence.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBlocked(!showBlocked)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                showBlocked 
                  ? 'bg-red-100 text-red-700 border-red-300' 
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Ban className="h-4 w-4 mr-2 inline" />
              {showBlocked ? 'Show Preferred' : 'Show Blocked'}
            </button>
            <Link
              to="/vendors"
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Find New Vendors
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Preferred Vendors</p>
                <p className="text-2xl font-bold text-purple-900">{preferredVendors.length}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Events</p>
                <p className="text-2xl font-bold text-green-900">
                  {preferredVendors.reduce((sum, v) => sum + v.events_count, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Invested</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${preferredVendors.reduce((sum, v) => sum + v.total_spent, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {preferredVendors.length > 0 
                    ? (preferredVendors.reduce((sum, v) => sum + v.rating, 0) / preferredVendors.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {!showBlocked && (
        /* Filters and Search */
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {serviceTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Services' : type}
                </option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="4+">4+ Stars</option>
              <option value="3+">3+ Stars</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="rating">Sort by Rating</option>
              <option value="recent">Recently Hired</option>
              <option value="events">Most Events</option>
              <option value="spent">Most Spent</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('success') || message.includes('removed') || message.includes('blocked') || message.includes('unblocked') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {message}
          </div>
        </div>
      )}

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          /* Loading State */
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))
        ) : displayVendors.length > 0 ? (
          displayVendors.map((vendor) => (
            <div key={vendor.id} className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
              showBlocked ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-purple-300'
            }`}>
              {/* Vendor Image */}
              <div className="relative">
                <img
                  src={vendor.image_url || `https://ui-avatars.com/api/?name=${vendor.name}&background=7c3aed&color=fff&size=300`}
                  alt={vendor.name}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                {!showBlocked && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center text-sm font-medium">
                      {renderStars(vendor.rating)}
                      <span className="ml-1 text-gray-700">{vendor.rating}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Vendor Info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                    {!showBlocked && (
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    )}
                  </div>
                  <p className="text-purple-600 font-medium text-sm">{vendor.service_type}</p>
                  
                  {vendor.specialties && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {vendor.specialties.slice(0, 2).map((specialty, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {specialty}
                        </span>
                      ))}
                      {vendor.specialties.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          +{vendor.specialties.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!showBlocked ? (
                  /* Preferred Vendor Details */
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {vendor.events_count} events
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        ${vendor.total_spent.toLocaleString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(vendor.last_hired).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        ~${vendor.average_cost}/event
                      </div>
                    </div>

                    {/* Notes */}
                    {vendor.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 italic">"{vendor.notes}"</p>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="mb-4 space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-2" />
                        {vendor.contact.phone}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-2" />
                        {vendor.contact.email}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-2" />
                        {vendor.contact.location}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => hireAgain(vendor)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Hire Again
                      </button>
                      <button
                        onClick={() => removeFromPreferred(vendor.id)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Remove from preferred"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => blockVendor(vendor)}
                        className="px-3 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                        title="Block vendor"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Blocked Vendor Details */
                  <div className="space-y-3">
                    <div className="flex items-center text-red-600 text-sm">
                      <Ban className="h-4 w-4 mr-2" />
                      Blocked on {new Date(vendor.blocked_date).toLocaleDateString()}
                    </div>
                    
                    <div className="bg-red-100 p-3 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Reason:</strong> {vendor.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => unblockVendor(vendor.id)}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Unblock Vendor
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="col-span-full text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {showBlocked ? (
                <Ban className="h-12 w-12 text-gray-400" />
              ) : (
                <Heart className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {showBlocked ? 'No Blocked Vendors' : 'No Preferred Vendors Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {showBlocked 
                ? 'You have not blocked any vendors.'
                : 'Start building your list of trusted vendors by rating them 4+ stars after your events.'
              }
            </p>
            {!showBlocked && (
              <Link
                to="/vendors"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Explore Vendors
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreferredVendors;