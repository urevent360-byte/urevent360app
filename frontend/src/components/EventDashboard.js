import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, MapPin, Users, DollarSign, Edit3, Save, X, Plus, 
  CheckCircle, AlertCircle, Clock, Building, Phone, Mail, Globe,
  ArrowRight, Settings, CreditCard, Receipt, History, Wand2, Play, ChevronRight, ShoppingCart,
  Info, AlertTriangle, BarChart3, Eye, ChevronDown, Target
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
  const [showNewPlanningConfirm, setShowNewPlanningConfirm] = useState(false);
  const [showStepByStepView, setShowStepByStepView] = useState(false);
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

  // New Planning Confirmation Handler
  const handleStartNewPlanning = () => {
    // Check if user has active planning progress
    if (planningProgress.selectedVendors.length > 0 || planningProgress.completedSteps > 0) {
      setShowNewPlanningConfirm(true);
    } else {
      // No active progress, proceed directly
      window.location.href = '/interactive-planner';
    }
  };

  const handleConfirmNewPlanning = () => {
    setShowNewPlanningConfirm(false);
    window.location.href = '/interactive-planner';
  };

  const handleCancelNewPlanning = () => {
    setShowNewPlanningConfirm(false);
  };

  // Step-by-Step View Handler
  const handleViewStepByStep = () => {
    setShowStepByStepView(true);
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    return Math.round((planningProgress.completedSteps / planningProgress.totalSteps) * 100);
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
                  {/* Left Box: Start New Planning - Purple Theme with Tooltip & Confirmation */}
                  <div className="relative border-2 border-purple-200 rounded-lg p-6 hover:border-purple-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 h-full group">
                    {/* Tooltip */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        Start a brand new event scenario. Your current progress will remain saved.
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                    
                    <div className="text-center h-full flex flex-col justify-between">
                      <div>
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                          <Wand2 className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-center">
                          Start New Planning
                          <Info className="h-4 w-4 text-purple-600 ml-2" />
                        </h4>
                        <p className="text-gray-600 mb-4 text-sm leading-relaxed">Create different scenarios and explore various options for your event</p>
                        <div className="text-xs text-purple-700 bg-purple-100 rounded-full px-3 py-1 inline-block mb-4">
                          ✨ Exploration Mode
                        </div>
                      </div>
                      
                      <button
                        onClick={handleStartNewPlanning}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Wand2 className="h-5 w-5 mr-2" />
                        Start Planning
                      </button>
                    </div>
                  </div>

                  {/* Right Box: Continue Planning - Enhanced with Prominent Details & Progress Badge */}
                  <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 h-full relative">
                    {/* Progress Badge */}
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full h-12 w-12 flex items-center justify-center shadow-lg">
                      {getProgressPercentage()}%
                    </div>
                    
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="text-center mb-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mb-3 shadow-lg">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">Continue Your Event Planning</h4>
                        <p className="text-gray-600 text-sm">Track progress and manage your selections</p>
                        <div className="text-xs text-green-700 bg-green-100 rounded-full px-3 py-1 inline-block mt-2">
                          🎯 Active Progress
                        </div>
                      </div>

                      {/* Enhanced Event Details - More Prominent */}
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 mb-4 border-2 border-green-200 shadow-sm">
                        <div className="text-center mb-3">
                          <h5 className="font-semibold text-green-900 text-sm">{event?.name || 'Event Name'}</h5>
                          <div className="text-xs text-green-700 mt-1">
                            {event?.date ? new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) : 'Date TBD'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-white rounded-lg p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">🎪 {event?.event_type || 'Event Type'}</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">👥 {event?.guest_count || 0} guests</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">💰 {event?.budget ? `$${event.budget.toLocaleString()}` : 'Budget TBD'}</div>
                          </div>
                          <div className="bg-white rounded-lg p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">📍 {event?.location ? event.location.split(',')[0] : 'Location TBD'}</div>
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
                        
                        {/* Selected Vendors Summary */}
                        <div className="text-xs text-gray-600 mb-2">
                          {planningProgress.selectedVendors.length > 0 
                            ? `${planningProgress.selectedVendors.length} vendors selected`
                            : 'No vendors selected yet'
                          }
                        </div>
                        
                        {/* Budget Status */}
                        {planningProgress.totalSpent > 0 && (
                          <div className="bg-green-50 rounded p-2 border border-green-100">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Total Selected:</span>
                              <span className="text-green-600 font-semibold">${planningProgress.totalSpent.toLocaleString()}</span>
                            </div>
                            {event?.budget && (
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-gray-500">Remaining:</span>
                                <span className={`font-semibold ${(event.budget - planningProgress.totalSpent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${(event.budget - planningProgress.totalSpent).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
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
            {/* Enhanced Side-by-Step Planning Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Interactive Event Planning</h3>
              
              {/* Responsive grid that ensures boxes are always next to each other on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Left Box: Start New Planning - Purple Theme with Tooltip & Confirmation */}
                <div className="relative border-2 border-purple-200 rounded-lg p-6 hover:border-purple-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50 h-full group">
                  {/* Tooltip */}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      Start a brand new event scenario. Your current progress will remain saved.
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                  
                  <div className="text-center h-full flex flex-col justify-between">
                    <div>
                      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                        <Wand2 className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-center">
                        Start New Planning
                        <Info className="h-4 w-4 text-purple-600 ml-2" />
                      </h4>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">Create different scenarios and explore various options for your event</p>
                      <div className="text-xs text-purple-700 bg-purple-100 rounded-full px-3 py-1 inline-block mb-4">
                        ✨ Exploration Mode
                      </div>
                    </div>
                    
                    <button
                      onClick={handleStartNewPlanning}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Wand2 className="h-5 w-5 mr-2" />
                      Start Planning
                    </button>
                  </div>
                </div>

                {/* Right Box: Continue Planning - Enhanced Green Theme with Progress Badge */}
                <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 h-full relative">
                  {/* Progress Badge */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full h-12 w-12 flex items-center justify-center shadow-lg">
                    {getProgressPercentage()}%
                  </div>
                  
                  <div className="text-center h-full flex flex-col justify-between">
                    <div>
                      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Continue Your Event Planning</h4>
                      <p className="text-gray-600 mb-2 text-sm leading-relaxed">Pick up where you left off with your event details</p>
                      <div className="text-xs text-green-700 bg-green-100 rounded-full px-3 py-1 inline-block mb-4">
                        🎯 Active Progress
                      </div>
                      
                      {/* Enhanced Event Preview */}
                      <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 mb-4 border-2 border-green-200 shadow-sm">
                        <div className="text-center mb-3">
                          <h5 className="font-semibold text-green-900 text-sm">{event?.name || 'Event Name'}</h5>
                          <div className="text-xs text-green-700 mt-1">
                            {event?.date ? new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) : 'Date TBD'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">🎪 {event?.event_type || 'Event Type'}</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">👥 {event?.guest_count || 0} guests</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">💰 {event?.budget ? `$${event.budget.toLocaleString()}` : 'Budget TBD'}</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">📍 {event?.location ? event.location.split(',')[0] : 'Location TBD'}</div>
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
              
              {/* Direct Step-by-Step Mode Access */}
              <div className="mt-6 text-center">
                <button
                  onClick={handleViewStepByStep}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg mr-4"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Open Progress Dashboard
                </button>
                
                <button
                  onClick={() => setShowVenueSelection(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Building className="h-4 w-4 mr-2" />
                  {event.venue_id ? 'Change Venue' : 'Quick Venue Search'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'venue':
        return <VenueSelection eventId={eventId} onVenueSelected={(venue) => {
          // Refresh event data after venue selection
          fetchEvent();
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
          mode="continue"
          onClose={() => setShowInteractivePlanner(false)}
          onPlanSaved={(bookings) => {
            // Refresh event data after plan is saved
            fetchEvent();
            fetchPlanningProgress();
            setShowInteractivePlanner(false);
          }}
        />
      )}

      {/* Quick Edit Modal */}
      {showQuickEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Event Details</h3>
              <button 
                onClick={() => setShowQuickEdit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  value={quickEditData.name || ''}
                  onChange={(e) => setQuickEditData({...quickEditData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    value={quickEditData.guest_count || ''}
                    onChange={(e) => setQuickEditData({...quickEditData, guest_count: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="number"
                    value={quickEditData.budget || ''}
                    onChange={(e) => setQuickEditData({...quickEditData, budget: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={quickEditData.location || ''}
                  onChange={(e) => setQuickEditData({...quickEditData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowQuickEdit(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveQuickEdit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Planning Confirmation Modal */}
      {showNewPlanningConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Start New Planning Session?</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  You have active planning progress for this event. Starting a new planning session will create a separate scenario while keeping your current progress saved.
                </p>
                <div className="mt-4 bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center text-xs text-purple-700">
                    <Target className="h-4 w-4 mr-2" />
                    <span className="font-medium">Current Progress: {getProgressPercentage()}% complete</span>
                  </div>
                  <div className="flex items-center text-xs text-purple-700 mt-1">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>{planningProgress.selectedVendors.length} vendors selected</span>
                  </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelNewPlanning}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Keep Current Progress
                  </button>
                  <button
                    onClick={handleConfirmNewPlanning}
                    className="px-4 py-2 bg-purple-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Start New Scenario
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Dashboard View Modal */}
      {showStepByStepView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white my-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
                Step-by-Step Progress Dashboard
              </h3>
              <button 
                onClick={() => setShowStepByStepView(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Enhanced Dashboard Content */}
            <div className="space-y-6">
              {/* Progress Timeline */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  Planning Timeline Progress
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Event Planning Phase */}
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-xs font-medium text-green-600">Event Planning</div>
                    <div className="text-xs text-gray-500">Completed ✅</div>
                  </div>
                  
                  {/* Vendor Selection Phase */}
                  <div className="text-center">
                    <div className={`mx-auto w-12 h-12 ${planningProgress.selectedVendors.length > 0 ? 'bg-yellow-100' : 'bg-gray-100'} rounded-full flex items-center justify-center mb-2`}>
                      <Users className={`h-6 w-6 ${planningProgress.selectedVendors.length > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                    </div>
                    <div className={`text-xs font-medium ${planningProgress.selectedVendors.length > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>Vendor Selection</div>
                    <div className="text-xs text-gray-500">
                      {planningProgress.selectedVendors.length > 0 ? 'In Progress 🔄' : 'Pending ⏳'}
                    </div>
                  </div>
                  
                  {/* Contract Review Phase */}
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <Receipt className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-xs font-medium text-gray-500">Contract Review</div>
                    <div className="text-xs text-gray-500">Pending ⏳</div>
                  </div>
                  
                  {/* Payments Phase */}
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-xs font-medium text-gray-500">Payments</div>
                    <div className="text-xs text-gray-500">Pending ⏳</div>
                  </div>
                  
                  {/* Final Checklist Phase */}
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      <CheckCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-xs font-medium text-gray-500">Final Checklist</div>
                    <div className="text-xs text-gray-500">Pending ⏳</div>
                  </div>
                </div>
                
                {/* Overall Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{getProgressPercentage()}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                      style={{width: `${getProgressPercentage()}%`}}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Budget Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-500">Target Budget</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {event?.budget ? `$${event.budget.toLocaleString()}` : 'Not Set'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-500">Committed</div>
                      <div className="text-lg font-semibold text-gray-900">
                        ${planningProgress.totalSpent.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ArrowRight className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-500">Remaining</div>
                      <div className={`text-lg font-semibold ${event?.budget && (event.budget - planningProgress.totalSpent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {event?.budget ? `$${(event.budget - planningProgress.totalSpent).toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Shopping Cart Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingCart className="h-5 w-5 text-purple-600 mr-2" />
                  Shopping Cart Summary
                </h4>
                
                {planningProgress.selectedVendors.length > 0 ? (
                  <div className="space-y-3">
                    {planningProgress.selectedVendors.map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-900">{vendor.vendor_name}</span>
                          <span className="text-sm text-gray-500">({vendor.service_type})</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-green-600 font-semibold">${vendor.price?.toLocaleString()}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Selected</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total Selected:</span>
                        <span className="text-xl font-bold text-green-600">${planningProgress.totalSpent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No vendors selected yet</p>
                    <p className="text-sm">Start planning to add vendors to your cart</p>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowStepByStepView(false);
                    setShowInteractivePlanner(true);
                  }}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg flex items-center"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Continue Interactive Planning
                </button>
                
                <button
                  onClick={() => setShowStepByStepView(false)}
                  className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg"
                >
                  Close Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;