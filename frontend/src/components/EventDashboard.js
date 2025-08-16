import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, MapPin, Users, DollarSign, Edit3, Save, X, Plus, 
  CheckCircle, AlertCircle, Clock, Building, Phone, Mail, Globe,
  ArrowRight, Settings, CreditCard, Receipt, History, Wand2, Play, ChevronRight
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
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [quickEditData, setQuickEditData] = useState({});
  const [planningProgress, setPlanningProgress] = useState({
    selectedVendors: [],
    completedSteps: 0,
    totalSteps: 10,
    totalSpent: 0
  });

  useEffect(() => {
    fetchEvent();
    fetchPlanningProgress();
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

  const handleQuickEdit = () => {
    setQuickEditData({
      name: event?.name || '',
      event_type: event?.event_type || '',
      guest_count: event?.guest_count || '',
      budget: event?.budget || '',
      location: event?.location || ''
    });
    setShowQuickEdit(true);
  };

  const saveQuickEdit = async () => {
    try {
      setLoading(true);
      await axios.put(`${API}/events/${eventId}`, quickEditData);
      setEvent({ ...event, ...quickEditData });
      setShowQuickEdit(false);
    } catch (err) {
      console.error('Quick edit error:', err);
      setError('Failed to update event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanningProgress = async () => {
    try {
      // Fetch planning state and cart to show progress
      const [stateResponse, cartResponse] = await Promise.all([
        axios.get(`${API}/events/${eventId}/planner/state`),
        axios.get(`${API}/events/${eventId}/cart`)
      ]);

      const cart = cartResponse.data.cart || [];
      const completedSteps = cart.length > 0 ? Math.min(cart.length + 1, 10) : 0;
      const totalSpent = cart.reduce((sum, item) => sum + (item.price || 0), 0);

      setPlanningProgress({
        selectedVendors: cart,
        completedSteps,
        totalSteps: 10,
        totalSpent
      });
    } catch (err) {
      console.error('Planning progress fetch error:', err);
      // Set default values if fetch fails
      setPlanningProgress({
        selectedVendors: [],
        completedSteps: 0,
        totalSteps: 10,
        totalSpent: 0
      });
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
              
              {/* Enhanced Side-by-Side Planning Options */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Interactive Event Planning</h3>
                
                {/* Responsive grid that ensures boxes are always next to each other on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Left Box: Start New Planning - Purple Theme */}
                  <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 h-full">
                    <div className="text-center h-full flex flex-col justify-between">
                      <div>
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                          <Wand2 className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Start New Planning</h4>
                        <p className="text-gray-600 mb-6 text-sm leading-relaxed">Create different scenarios and explore various options for your event</p>
                      </div>
                      
                      <Link
                        to="/interactive-planner"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Wand2 className="h-5 w-5 mr-2" />
                        Start Planning
                      </Link>
                    </div>
                  </div>

                  {/* Right Box: Continue Planning - Enhanced Interactive Progress Tracker */}
                  <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 h-full">
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="text-center mb-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mb-3 shadow-lg">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Continue Your Event Planning</h4>
                        <p className="text-gray-600 text-sm">Track progress and manage your selections</p>
                      </div>

                      {/* Event Info Summary - Editable */}
                      <div className="bg-white rounded-lg p-3 mb-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 text-sm">Event Details</h5>
                          <button 
                            onClick={handleQuickEdit}
                            className="text-green-600 hover:text-green-700 p-1"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center space-x-1 text-gray-700">
                            <span>🎪</span>
                            <span className="font-medium">{event?.event_type || 'Event Type'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-700">
                            <span>👥</span>
                            <span className="font-medium">{event?.guest_count || 0} guests</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-700">
                            <span>💰</span>
                            <span className="font-medium">{event?.budget ? `$${event.budget.toLocaleString()}` : 'Budget TBD'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-gray-700">
                            <span>📍</span>
                            <span className="font-medium truncate">{event?.location || 'Location TBD'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Tracker */}
                      <div className="bg-white rounded-lg p-3 mb-4 border border-green-200 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 text-sm">Planning Progress</h5>
                          <span className="text-xs text-green-600 font-medium">
                            {planningProgress.completedSteps}/{planningProgress.totalSteps} Complete
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300" 
                            style={{width: `${(planningProgress.completedSteps / planningProgress.totalSteps) * 100}%`}}
                          ></div>
                        </div>
                        
                        {/* Selected Vendors - Real Data */}
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {planningProgress.selectedVendors.length > 0 ? (
                            planningProgress.selectedVendors.map((vendor, index) => (
                              <div key={index} className="flex items-center justify-between text-xs bg-green-50 rounded p-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">
                                    {vendor.service_type === 'venue' && '🏛️'}
                                    {vendor.service_type === 'catering' && '🍽️'}
                                    {vendor.service_type === 'photography' && '📸'}
                                    {vendor.service_type === 'decoration' && '🎨'}
                                    {vendor.service_type === 'dj' && '🎵'}
                                    {vendor.service_type === 'bar' && '🍸'}
                                    {vendor.service_type === 'planner' && '📋'}
                                    {vendor.service_type === 'staffing' && '👥'}
                                    {vendor.service_type === 'entertainment' && '🎭'}
                                    {!['venue', 'catering', 'photography', 'decoration', 'dj', 'bar', 'planner', 'staffing', 'entertainment'].includes(vendor.service_type) && '🔧'}
                                    {vendor.vendor_name}
                                  </span>
                                </div>
                                <span className="text-green-600">${vendor.price?.toLocaleString()}</span>
                              </div>
                            ))
                          ) : (
                            <>
                              {/* Mock data when no real selections exist */}
                              <div className="flex items-center justify-between text-xs bg-gray-50 rounded p-2 opacity-60">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                  <span>🏛️ Select Venue</span>
                                </div>
                                <span className="text-gray-500">Pending</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs bg-gray-50 rounded p-2 opacity-60">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                  <span>🍽️ Choose Catering</span>
                                </div>
                                <span className="text-gray-500">Pending</span>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs bg-gray-50 rounded p-2 opacity-60">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                  <span>📸 Book Photography</span>
                                </div>
                                <span className="text-gray-500">Pending</span>
                              </div>
                            </>
                          )}
                          
                          {/* Total Spent */}
                          {planningProgress.totalSpent > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-gray-600">Total Selected:</span>
                                <span className="text-green-600">${planningProgress.totalSpent.toLocaleString()}</span>
                              </div>
                              {event?.budget && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500">Remaining:</span>
                                  <span className={`${(event.budget - planningProgress.totalSpent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${(event.budget - planningProgress.totalSpent).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          if (!loading && event) {
                            setShowInteractivePlanner(true);
                          }
                        }}
                        disabled={loading || !event}
                        className={`w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ${loading || !event ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume Planning
                      </button>
                    </div>
                  </div>
                </div>
              </div>

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

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowVenueSelection(true)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Browse Vendors</p>
                      <p className="text-xs text-gray-500">Find service providers individually</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Budget Tracker</p>
                      <p className="text-xs text-gray-500">Monitor your expenses</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'planner':
        return (
          <div className="space-y-6">
            {/* Enhanced Side-by-Side Planning Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Interactive Event Planning</h3>
              
              {/* Responsive grid that ensures boxes are always next to each other on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Left Box: Start New Planning - Purple Theme */}
                <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 h-full">
                  <div className="text-center h-full flex flex-col justify-between">
                    <div>
                      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                        <Wand2 className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Start New Planning</h4>
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed">Create different scenarios and explore various options for your event</p>
                    </div>
                    
                    <Link
                      to="/interactive-planner"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Wand2 className="h-5 w-5 mr-2" />
                      Start Planning
                    </Link>
                  </div>
                </div>

                {/* Right Box: Continue Planning - Enhanced Green Theme */}
                <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 h-full">
                  <div className="text-center h-full flex flex-col justify-between">
                    <div>
                      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Continue Your Event Planning</h4>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">Pick up where you left off with your event details</p>
                      
                      {/* Enhanced Event Preview */}
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 mb-4 border border-green-200">
                        <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-base">🎪</span>
                            <span className="font-medium">{event?.event_type || 'Event Type'}</span>
                          </div>
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-base">👥</span>
                            <span className="font-medium">{event?.guest_count || 0} guests</span>
                          </div>
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-base">💰</span>
                            <span className="font-medium">{event?.budget ? `$${event.budget.toLocaleString()}` : 'Budget TBD'}</span>
                          </div>
                          <div className="flex items-center justify-center space-x-1">
                            <span className="text-base">📍</span>
                            <span className="font-medium truncate">{event?.location || 'Location TBD'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (!loading && event) {
                          setShowInteractivePlanner(true);
                        }
                      }}
                      disabled={loading || !event}
                      className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ${loading || !event ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Continue Planning
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Quick Venue Selection Option */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowVenueSelection(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Building className="h-4 w-4 mr-2" />
                  {event.venue_id ? 'Change Venue' : 'Quick Venue Search Only'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'venue':
        return <VenueSelection eventId={eventId} onVenueSelected={(venue) => {
          // Refresh event data after venue selection
          fetchEventData();
        }} />;

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
          onClose={() => setShowInteractivePlanner(false)}
          onPlanSaved={(bookings) => {
            // Refresh event data after plan is saved
            fetchEvent();
            setShowInteractivePlanner(false);
          }}
        />
      )}
    </div>
  );
};

export default EventDashboard;