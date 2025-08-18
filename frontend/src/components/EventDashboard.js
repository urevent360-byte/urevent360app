import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, MapPin, Users, DollarSign, Edit3, Save, X, Plus, 
  CheckCircle, AlertCircle, Clock, Building, Phone, Mail, Globe,
  ArrowRight, Settings, CreditCard, Receipt, History, Wand2, Play, ChevronRight, ShoppingCart,
  Info, AlertTriangle, Target, Eye, User, FileText
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
  const [eventQuotes, setEventQuotes] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
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

  useEffect(() => {
    if (event) {
      fetchPlanningProgress();
      fetchEventQuotes();
    }
  }, [event]);

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

  // Start Planning - Direct Route to Step-by-Step
  const handleStartNewPlanning = () => {
    // Check if there are existing in-progress drafts
    const existingDrafts = eventQuotes.filter(quote => quote.status === 'in_progress');
    
    if (existingDrafts.length > 0) {
      // Show continue vs start new prompt  
      setShowNewPlanningConfirm(true);
    } else {
      // No existing drafts, create new and route directly
      createNewDraftAndRoute();
    }
  };

  const handleConfirmNewPlanning = () => {
    // User chose "Start New Quote"
    setShowNewPlanningConfirm(false);
    createNewDraftAndRoute();
  };

  const handleCancelNewPlanning = () => {
    setShowNewPlanningConfirm(false);
  };

  const handleContinueDraft = () => {
    // User chose "Continue Draft" 
    setShowNewPlanningConfirm(false);
    const latestDraft = eventQuotes.filter(quote => quote.status === 'in_progress')[0];
    if (latestDraft) {
      // Route directly to Step-by-Step with existing draft
      routeToStepByStep(latestDraft);
    }
  };

  // Create new draft and route directly to Step-by-Step
  const createNewDraftAndRoute = async () => {
    if (!event?.id) return;

    try {
      // Create a new quote draft with questionnaire sync
      const quoteData = {
        event_id: event.id,
        name: `Draft ${eventQuotes.length + 1}`,
        status: 'in_progress',
        event_type: event.event_type || 'general',
        event_date: event.date,
        budget: event.budget || 0,
        guest_count: event.guest_count || 0,
        location: event.location || '',
        services_needed: event.services_needed || [],
        preferred_venue_type: event.preferred_venue_type || '',
        cultural_style: event.cultural_style || '',
        questionnaire_filters: {
          preferred_venue_type: event.preferred_venue_type || '',
          services_needed: event.services_needed || [],
          guest_count: event.guest_count || 0,
          event_type: event.event_type || 'general',
          cultural_style: event.cultural_style || '',
          budget: event.budget || 0,
          location: event.location || '',
          date: event.date || ''
        },
        created_at: new Date().toISOString()
      };

      const response = await axios.post(`${API}/events/${event.id}/quotes`, quoteData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const newDraft = response.data;

      // Update local quotes list
      setEventQuotes(prev => [...prev, newDraft]);

      // Route DIRECTLY to Step-by-Step Mode with questionnaire filters
      routeToStepByStep(newDraft);
      
    } catch (error) {
      console.error('Error creating draft:', error);
      alert('Failed to create new draft. Please try again.');
    }
  };

  // Route to Step-by-Step Mode with draft context
  const routeToStepByStep = (draft) => {
    // Store draft context for Step-by-Step Mode
    sessionStorage.setItem('activeDraft', JSON.stringify({
      draftId: draft.id,
      eventId: event.id,
      questionnaire_filters: draft.questionnaire_filters || {
        preferred_venue_type: event.preferred_venue_type || '',
        services_needed: event.services_needed || [],
        guest_count: event.guest_count || 0,
        event_type: event.event_type || 'general',
        cultural_style: event.cultural_style || '',
        budget: event.budget || 0,
        location: event.location || '',
        date: event.date || ''
      }
    }));

    // Direct route to Step-by-Step Mode (no intermediate screens)
    setShowInteractivePlanner(true);
  };



  // Calculate progress percentage
  const getProgressPercentage = () => {
    return Math.round((planningProgress.completedSteps / planningProgress.totalSteps) * 100);
  };

  // Fetch quotes for this event
  const fetchEventQuotes = async () => {
    if (!event?.id) return;
    
    setLoadingQuotes(true);
    try {
      const response = await axios.get(`${API}/events/${event.id}/quotes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEventQuotes(response.data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setEventQuotes([]);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Create a new quote and launch Step-by-Step Mode directly
  const handleCreateNewQuote = async () => {
    if (!event?.id) return;

    try {
      // Create a new quote with questionnaire sync
      const quoteData = {
        event_id: event.id,
        name: `Quote ${eventQuotes.length + 1}`,
        status: 'in_progress',
        event_type: event.event_type || 'general',
        event_date: event.date,
        budget: event.budget || 0,
        guest_count: event.guest_count || 0,
        location: event.location || '',
        services_needed: event.services_needed || [],
        preferred_venue_type: event.preferred_venue_type || '',
        cultural_style: event.cultural_style || '',
        questionnaire_filters: {
          preferred_venue_type: event.preferred_venue_type || '',
          services_needed: event.services_needed || [],
          guest_count: event.guest_count || 0,
          event_type: event.event_type || 'general',
          cultural_style: event.cultural_style || '',
          budget: event.budget || 0,
          location: event.location || '',
          date: event.date || ''
        },
        created_at: new Date().toISOString()
      };

      const response = await axios.post(`${API}/events/${event.id}/quotes`, quoteData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const newQuote = response.data;

      // Update local quotes list
      setEventQuotes(prev => [...prev, newQuote]);

      // Launch Step-by-Step Mode DIRECTLY with synced filters
      setShowInteractivePlanner(true);
      
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Failed to create new quote. Please try again.');
    }
  };

  // Resume an existing quote
  const handleResumeQuote = (quote) => {
    // Set the active quote context and launch Step-by-Step Mode
    setShowInteractivePlanner(true);
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
                        Create a new quote with interactive vendor selection and live budget tracking.
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
                        <p className="text-gray-600 mb-4 text-sm leading-relaxed">Create a new quote using interactive vendor selection with real-time budget tracking</p>
                        <div className="text-xs text-purple-700 bg-purple-100 rounded-full px-3 py-1 inline-block mb-4">
                          💼 New Quote Creation
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCreateNewQuote}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Wand2 className="h-5 w-5 mr-2" />
                        Start Planning
                      </button>
                    </div>
                  </div>

                  {/* Right Box: Resume Quote - Only show if quotes exist */}
                  {eventQuotes.length > 0 && (
                    <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 h-full relative">
                      {/* Quotes Count Badge */}
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full h-12 w-12 flex items-center justify-center shadow-lg">
                        {eventQuotes.length}
                      </div>
                      
                      <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="text-center mb-4">
                          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mb-3 shadow-lg">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">Resume Quote</h4>
                          <p className="text-gray-600 text-sm">Continue working on your saved quotes</p>
                          <div className="text-xs text-green-700 bg-green-100 rounded-full px-3 py-1 inline-block mt-2">
                            📋 {eventQuotes.length} Active Quote{eventQuotes.length !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* Latest Quote Preview */}
                        {eventQuotes.length > 0 && (
                          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 mb-4 border-2 border-green-200 shadow-sm">
                            <div className="text-center mb-3">
                              <h5 className="font-semibold text-green-900 text-sm">{eventQuotes[eventQuotes.length - 1]?.name || 'Latest Quote'}</h5>
                              <div className="text-xs text-green-700 mt-1">
                                {eventQuotes[eventQuotes.length - 1]?.status === 'in_progress' ? 'In Progress' : 'Completed'}
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
                                <div className="text-green-800 font-semibold">💰 {eventQuotes[eventQuotes.length - 1]?.total_budget ? `$${eventQuotes[eventQuotes.length - 1].total_budget.toLocaleString()}` : 'Budget TBD'}</div>
                              </div>
                              <div className="bg-white rounded-lg p-2 text-center border border-green-200">
                                <div className="text-green-800 font-semibold">🏪 {eventQuotes[eventQuotes.length - 1]?.vendor_count || 0} vendors</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => handleResumeQuote(eventQuotes[eventQuotes.length - 1])}
                          disabled={loading || eventQuotes.length === 0}
                          className={`w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl ${loading || eventQuotes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume Latest Quote
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unified Event Details - Visual + Editable */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Event Name */}
                <div className="bg-indigo-50 rounded-lg p-4 hover:bg-indigo-100 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <User className="h-6 w-6 text-indigo-600" />
                    <button
                      onClick={() => handleEdit('name', event.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-indigo-500 hover:text-indigo-700 transition-all duration-200"
                      title="Click to edit"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Event Name</div>
                  {editingField === 'name' ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button onClick={() => handleSave('name')} className="p-1 text-green-600 hover:text-green-800">
                        <Save className="h-3 w-3" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-800">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {event.name || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Event Date */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Event Date</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(event.date)}
                  </div>
                </div>
                
                {/* Guest Count */}
                <div className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <button
                      onClick={() => handleEdit('guest_count', event.guest_count)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 transition-all duration-200"
                      title="Click to edit"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Guest Count</div>
                  {editingField === 'guest_count' ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={editValues.guest_count}
                        onChange={(e) => setEditValues({ ...editValues, guest_count: e.target.value })}
                        className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button onClick={() => handleSave('guest_count')} className="p-1 text-green-600 hover:text-green-800">
                        <Save className="h-3 w-3" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-800">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900">
                      {event.guest_count || 'TBD'}
                    </div>
                  )}
                </div>
                
                {/* Budget */}
                <div className="bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <button
                      onClick={() => handleEdit('budget', event.budget)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-green-500 hover:text-green-700 transition-all duration-200"
                      title="Click to edit"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Budget</div>
                  {editingField === 'budget' ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={editValues.budget}
                        onChange={(e) => setEditValues({ ...editValues, budget: e.target.value })}
                        className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <button onClick={() => handleSave('budget')} className="p-1 text-green-600 hover:text-green-800">
                        <Save className="h-3 w-3" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-800">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(event.budget)}
                    </div>
                  )}
                </div>
                
                {/* Location */}
                <div className="bg-orange-50 rounded-lg p-4 hover:bg-orange-100 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <MapPin className="h-6 w-6 text-orange-600" />
                    <button
                      onClick={() => handleEdit('location', event.location)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-orange-500 hover:text-orange-700 transition-all duration-200"
                      title="Click to edit"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</div>
                  {editingField === 'location' ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={editValues.location}
                        onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                        className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <button onClick={() => handleSave('location')} className="p-1 text-green-600 hover:text-green-800">
                        <Save className="h-3 w-3" />
                      </button>
                      <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-800">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {event.location || 'TBD'}
                    </div>
                  )}
                </div>
              </div>

              {/* Description Section - Expanded */}
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 text-purple-600 mr-2" />
                    Event Description
                  </h3>
                  <button
                    onClick={() => handleEdit('description', event.description)}
                    className="p-2 text-purple-500 hover:text-purple-700 transition-colors"
                    title="Click to edit description"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
                {editingField === 'description' ? (
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={editValues.description}
                      onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Add event description..."
                    />
                    <div className="flex flex-col space-y-1">
                      <button onClick={() => handleSave('description')} className="p-2 text-green-600 hover:text-green-800">
                        <Save className="h-4 w-4" />
                      </button>
                      <button onClick={handleCancel} className="p-2 text-red-600 hover:text-red-800">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 bg-gray-50 rounded-lg p-4 min-h-16">
                    {event.description || (
                      <span className="text-gray-400 italic">No description added yet. Click the edit button to add one.</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Event Information - Questionnaire Fields */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 text-orange-600 mr-2" />
                  Event Information
                </h3>
                <button
                  onClick={() => setEditingEventInfo(!editingEventInfo)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    editingEventInfo 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {editingEventInfo ? 'Cancel Editing' : 'Edit Event Info'}
                </button>
              </div>

              {editingEventInfo ? (
                /* Editing Mode - Full Questionnaire */
                <div className="space-y-6">
                  {/* Event Type & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editValues.event_type}
                        onChange={(e) => setEditValues({ ...editValues, event_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select Event Type</option>
                        <option value="wedding">Wedding</option>
                        <option value="quinceanera">Quinceañera</option>
                        <option value="sweet_16">Sweet 16</option>
                        <option value="bat_mitzvah">Bat Mitzvah</option>
                        <option value="corporate">Corporate Event</option>
                        <option value="birthday">Birthday Party</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="graduation">Graduation</option>
                        <option value="baby_shower">Baby Shower</option>
                        <option value="retirement">Retirement Party</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={editValues.date}
                        onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Cultural Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cultural Style
                    </label>
                    <select
                      value={editValues.cultural_style}
                      onChange={(e) => setEditValues({ ...editValues, cultural_style: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Cultural Style (Optional)</option>
                      <option value="american">American</option>
                      <option value="indian">Indian</option>
                      <option value="hispanic">Hispanic</option>
                      <option value="jewish">Jewish</option>
                      <option value="african">African</option>
                      <option value="asian">Asian</option>
                      <option value="middle_eastern">Middle Eastern</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Preferred Venue Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Venue Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editValues.preferred_venue_type}
                      onChange={(e) => setEditValues({ ...editValues, preferred_venue_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Select Venue Type</option>
                      <option value="indoor">Indoor Venue</option>
                      <option value="outdoor">Outdoor Venue</option>
                      <option value="hotel">Hotel/Banquet Hall</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="at_home">At-Home/Private Residence</option>
                      <option value="my_own_private_space">My Own Private Space</option>
                      <option value="i_already_have_a_venue">I Already Have a Venue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Services Needed */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Services Needed <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        'catering', 'decoration', 'photography', 'music_dj', 
                        'transportation', 'lighting', 'security', 'videography',
                        'flowers', 'entertainment'
                      ].map((service) => (
                        <label key={service} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editValues.services_needed?.includes(service) || false}
                            onChange={(e) => {
                              const currentServices = editValues.services_needed || [];
                              if (e.target.checked) {
                                setEditValues({
                                  ...editValues,
                                  services_needed: [...currentServices, service]
                                });
                              } else {
                                setEditValues({
                                  ...editValues,
                                  services_needed: currentServices.filter(s => s !== service)
                                });
                              }
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {service.replace('_', ' / ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setEditingEventInfo(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEventInfo}
                      disabled={savingEventInfo}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {savingEventInfo ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        'Save Event Info'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode - Current Event Information */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Event Type</div>
                      <div className="text-lg text-gray-900 capitalize">
                        {event.event_type?.replace('_', ' ') || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Cultural Style</div>
                      <div className="text-lg text-gray-900 capitalize">
                        {event.cultural_style?.replace('_', ' ') || 'Not specified'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Preferred Venue Type</div>
                      <div className="text-lg text-gray-900 capitalize">
                        {event.preferred_venue_type?.replace('_', ' ') || 'Not specified'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500 mb-1">Services Needed</div>
                      <div className="flex flex-wrap gap-2">
                        {event.services_needed && event.services_needed.length > 0 ? (
                          event.services_needed.map((service, index) => (
                            <span
                              key={index}
                              className="inline-flex px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full capitalize"
                            >
                              {service.replace('_', ' / ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">No services specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quotes Section - Event Profile Integration */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Receipt className="h-5 w-5 text-purple-600 mr-2" />
                  Event Quotes
                </h3>
                <div className="flex items-center space-x-2">
                  {loadingQuotes && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  )}
                  <span className="text-sm text-gray-500">
                    {eventQuotes.length} quote{eventQuotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {eventQuotes.length === 0 ? (
                /* No Quotes State */
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium mb-1">No quotes created yet</p>
                  <p className="text-sm text-gray-500 mb-4">Start planning to create your first quote with vendor selections</p>
                  <button
                    onClick={handleCreateNewQuote}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Create First Quote
                  </button>
                </div>
              ) : (
                /* Quotes List */
                <div className="space-y-4">
                  {eventQuotes.map((quote, index) => (
                    <div key={quote.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors bg-gradient-to-r from-gray-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{quote.name || `Quote ${index + 1}`}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              quote.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {quote.status === 'completed' ? '✅ Completed' : '⏳ In Progress'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">
                                {quote.event_date ? new Date(quote.event_date).toLocaleDateString() : 'Date TBD'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🎪</span>
                              <span className="text-gray-600 capitalize">{quote.event_type || 'General'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-gray-900 font-semibold">
                                ${quote.total_budget ? quote.total_budget.toLocaleString() : '0'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-600">
                                {quote.vendor_count || 0} vendor{(quote.vendor_count || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Quote Summary */}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              Created: {quote.created_at ? new Date(quote.created_at).toLocaleDateString() : 'Recently'}
                            </div>
                            <div className="flex items-center space-x-1">
                              {quote.vendor_count > 0 && (
                                <div className="flex -space-x-1">
                                  {Array.from({length: Math.min(quote.vendor_count, 5)}).map((_, i) => (
                                    <div key={i} className="w-5 h-5 bg-purple-200 rounded-full border border-white flex items-center justify-center text-xs">
                                      {i + 1}
                                    </div>
                                  ))}
                                  {quote.vendor_count > 5 && (
                                    <div className="w-5 h-5 bg-gray-200 rounded-full border border-white flex items-center justify-center text-xs">
                                      +{quote.vendor_count - 5}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Quote Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleResumeQuote(quote)}
                            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {quote.status === 'completed' ? 'View' : 'Resume'}
                          </button>
                          <button
                            onClick={() => {
                              // Add edit functionality here
                              console.log('Edit quote:', quote);
                            }}
                            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              // Add view details functionality here
                              console.log('View quote details:', quote);
                            }}
                            className="px-3 py-2 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add New Quote Button */}
                  <button
                    onClick={handleCreateNewQuote}
                    className="w-full p-4 border-2 border-dashed border-purple-300 rounded-lg text-purple-700 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Quote
                  </button>
                </div>
              )}
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
              
              {/* Quick Actions */}
              <div className="mt-6 text-center">
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

      {/* Draft Selection Modal */}
      {showNewPlanningConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Pick up where you left off?</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  You have a quote in progress. Continue that draft or start a new quote.
                </p>
                {(() => {
                  const existingDrafts = eventQuotes.filter(quote => quote.status === 'in_progress');
                  const latestDraft = existingDrafts[0];
                  
                  if (latestDraft) {
                    return (
                      <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="text-center mb-2">
                          <h4 className="font-medium text-green-900 text-sm">{latestDraft.name}</h4>
                          <p className="text-xs text-green-700 mt-1">
                            {latestDraft.vendor_count || 0} vendor{(latestDraft.vendor_count || 0) !== 1 ? 's' : ''} selected
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white rounded p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">💰 ${latestDraft.total_budget?.toLocaleString() || '0'}</div>
                          </div>
                          <div className="bg-white rounded p-2 text-center border border-green-200">
                            <div className="text-green-800 font-semibold">📅 {latestDraft.created_at ? new Date(latestDraft.created_at).toLocaleDateString() : 'Recent'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleContinueDraft}
                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Continue Draft
                  </button>
                  <button
                    onClick={handleConfirmNewPlanning}
                    className="px-4 py-2 bg-purple-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Start New Quote
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default EventDashboard;