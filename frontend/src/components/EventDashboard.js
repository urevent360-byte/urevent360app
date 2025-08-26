import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
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
import StepByStepCTA from './StepByStepCTA';
import StickyPlanBar from './StickyPlanBar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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

  // Event Info Editing State
  const [editingEventInfo, setEditingEventInfo] = useState(false);
  const [savingEventInfo, setSavingEventInfo] = useState(false);

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

  // Initialize edit values when event is loaded or updated
  useEffect(() => {
    if (event && editingEventInfo) {
      initializeEditValues();
    }
  }, [event]);

  // Handle success message from wizard redirect
  useEffect(() => {
    if (location.state?.fromWizard && location.state?.showMessage) {
      setSuccessMessage(location.state.showMessage);
      // Clear the message after 3 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Handle auto-opening Step-by-Step planner on first visit from wizard
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('openPlanner') === '1' && event) {
      // Auto-open Step-by-Step Mode and remove the parameter
      console.log('📊 Auto-opening Step-by-Step planner from wizard');
      navigate(`/events/${eventId}/plan`, { replace: true });
    }
  }, [event, location.search, eventId, navigate]);

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

  const handleCreateNewQuote = () => {
    console.log('Creating new quote for event:', eventId);
    setShowNewPlanningConfirm(true);
  };

  const confirmNewPlanning = () => {
    setShowNewPlanningConfirm(false);
    setShowInteractivePlanner(true);
  };

  const handleResumeQuote = (quote) => {
    console.log('Resuming quote:', quote.id);
    // Navigate to quote or open planner with quote context
    setShowInteractivePlanner(true);
  };

  const fetchPlanningProgress = async () => {
    try {
      const response = await axios.get(`${API}/events/${eventId}/progress`);
      setPlanningProgress(response.data);
    } catch (err) {
      // Use mock data if API fails
      setPlanningProgress({
        selectedVendors: [],
        completedSteps: Math.floor(Math.random() * 8),
        totalSteps: 10,
        totalSpent: Math.floor(Math.random() * 15000)
      });
    }
  };

  const fetchEventQuotes = async () => {
    try {
      setLoadingQuotes(true);
      const response = await axios.get(`${API}/events/${eventId}/quotes`);
      setEventQuotes(response.data.quotes || []);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
      // Use mock data for development
      setEventQuotes([
        {
          id: 'quote1',
          name: 'Wedding Quote - Elegant',
          status: 'in_progress',
          total_budget: 25000,
          vendor_count: 5,
          event_type: 'wedding',
          event_date: event?.date,
          created_at: new Date().toISOString()
        },
        {
          id: 'quote2', 
          name: 'Wedding Quote - Budget-Friendly',
          status: 'completed',
          total_budget: 15000,
          vendor_count: 3,
          event_type: 'wedding',
          event_date: event?.date,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'booked': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = () => {
    return Math.round((planningProgress.completedSteps / planningProgress.totalSteps) * 100);
  };

  const handleSave = async (field) => {
    try {
      setLoading(true);
      const updateData = { [field]: editValues[field] };
      await axios.put(`${API}/events/${eventId}`, updateData);
      setEvent({ ...event, ...updateData });
      setEditingField(null);
      setError('');
    } catch (err) {
      setError('Failed to update event');
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Enhanced Event Info Save Function
  const handleSaveEventInfo = async () => {
    try {
      setSavingEventInfo(true);
      
      // Validate required fields
      if (!editValues.event_type || !editValues.preferred_venue_type || !editValues.services_needed?.length) {
        setError('Please fill in all required fields (Event Type, Venue Type, and at least one service)');
        return;
      }

      const updateData = {
        event_type: editValues.event_type,
        date: editValues.date,
        cultural_style: editValues.cultural_style,
        preferred_venue_type: editValues.preferred_venue_type,
        services_needed: editValues.services_needed
      };

      await axios.put(`${API}/events/${eventId}`, updateData);
      setEvent({ ...event, ...updateData });
      setEditingEventInfo(false);
      setError('');
      
      // Success notification could be added here
      console.log('Event information updated successfully');
      
    } catch (err) {
      setError('Failed to update event information. Please try again.');
      console.error('Event info save error:', err);
    } finally {
      setSavingEventInfo(false);
    }
  };

  const initializeEditValues = () => {
    setEditValues({
      event_type: event?.event_type || '',
      date: formatDateForInput(event?.date),
      cultural_style: event?.cultural_style || '',
      preferred_venue_type: event?.preferred_venue_type || '',
      services_needed: event?.services_needed || []
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Step-by-Step Mode Primary CTA */}
            <div className="bg-white rounded-lg shadow-sm">
              <StepByStepCTA 
                eventId={eventId} 
                onOpenPlanner={() => setShowInteractivePlanner(true)}
              />
            </div>

            {/* Event Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Event Status</h3>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              </div>
              
              {/* Secondary Planning Options - Demoted */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Planning Tools</h4>
                
                {/* Responsive grid that ensures boxes are always next to each other on larger screens */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Left Box: Start New Planning - Demoted (no gradient, smaller) */}
                  <div className="relative border border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-all duration-300 hover:shadow-sm bg-white h-full group">
                    <div className="text-center h-full flex flex-col justify-between">
                      <div>
                        <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <Wand2 className="h-6 w-6 text-gray-600" />
                        </div>
                        <h5 className="text-base font-medium text-gray-900 mb-2">
                          Start Planning
                        </h5>
                        <p className="text-gray-600 mb-3 text-sm">Create a new quote using interactive vendor selection</p>
                        <div className="text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1 inline-block mb-3">
                          💼 Interactive Planner
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCreateNewQuote}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Start Planning
                      </button>
                    </div>
                  </div>

                  {/* Right Box: Resume Quote - Only show if quotes exist */}
                  {eventQuotes.length > 0 && (
                    <div className="border border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-all duration-300 hover:shadow-sm bg-white h-full relative">
                      {/* Quotes Count Badge */}
                      <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center">
                        {eventQuotes.length}
                      </div>
                      
                      <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="text-center mb-3">
                          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                            <Play className="h-6 w-6 text-gray-600" />
                          </div>
                          <h5 className="text-base font-medium text-gray-900 mb-1">Resume Quote</h5>
                          <p className="text-gray-600 text-sm">Continue saved quotes</p>
                          <div className="text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1 inline-block mt-2">
                            📋 {eventQuotes.length} Quote{eventQuotes.length !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* Latest Quote Preview - Simplified */}
                        {eventQuotes.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3 border">
                            <div className="text-center mb-2">
                              <h6 className="font-medium text-gray-900 text-sm">{eventQuotes[eventQuotes.length - 1]?.name || 'Latest Quote'}</h6>
                              <div className="text-xs text-gray-600 mt-1">
                                {eventQuotes[eventQuotes.length - 1]?.status === 'in_progress' ? 'In Progress' : 'Completed'}
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleResumeQuote(eventQuotes[eventQuotes.length - 1])}
                          className="mt-auto inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume Quote
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Event Information</h3>
                <button
                  onClick={() => {
                    if (editingEventInfo) {
                      setEditingEventInfo(false);
                    } else {
                      initializeEditValues();
                      setEditingEventInfo(true);
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {editingEventInfo ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Info
                    </>
                  )}
                </button>
              </div>

              {editingEventInfo ? (
                /* Edit Mode - Enhanced Event Information Form */
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Event Type */}
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
                      <option value="birthday">Birthday Party</option>
                      <option value="anniversary">Anniversary</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="quinceañera">Quinceañera</option>
                      <option value="graduation">Graduation</option>
                      <option value="baby_shower">Baby Shower</option>
                      <option value="retirement">Retirement Party</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Event Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={editValues.date}
                      onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
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
                      <option value="">Select Cultural Style</option>
                      <option value="american">American</option>
                      <option value="hispanic">Hispanic/Latino</option>
                      <option value="indian">Indian</option>
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

            {/* Sticky Plan Bar for Mobile */}
            <StickyPlanBar 
              eventId={eventId} 
              onOpenPlanner={() => setShowInteractivePlanner(true)}
            />
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
        return <div>Tab content not found</div>;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'planner', name: 'Planner', icon: Wand2 },
    { id: 'venue', name: 'Venue', icon: Building },
    { id: 'budget', name: 'Budget', icon: DollarSign },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'vendors', name: 'Vendors', icon: Users },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const handleStartNewPlanning = () => {
    setShowNewPlanningConfirm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to load event</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowRight className="h-5 w-5 transform rotate-180 mr-2" />
                Back to Events
              </button>
              <div className="h-8 border-l border-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDateForDisplay(event.date)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.location || 'Location TBD'}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {event.guest_count || 0} guests
                  </div>
                  {event.budget && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {formatCurrency(event.budget)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleQuickEdit}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Quick Edit
              </button>
              <button
                onClick={() => navigate(`/events/${eventId}/guests`)}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Guests
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                  {tab.id === 'planner' && planningProgress.completedSteps > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {getProgressPercentage()}%
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4 mb-2">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

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

      {/* Interactive Event Planner */}
      {showInteractivePlanner && (
        <InteractiveEventPlanner
          eventId={eventId}
          event={event}
          onClose={() => setShowInteractivePlanner(false)}
          onEventUpdate={(updatedEvent) => {
            setEvent(updatedEvent);
            fetchPlanningProgress();
            fetchEventQuotes();
          }}
        />
      )}

      {/* Quick Edit Modal */}
      {showQuickEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Quick Edit Event</h3>
              <button
                onClick={() => setShowQuickEdit(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                <input
                  type="text"
                  value={quickEditData.name}
                  onChange={(e) => setQuickEditData({...quickEditData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                <input
                  type="number"
                  value={quickEditData.guest_count}
                  onChange={(e) => setQuickEditData({...quickEditData, guest_count: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  value={quickEditData.budget}
                  onChange={(e) => setQuickEditData({...quickEditData, budget: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={quickEditData.location}
                  onChange={(e) => setQuickEditData({...quickEditData, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowQuickEdit(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveQuickEdit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start New Planning Confirmation */}
      {showNewPlanningConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Start New Planning</h3>
              <button
                onClick={() => setShowNewPlanningConfirm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You're about to start a new planning session. This will create a new quote while preserving your existing progress.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">What this means:</h4>
                    <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                      <li>Your current event details will remain unchanged</li>
                      <li>You can explore different vendor combinations</li>
                      <li>Create multiple quotes to compare options</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowNewPlanningConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewPlanning}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Start New Planning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDashboard;