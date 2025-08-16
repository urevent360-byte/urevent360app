import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, MapPin, Users, DollarSign, Edit3, Save, X, Plus, 
  CheckCircle, AlertCircle, Clock, Building, Phone, Mail, Globe,
  ArrowRight, Settings, CreditCard, Receipt, History, Wand2
} from 'lucide-react';
import BudgetTracker from './BudgetTracker';
import PaymentHistory from './PaymentHistory';
import VenueSelection from './VenueSelection';
import InteractiveEventPlanner from './InteractiveEventPlanner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showVenueSelection, setShowVenueSelection] = useState(false);
  const [showInteractivePlanner, setShowInteractivePlanner] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/events/${eventId}`);
      setEvent(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load event details');
      console.error('Event fetch error:', err);
      if (err.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue || '' });
  };

  const handleSave = async (field) => {
    try {
      const updateData = { [field]: editValues[field] };
      
      // Convert string numbers to proper types
      if (field === 'budget' || field === 'guest_count') {
        updateData[field] = parseFloat(editValues[field]) || null;
      }
      
      const response = await axios.put(`${API}/events/${eventId}`, updateData);
      setEvent(response.data);
      setEditingField(null);
      setEditValues({});
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update event');
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-800 bg-green-100';
      case 'booked': return 'text-blue-800 bg-blue-100';
      case 'planning': return 'text-yellow-800 bg-yellow-100';
      case 'cancelled': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Calendar },
    { id: 'planner', name: 'Interactive Planner', icon: Wand2 },
    { id: 'venue', name: 'Venue', icon: Building },
    { id: 'budget', name: 'Budget Tracker', icon: DollarSign },
    { id: 'payments', name: 'Payment History', icon: History },
    { id: 'vendors', name: 'Vendors', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const renderEditableField = (field, label, value, type = 'text', multiline = false) => {
    if (editingField === field) {
      return (
        <div className="flex items-center space-x-2">
          {multiline ? (
            <textarea
              value={editValues[field]}
              onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          ) : (
            <input
              type={type}
              value={editValues[field]}
              onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          )}
          <button
            onClick={() => handleSave(field)}
            className="p-2 text-green-600 hover:text-green-800"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-2 text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group">
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className="text-lg text-gray-900">
            {type === 'currency' ? formatCurrency(value) : (value || 'Not set')}
          </div>
        </div>
        <button
          onClick={() => handleEdit(field, value)}
          className="opacity-70 group-hover:opacity-100 p-2 text-purple-500 hover:text-purple-700 transition-opacity"
          title="Click to edit"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Event Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Event Status</h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
              
              {!event.venue_id && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-4">
                      Interactive Event Planner
                    </h4>
                    <Link
                      to="/interactive-planner"
                      className="inline-flex items-center px-8 py-3 bg-white text-purple-700 font-semibold rounded-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Start Planning
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-500">Event Date</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(event.date)}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-500">Guest Count</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {event.guest_count || 'TBD'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-500">Budget</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(event.budget)}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-500">Location</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {event.location || 'TBD'}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Event Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Event Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderEditableField('name', 'Event Name', event.name)}
                {renderEditableField('description', 'Description', event.description, 'text', true)}
                {renderEditableField('budget', 'Budget', event.budget, 'number')}
                {renderEditableField('guest_count', 'Guest Count', event.guest_count, 'number')}
                {renderEditableField('location', 'Location', event.location)}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    console.log('🔍 Start Planning clicked');
                    console.log('🔍 Current event data:', event);
                    setShowInteractivePlanner(true);
                  }}
                  className="w-full text-left p-3 border border-purple-200 rounded-lg hover:bg-purple-50 bg-gradient-to-r from-purple-50 to-blue-50"
                >
                  <div className="flex items-center">
                    <Wand2 className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Interactive Event Planner</p>
                      <p className="text-xs text-purple-700">Step-by-step vendor selection with comparison</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowVenueSelection(true)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {event.venue_id ? 'Change Venue' : 'Find Venues'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.venue_id ? 'Update venue selection' : 'Browse available venues'}
                      </p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Browse Vendors</p>
                      <p className="text-xs text-gray-500">Find service providers individually</p>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Set Up Budget Tracker</p>
                      <p className="text-xs text-gray-500">Plan your expenses</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'planner':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <Wand2 className="mx-auto h-16 w-16 text-purple-500 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Interactive Event Planner</h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Plan your entire event step-by-step with our interactive wizard. Compare vendors, 
                build your perfect event package, and track your budget in real-time.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-purple-600 mb-2">🎯</div>
                  <h4 className="font-medium text-gray-900">Step-by-Step Process</h4>
                  <p className="text-sm text-gray-600">Navigate through each service category at your own pace</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-blue-600 mb-2">💰</div>
                  <h4 className="font-medium text-gray-900">Real-Time Budget</h4>
                  <p className="text-sm text-gray-600">See how your choices affect your budget instantly</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-green-600 mb-2">⚖️</div>
                  <h4 className="font-medium text-gray-900">Compare Options</h4>
                  <p className="text-sm text-gray-600">Try different vendor combinations and scenarios</p>
                </div>
              </div>

              <button
                onClick={() => setShowInteractivePlanner(true)}
                className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Wand2 className="h-6 w-6 mr-2" />
                Start Interactive Planning
              </button>
            </div>
          </div>
        );

      case 'venue':
        return (
          <div className="space-y-6">
            {event.venue_id ? (
              /* Venue Selected */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Selected Venue</h3>
                  <button
                    onClick={() => setShowVenueSelection(true)}
                    className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200"
                  >
                    Change Venue
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{event.venue_name}</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {event.venue_address && (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                          <span>{event.venue_address}</span>
                        </div>
                      )}
                      {event.venue_contact?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{event.venue_contact.phone}</span>
                        </div>
                      )}
                      {event.venue_contact?.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>{event.venue_contact.email}</span>
                        </div>
                      )}
                      {event.venue_contact?.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2" />
                          <a href={event.venue_contact.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">
                            {event.venue_contact.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Venue Details</h5>
                    <p className="text-sm text-gray-600">
                      Contact the venue directly for detailed information about their services, 
                      availability, and pricing for your event date.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* No Venue Selected */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mb-6">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Interactive Event Planner</h3>
                  
                  <Link
                    to="/interactive-planner"
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg mr-4"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Start Planning
                  </Link>
                  
                  <button
                    onClick={() => setShowVenueSelection(true)}
                    className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Quick Venue Only
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'budget':
        return <BudgetTracker eventId={eventId} />;

      case 'payments':
        return <PaymentHistory eventId={eventId} />;

      case 'vendors':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Vendor Management</h3>
              <p className="mt-1 text-sm text-gray-500 mb-6">
                Browse and book vendors for your event
              </p>
              <button
                onClick={() => navigate(`/events/${eventId}/vendors`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Browse Vendors
              </button>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Event Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Event Status</h4>
                    <p className="text-sm text-gray-500">Change the current status of your event</p>
                  </div>
                  <select
                    value={event.status}
                    onChange={(e) => handleSave('status')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Event</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchEvent}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1).replace('_', ' ')}
                {event.cultural_style && ` • ${event.cultural_style.charAt(0).toUpperCase() + event.cultural_style.slice(1).replace('_', ' ')} Style`}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(event.status)}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>

      {/* Venue Selection Modal */}
      {showVenueSelection && (
        <VenueSelection
          eventId={eventId}
          currentEvent={event}
          onClose={() => setShowVenueSelection(false)}
          onVenueSelected={(updatedEvent) => {
            setEvent(updatedEvent);
            setShowVenueSelection(false);
          }}
        />
      )}

      {/* Interactive Event Planner Modal */}
      {showInteractivePlanner && event && (
        <InteractiveEventPlanner
          eventId={eventId}
          currentEvent={event}
          onClose={() => {
            console.log('🔍 Closing InteractiveEventPlanner');
            setShowInteractivePlanner(false);
          }}
          onPlanSaved={(bookings) => {
            // Refresh event data after plan is saved
            console.log('🔍 Plan saved, refreshing event data');
            fetchEvent();
            setShowInteractivePlanner(false);
          }}
        />
      )}
    </div>
  );
};

export default EventDashboard;