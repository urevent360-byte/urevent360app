import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { 
  History, Calendar, MapPin, Users, DollarSign, Star, 
  Search, Filter, Eye, Copy, Download, Clock, Award,
  TrendingUp, BarChart3, Plus, ChevronRight, ChevronDown, ChevronUp
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventHistory = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEventHistory();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchEventHistory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/users/event-history`, {
        headers: getAuthHeaders()
      });
      setEvents(response.data.events || mockEventHistory);
    } catch (error) {
      console.error('Failed to fetch event history:', error);
      // Use mock data on error
      setEvents(mockEventHistory);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development
  const mockEventHistory = [
    {
      id: 'event_123',
      name: 'Sarah\'s Wedding Reception',
      type: 'Wedding',
      sub_type: 'Reception Only',
      date: '2024-03-15T18:00:00Z',
      status: 'completed',
      venue: {
        name: 'Grand Ballroom Plaza',
        location: 'New York, NY'
      },
      guests: 150,
      budget: 25000,
      total_spent: 23800,
      vendors: [
        {
          id: 'v1',
          name: 'Elegant Catering Co.',
          service: 'Catering',
          cost: 12500,
          rating: 5,
          review: 'Outstanding service, delicious food, professional staff'
        },
        {
          id: 'v2',
          name: 'Premier Photography',
          service: 'Photography',
          cost: 2800,
          rating: 5,
          review: 'Amazing shots, captured every moment perfectly'
        },
        {
          id: 'v3',
          name: 'Royal Decorations',
          service: 'Decoration',
          cost: 4500,
          rating: 4,
          review: 'Beautiful setup, exactly what we envisioned'
        },
        {
          id: 'v4',
          name: 'DJ Mike\'s Music',
          service: 'DJ & Music',
          cost: 1200,
          rating: 4,
          review: 'Great music selection, kept the party going'
        }
      ],
      cultural_style: 'American',
      summary: 'A beautiful wedding reception celebrating Sarah and John\'s special day. Everything went smoothly and guests had an amazing time.',
      created_date: '2024-01-15T00:00:00Z',
      image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=250&fit=crop'
    },
    {
      id: 'event_456',
      name: 'Corporate Annual Gala',
      type: 'Corporate',
      date: '2024-02-20T19:00:00Z',
      status: 'completed',
      venue: {
        name: 'Manhattan Conference Center',
        location: 'Manhattan, NY'
      },
      guests: 200,
      budget: 15000,
      total_spent: 14200,
      vendors: [
        {
          id: 'v5',
          name: 'Business Catering Plus',
          service: 'Catering',
          cost: 8000,
          rating: 4,
          review: 'Professional service, good food quality'
        },
        {
          id: 'v6',
          name: 'Corporate Events Photography',
          service: 'Photography',
          cost: 1500,
          rating: 5,
          review: 'Professional headshots and event coverage'
        },
        {
          id: 'v7',
          name: 'Elite Audio Visual',
          service: 'Audio/Visual',
          cost: 2200,
          rating: 4,
          review: 'Great presentation setup and sound quality'
        }
      ],
      cultural_style: 'American',
      summary: 'Successful corporate gala celebrating company achievements. Professional atmosphere with excellent networking opportunities.',
      created_date: '2023-12-01T00:00:00Z',
      image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=250&fit=crop'
    },
    {
      id: 'event_789',
      name: 'Mom\'s 60th Birthday Celebration',
      type: 'Birthday',
      date: '2024-05-10T15:00:00Z',
      status: 'completed',
      venue: {
        name: 'Garden Restaurant',
        location: 'Brooklyn, NY'
      },
      guests: 75,
      budget: 8000,
      total_spent: 7500,
      vendors: [
        {
          id: 'v8',
          name: 'Sweet Moments Catering',
          service: 'Catering',
          cost: 4500,
          rating: 5,
          review: 'Delicious food, accommodated dietary restrictions perfectly'
        },
        {
          id: 'v9',
          name: 'Party Decorations Pro',
          service: 'Decoration',
          cost: 1800,
          rating: 4,
          review: 'Lovely birthday theme, great attention to detail'
        },
        {
          id: 'v10',
          name: 'Cake Artistry',
          service: 'Cake',
          cost: 350,
          rating: 5,
          review: 'Beautiful custom cake, tasted amazing'
        }
      ],
      cultural_style: 'Hispanic',
      summary: 'A heartwarming celebration of Mom\'s milestone birthday. Family and friends gathered for an unforgettable day.',
      created_date: '2024-03-15T00:00:00Z',
      image_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=250&fit=crop'
    },
    {
      id: 'event_101',
      name: 'Holiday Party Planning',
      type: 'Corporate',
      date: '2024-12-15T18:00:00Z',
      status: 'upcoming',
      venue: {
        name: 'Winter Wonderland Hall',
        location: 'Queens, NY'
      },
      guests: 120,
      budget: 12000,
      total_spent: 0,
      vendors: [
        {
          id: 'v11',
          name: 'Holiday Catering Specialists',
          service: 'Catering',
          cost: 6000,
          rating: null,
          review: null
        },
        {
          id: 'v12',
          name: 'Festive Decorations',
          service: 'Decoration',
          cost: 2500,
          rating: null,
          review: null
        }
      ],
      cultural_style: 'American',
      summary: 'Upcoming holiday party for the team. Planning a festive celebration with holiday theme.',
      created_date: '2024-10-01T00:00:00Z',
      image_url: 'https://images.unsplash.com/photo-1482263231623-6121096b0d3f?w=400&h=250&fit=crop'
    }
  ];

  const duplicateEvent = async (event) => {
    if (!window.confirm(`Create a new event based on "${event.name}"? This will copy all vendor selections and event details.`)) {
      return;
    }

    try {
      const duplicateData = {
        name: `${event.name} (Copy)`,
        type: event.type,
        sub_type: event.sub_type,
        cultural_style: event.cultural_style,
        venue_preferences: event.venue,
        vendor_selections: event.vendors.map(v => ({ 
          service_type: v.service, 
          vendor_id: v.id, 
          estimated_cost: v.cost 
        })),
        estimated_budget: event.budget,
        estimated_guests: event.guests
      };

      const response = await axios.post(`${API}/events/duplicate`, duplicateData, {
        headers: getAuthHeaders()
      });
      
      setMessage('Event duplicated successfully! Redirecting to event planning...');
      
      // Redirect to event planning page
      setTimeout(() => {
        navigate(`/events/${response.data.event_id}/planning`);
      }, 1500);

    } catch (error) {
      console.error('Failed to duplicate event:', error);
      setMessage('Failed to duplicate event. Please try again.');
    }
  };

  const downloadEventSummary = async (eventId) => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/summary-pdf`, {
        responseType: 'blob'
      });
      
      const event = events.find(e => e.id === eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_Summary.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download event summary:', error);
      setMessage('Failed to download event summary.');
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'budget':
        return b.budget - a.budget;
      case 'guests':
        return b.guests - a.guests;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400 text-sm">Not rated</span>;
    
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}</span>
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const completedEvents = events.filter(e => e.status === 'completed');
  const totalSpent = completedEvents.reduce((sum, e) => sum + e.total_spent, 0);
  const totalEvents = completedEvents.length;
  const avgEventCost = totalEvents > 0 ? totalSpent / totalEvents : 0;
  const avgRating = completedEvents.reduce((sum, event) => {
    const eventAvgRating = event.vendors.reduce((vSum, vendor) => vSum + (vendor.rating || 0), 0) / event.vendors.length;
    return sum + eventAvgRating;
  }, 0) / (totalEvents || 1);

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <History className="h-8 w-8 mr-3 text-blue-600" />
              Event History
            </h1>
            <p className="text-gray-600 mt-2">
              Track your past events, review vendor performance, and reuse successful configurations.
            </p>
          </div>
          <Link
            to="/events/create"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Events</p>
                <p className="text-2xl font-bold text-blue-900">{totalEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Total Invested</p>
                <p className="text-2xl font-bold text-green-900">${totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Avg Event Cost</p>
                <p className="text-2xl font-bold text-purple-900">${avgEventCost.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-900">{avgRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="budget">Highest Budget</option>
            <option value="guests">Most Guests</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.includes('success') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Events List */}
      <div className="space-y-6">
        {loading ? (
          /* Loading State */
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex space-x-4">
                <div className="w-32 h-20 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))
        ) : sortedEvents.length > 0 ? (
          sortedEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all">
              {/* Event Header */}
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Event Image */}
                  <img
                    src={event.image_url}
                    alt={event.name}
                    className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                  />

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.venue.name}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {event.guests} guests
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ${event.total_spent > 0 ? event.total_spent.toLocaleString() : event.budget.toLocaleString()}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{event.summary}</p>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                        className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {expandedEvent === event.id ? 'Hide Details' : 'View Details'}
                        {expandedEvent === event.id ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </button>

                      {event.status === 'completed' && (
                        <button
                          onClick={() => duplicateEvent(event)}
                          className="flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Use as Template
                        </button>
                      )}

                      <button
                        onClick={() => downloadEventSummary(event.id)}
                        className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Summary
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedEvent === event.id && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {/* Vendors */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Vendors & Ratings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.vendors.map((vendor) => (
                        <div key={vendor.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{vendor.name}</h5>
                            <span className="text-sm text-purple-600 font-medium">{vendor.service}</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">${vendor.cost.toLocaleString()}</span>
                            {renderStars(vendor.rating)}
                          </div>
                          {vendor.review && (
                            <p className="text-sm text-gray-600 italic">"{vendor.review}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Event Type</h5>
                      <p className="text-gray-600">{event.type}{event.sub_type && ` - ${event.sub_type}`}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Cultural Style</h5>
                      <p className="text-gray-600">{event.cultural_style}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Created On</h5>
                      <p className="text-gray-600">{new Date(event.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <History className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start planning your first event to build your event history.'
              }
            </p>
            <Link
              to="/events/create"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventHistory;